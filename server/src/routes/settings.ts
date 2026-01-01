import { Router } from 'express';
import { db } from '../db';
import {
  settings,
  habits,
  habitEntries,
  categories,
  tasks,
  taskTags,
  projects,
  tags,
  timeBlocks,
  timeBlockPriorities,
  measurements,
  measurementEntries,
  measurementTargets,
  parkingLot,
  dashboardLayouts,
} from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Default settings
const DEFAULT_SETTINGS: Record<string, unknown> = {
  dayBoundaryHour: 6,
  theme: 'dark',
  defaultView: 'today',
  weekStartDay: 0, // Sunday
  showCompletedTasks: true,
  showDeletedItems: false,
  habitMatrixWeeks: 4,
  kanbanDays: 7,
  autoSyncInterval: 30000, // 30 seconds
  notificationsEnabled: false,
};

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const result = await db.query.settings.findMany();

    // Convert array of key-value pairs to object
    const settingsObj: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    result.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({ data: settingsObj });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/settings/:key - Get single setting
router.get('/:key', async (req, res) => {
  try {
    const result = await db.query.settings.findFirst({
      where: eq(settings.key, req.params.key),
    });

    if (!result) {
      // Return default value if exists
      if (req.params.key in DEFAULT_SETTINGS) {
        return res.json({ data: { key: req.params.key, value: DEFAULT_SETTINGS[req.params.key] } });
      }
      return res.status(404).json({ error: 'Setting not found', code: 'SETTING_NOT_FOUND' });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch setting:', error);
    res.status(500).json({ error: 'Failed to fetch setting', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/settings/:key - Update/create single setting
router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required', code: 'VALIDATION_ERROR' });
    }

    // Validate specific settings
    if (req.params.key === 'dayBoundaryHour') {
      const hour = parseInt(value, 10);
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return res.status(400).json({ error: 'Day boundary hour must be between 0 and 23', code: 'VALIDATION_ERROR' });
      }
    }

    if (req.params.key === 'weekStartDay') {
      const day = parseInt(value, 10);
      if (isNaN(day) || day < 0 || day > 6) {
        return res.status(400).json({ error: 'Week start day must be between 0 (Sunday) and 6 (Saturday)', code: 'VALIDATION_ERROR' });
      }
    }

    if (req.params.key === 'theme') {
      if (!['light', 'dark', 'auto'].includes(value)) {
        return res.status(400).json({ error: 'Theme must be light, dark, or auto', code: 'VALIDATION_ERROR' });
      }
    }

    // Upsert pattern
    const existing = await db.query.settings.findFirst({
      where: eq(settings.key, req.params.key),
    });

    let result;
    if (existing) {
      [result] = await db.update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
        .returning();
    } else {
      [result] = await db.insert(settings).values({
        key: req.params.key,
        value,
      }).returning();
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update setting:', error);
    res.status(500).json({ error: 'Failed to update setting', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/settings - Bulk update settings
router.put('/', async (req, res) => {
  try {
    const settingsToUpdate = req.body;

    if (!settingsToUpdate || typeof settingsToUpdate !== 'object') {
      return res.status(400).json({ error: 'Settings object is required', code: 'VALIDATION_ERROR' });
    }

    const results: Array<{ key: string; value: unknown }> = [];

    for (const [key, value] of Object.entries(settingsToUpdate)) {
      const existing = await db.query.settings.findFirst({
        where: eq(settings.key, key),
      });

      let result;
      if (existing) {
        [result] = await db.update(settings)
          .set({ value, updatedAt: new Date() })
          .where(eq(settings.id, existing.id))
          .returning();
      } else {
        [result] = await db.insert(settings).values({
          key,
          value,
        }).returning();
      }
      results.push(result);
    }

    // Return all settings
    const allSettings = await db.query.settings.findMany();
    const settingsObj: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    allSettings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({ data: settingsObj });
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Failed to update settings', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/settings/:key - Reset setting to default
router.delete('/:key', async (req, res) => {
  try {
    const [result] = await db.delete(settings)
      .where(eq(settings.key, req.params.key))
      .returning();

    // Return default value if exists
    if (req.params.key in DEFAULT_SETTINGS) {
      return res.json({ data: { key: req.params.key, value: DEFAULT_SETTINGS[req.params.key], isDefault: true } });
    }

    if (!result) {
      return res.status(404).json({ error: 'Setting not found', code: 'SETTING_NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Failed to reset setting:', error);
    res.status(500).json({ error: 'Failed to reset setting', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/settings/reset - Reset all settings to defaults
router.post('/reset', async (req, res) => {
  try {
    await db.delete(settings);
    res.json({ data: DEFAULT_SETTINGS, message: 'All settings reset to defaults' });
  } catch (error) {
    console.error('Failed to reset settings:', error);
    res.status(500).json({ error: 'Failed to reset settings', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/settings/defaults - Get default settings
router.get('/defaults', async (req, res) => {
  res.json({ data: DEFAULT_SETTINGS });
});

// GET /api/settings/export - Export all user data
router.get('/export', async (req, res) => {
  try {
    // Fetch all data in parallel
    const [
      allSettings,
      allCategories,
      allHabits,
      allHabitEntries,
      allProjects,
      allTasks,
      allTags,
      allTaskTags,
      allTimeBlocks,
      allTimeBlockPriorities,
      allMeasurements,
      allMeasurementEntries,
      allMeasurementTargets,
      allParkingLot,
      allDashboardLayouts,
    ] = await Promise.all([
      db.query.settings.findMany(),
      db.query.categories.findMany(),
      db.query.habits.findMany(),
      db.query.habitEntries.findMany(),
      db.query.projects.findMany(),
      db.query.tasks.findMany(),
      db.query.tags.findMany(),
      db.select().from(taskTags),
      db.query.timeBlocks.findMany(),
      db.select().from(timeBlockPriorities),
      db.query.measurements.findMany(),
      db.select().from(measurementEntries),
      db.select().from(measurementTargets),
      db.select().from(parkingLot),
      db.select().from(dashboardLayouts),
    ]);

    // Build settings object
    const settingsObj: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    allSettings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      settings: settingsObj,
      categories: allCategories,
      habits: allHabits,
      habitEntries: allHabitEntries,
      projects: allProjects,
      tasks: allTasks,
      tags: allTags,
      taskTags: allTaskTags,
      timeBlocks: allTimeBlocks,
      timeBlockPriorities: allTimeBlockPriorities,
      measurements: allMeasurements,
      measurementEntries: allMeasurementEntries,
      measurementTargets: allMeasurementTargets,
      parkingLot: allParkingLot,
      dashboardLayouts: allDashboardLayouts,
    };

    res.json(exportData);
  } catch (error) {
    console.error('Failed to export data:', error);
    res.status(500).json({ error: 'Failed to export data', code: 'INTERNAL_ERROR' });
  }
});

export default router;
