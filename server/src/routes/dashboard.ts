import { Router } from 'express';
import { db } from '../db';
import { dashboardLayouts, habits, habitEntries, tasks, measurements, measurementEntries, parkingLot } from '../db/schema';
import { eq, and, gte, lte, desc, asc, count } from 'drizzle-orm';

const router = Router();

// Default dashboard layout (react-grid-layout format)
const DEFAULT_LAYOUT = [
  { i: 'habit-matrix', x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 4 },
  { i: 'weekly-kanban', x: 12, y: 0, w: 12, h: 8, minW: 6, minH: 4 },
  { i: 'time-blocks', x: 0, y: 8, w: 8, h: 6, minW: 4, minH: 3 },
  { i: 'target-graph', x: 8, y: 8, w: 8, h: 6, minW: 4, minH: 3 },
  { i: 'parking-lot', x: 16, y: 8, w: 8, h: 6, minW: 4, minH: 3 },
];

// GET /api/dashboard/layout - Get active dashboard layout
router.get('/layout', async (req, res) => {
  try {
    const result = await db.query.dashboardLayouts.findFirst({
      where: eq(dashboardLayouts.isActive, true),
      orderBy: [desc(dashboardLayouts.updatedAt)],
    });

    if (!result) {
      // Return default layout if none exists
      return res.json({
        data: {
          id: 'default',
          name: 'default',
          layout: DEFAULT_LAYOUT,
          isActive: true,
        }
      });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch dashboard layout:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard layout', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/dashboard/layout - Save dashboard layout
router.put('/layout', async (req, res) => {
  try {
    const { layout, name } = req.body;

    if (!layout || !Array.isArray(layout)) {
      return res.status(400).json({ error: 'Layout array is required', code: 'VALIDATION_ERROR' });
    }

    // Validate layout items have required properties
    for (const item of layout) {
      if (!item.i || item.x === undefined || item.y === undefined || !item.w || !item.h) {
        return res.status(400).json({
          error: 'Each layout item must have i, x, y, w, and h properties',
          code: 'VALIDATION_ERROR'
        });
      }
    }

    // Find active layout and update, or create new one
    const existing = await db.query.dashboardLayouts.findFirst({
      where: eq(dashboardLayouts.isActive, true),
    });

    let result;
    if (existing) {
      [result] = await db.update(dashboardLayouts)
        .set({ layout, name: name || existing.name, updatedAt: new Date() })
        .where(eq(dashboardLayouts.id, existing.id))
        .returning();
    } else {
      [result] = await db.insert(dashboardLayouts).values({
        name: name || 'default',
        layout,
        isActive: true,
      }).returning();
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to save dashboard layout:', error);
    res.status(500).json({ error: 'Failed to save dashboard layout', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/dashboard/layout/reset - Reset dashboard layout to default
router.post('/layout/reset', async (req, res) => {
  try {
    // Deactivate all layouts
    await db.update(dashboardLayouts)
      .set({ isActive: false });

    // Create new default layout
    const [result] = await db.insert(dashboardLayouts).values({
      name: 'default',
      layout: DEFAULT_LAYOUT,
      isActive: true,
    }).returning();

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to reset dashboard layout:', error);
    res.status(500).json({ error: 'Failed to reset dashboard layout', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/dashboard/layouts - Get all saved layouts
router.get('/layouts', async (req, res) => {
  try {
    const result = await db.query.dashboardLayouts.findMany({
      orderBy: [desc(dashboardLayouts.updatedAt)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch dashboard layouts:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard layouts', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/dashboard/layouts - Create new layout preset
router.post('/layouts', async (req, res) => {
  try {
    const { name, layout, setActive } = req.body;

    if (!name || !layout) {
      return res.status(400).json({ error: 'Name and layout are required', code: 'VALIDATION_ERROR' });
    }

    // If setting as active, deactivate others
    if (setActive) {
      await db.update(dashboardLayouts)
        .set({ isActive: false });
    }

    const [result] = await db.insert(dashboardLayouts).values({
      name,
      layout,
      isActive: setActive || false,
    }).returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create dashboard layout:', error);
    res.status(500).json({ error: 'Failed to create dashboard layout', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/dashboard/layouts/:id/activate - Set a layout as active
router.put('/layouts/:id/activate', async (req, res) => {
  try {
    // Deactivate all layouts
    await db.update(dashboardLayouts)
      .set({ isActive: false });

    // Activate the selected layout
    const [result] = await db.update(dashboardLayouts)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(dashboardLayouts.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Layout not found', code: 'LAYOUT_NOT_FOUND' });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to activate layout:', error);
    res.status(500).json({ error: 'Failed to activate layout', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/dashboard/layouts/:id - Delete a layout preset
router.delete('/layouts/:id', async (req, res) => {
  try {
    const layout = await db.query.dashboardLayouts.findFirst({
      where: eq(dashboardLayouts.id, req.params.id),
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found', code: 'LAYOUT_NOT_FOUND' });
    }

    if (layout.isActive) {
      return res.status(400).json({ error: 'Cannot delete active layout', code: 'CANNOT_DELETE_ACTIVE' });
    }

    await db.delete(dashboardLayouts)
      .where(eq(dashboardLayouts.id, req.params.id));

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete layout:', error);
    res.status(500).json({ error: 'Failed to delete layout', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/dashboard/summary - Get dashboard summary data
router.get('/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Get habit statistics
    const allHabits = await db.query.habits.findMany({
      where: eq(habits.isDeleted, false),
    });

    const todayEntries = await db.query.habitEntries.findMany({
      where: eq(habitEntries.date, today),
    });

    const completedToday = todayEntries.filter(e => e.status === 'complete').length;

    // Get task statistics
    const pendingTasks = await db.query.tasks.findMany({
      where: and(eq(tasks.isDeleted, false), eq(tasks.status, 'pending')),
    });

    const tasksCompletedToday = await db.query.tasks.findMany({
      where: and(
        eq(tasks.isDeleted, false),
        eq(tasks.status, 'complete'),
        gte(tasks.completedAt, new Date(today))
      ),
    });

    // Get parking lot count
    const parkingLotItems = await db.query.parkingLot.findMany({
      where: eq(parkingLot.isDeleted, false),
    });

    // Get latest measurement entries
    const allMeasurements = await db.query.measurements.findMany({
      with: {
        entries: {
          orderBy: [desc(measurementEntries.date)],
          limit: 1,
        },
      },
    });

    const measurementSummary = allMeasurements.map(m => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      latestValue: m.entries[0]?.value || null,
      latestDate: m.entries[0]?.date || null,
    }));

    res.json({
      data: {
        date: today,
        habits: {
          total: allHabits.length,
          completedToday,
          completionRate: allHabits.length > 0
            ? Math.round((completedToday / allHabits.length) * 100)
            : 0,
        },
        tasks: {
          pending: pendingTasks.length,
          completedToday: tasksCompletedToday.length,
        },
        parkingLot: {
          count: parkingLotItems.length,
        },
        measurements: measurementSummary,
      }
    });
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/dashboard/widget/:widgetId - Get data for a specific widget
router.get('/widget/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { startDate, endDate } = req.query;

    switch (widgetId) {
      case 'habit-matrix': {
        const result = await db.query.habits.findMany({
          where: eq(habits.isDeleted, false),
          with: {
            category: true,
            entries: startDate && endDate ? {
              where: and(
                gte(habitEntries.date, startDate as string),
                lte(habitEntries.date, endDate as string)
              ),
              orderBy: [asc(habitEntries.date)],
            } : {
              orderBy: [desc(habitEntries.date)],
              limit: 30,
            },
          },
          orderBy: [asc(habits.sortOrder)],
        });
        return res.json({ data: result });
      }

      case 'weekly-kanban': {
        const weekStart = startDate || (() => {
          const d = new Date();
          d.setDate(d.getDate() - d.getDay());
          return d.toISOString().split('T')[0];
        })();
        const weekEnd = endDate || (() => {
          const d = new Date(weekStart as string);
          d.setDate(d.getDate() + 6);
          return d.toISOString().split('T')[0];
        })();

        const result = await db.query.tasks.findMany({
          where: and(
            eq(tasks.isDeleted, false),
            gte(tasks.plannedDate, weekStart as string),
            lte(tasks.plannedDate, weekEnd as string)
          ),
          with: {
            project: true,
            taskTags: { with: { tag: true } },
          },
          orderBy: [asc(tasks.sortOrder)],
        });
        return res.json({ data: result, weekStart, weekEnd });
      }

      case 'parking-lot': {
        const result = await db.query.parkingLot.findMany({
          where: eq(parkingLot.isDeleted, false),
          orderBy: [desc(parkingLot.createdAt)],
        });
        return res.json({ data: result });
      }

      default:
        return res.status(404).json({ error: 'Widget not found', code: 'WIDGET_NOT_FOUND' });
    }
  } catch (error) {
    console.error('Failed to fetch widget data:', error);
    res.status(500).json({ error: 'Failed to fetch widget data', code: 'INTERNAL_ERROR' });
  }
});

export default router;
