import { Router } from 'express';
import { db } from '../db';
import { habits, habitEntries, categories, settings } from '../db/schema';
import { eq, and, gte, lte, desc, lt, notInArray, inArray } from 'drizzle-orm';
import { parseMarkdownHabits, validateMarkdownContent } from '../utils/markdownParser';
import { getEffectiveDate, getDateRange, formatDateToISO } from '../utils/dateUtils';

const router = Router();

// Helper to get dayBoundaryHour setting
async function getDayBoundaryHour(): Promise<number> {
  const setting = await db.query.settings.findFirst({
    where: eq(settings.key, 'dayBoundaryHour'),
  });
  return setting?.value ? Number(setting.value) : 6;
}

// GET /api/habits - List all habits (with optional category filter)
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const categoryId = req.query.categoryId as string | undefined;

    let whereCondition = includeDeleted ? undefined : eq(habits.isDeleted, false);
    if (categoryId && !includeDeleted) {
      whereCondition = and(eq(habits.isDeleted, false), eq(habits.categoryId, categoryId));
    } else if (categoryId) {
      whereCondition = eq(habits.categoryId, categoryId);
    }

    const result = await db.query.habits.findMany({
      where: whereCondition,
      with: { category: true },
      orderBy: [habits.sortOrder],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/habits/today - Get the effective "today" date based on day boundary
router.get('/today', async (req, res) => {
  try {
    const dayBoundaryHour = await getDayBoundaryHour();
    const effectiveToday = getEffectiveDate(new Date(), dayBoundaryHour);

    res.json({
      data: {
        effectiveDate: effectiveToday,
        dayBoundaryHour,
        serverTime: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Failed to get today:', error);
    res.status(500).json({ error: 'Failed to get today', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/habits/:id - Get single habit
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.habits.findFirst({
      where: eq(habits.id, req.params.id),
      with: { category: true, entries: true },
    });
    if (!result) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch habit:', error);
    res.status(500).json({ error: 'Failed to fetch habit', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits - Create habit
router.post('/', async (req, res) => {
  try {
    const { name, categoryId, icon, iconColor, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.insert(habits).values({
      name,
      categoryId,
      icon,
      iconColor,
      sortOrder,
    }).returning();
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create habit:', error);
    res.status(500).json({ error: 'Failed to create habit', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits/import - Bulk import habits from markdown
router.post('/import', async (req, res) => {
  try {
    const { content, dryRun = false } = req.body;

    // Validate content
    const validation = validateMarkdownContent(content);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid markdown content',
        code: 'VALIDATION_ERROR',
        details: validation.errors,
      });
    }

    // Parse markdown
    const parseResult = parseMarkdownHabits(content);

    if (parseResult.errors.length > 0) {
      console.warn('Markdown parsing warnings:', parseResult.errors);
    }

    // If dry run, just return what would be imported
    if (dryRun) {
      return res.json({
        data: {
          dryRun: true,
          categories: parseResult.categories,
          habits: parseResult.habits,
          stats: parseResult.stats,
          warnings: parseResult.errors,
        }
      });
    }

    // Create categories first
    const categoryMap = new Map<string, string>(); // name -> id

    for (const cat of parseResult.categories) {
      // Check if category already exists
      const existing = await db.query.categories.findFirst({
        where: eq(categories.name, cat.name),
      });

      if (existing) {
        categoryMap.set(cat.name, existing.id);
      } else {
        const [newCat] = await db.insert(categories).values({
          name: cat.name,
          sortOrder: cat.sortOrder,
        }).returning();
        categoryMap.set(cat.name, newCat.id);
      }
    }

    // Create habits
    const createdHabits: Array<typeof habits.$inferSelect> = [];
    const skippedHabits: string[] = [];

    for (const habit of parseResult.habits) {
      // Check if habit already exists
      const existing = await db.query.habits.findFirst({
        where: eq(habits.name, habit.name),
      });

      if (existing) {
        skippedHabits.push(habit.name);
        continue;
      }

      const categoryId = habit.categoryName
        ? categoryMap.get(habit.categoryName) || null
        : null;

      const [newHabit] = await db.insert(habits).values({
        name: habit.name,
        categoryId,
        sortOrder: habit.sortOrder,
      }).returning();

      createdHabits.push(newHabit);
    }

    res.status(201).json({
      data: {
        created: {
          categories: parseResult.categories.length - Array.from(categoryMap.values()).filter((id, i, arr) => arr.indexOf(id) === i).length,
          habits: createdHabits.length,
        },
        skipped: {
          habits: skippedHabits,
        },
        stats: parseResult.stats,
        warnings: parseResult.errors,
      }
    });
  } catch (error) {
    console.error('Failed to import habits:', error);
    res.status(500).json({ error: 'Failed to import habits', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/habits/:id - Update habit
router.put('/:id', async (req, res) => {
  try {
    const { name, categoryId, icon, iconColor, sortOrder } = req.body;
    const [result] = await db.update(habits)
      .set({ name, categoryId, icon, iconColor, sortOrder, updatedAt: new Date() })
      .where(eq(habits.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update habit:', error);
    res.status(500).json({ error: 'Failed to update habit', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/habits/:id - Soft delete habit
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(habits)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(habits.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete habit:', error);
    res.status(500).json({ error: 'Failed to delete habit', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits/:id/entries - Create/update habit entry for a date
router.post('/:id/entries', async (req, res) => {
  try {
    const { date, status, notes } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required', code: 'VALIDATION_ERROR' });
    }

    // Verify habit exists
    const habit = await db.query.habits.findFirst({
      where: eq(habits.id, req.params.id),
    });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }

    // Upsert pattern - update if exists, insert if not
    const existing = await db.query.habitEntries.findFirst({
      where: and(eq(habitEntries.habitId, req.params.id), eq(habitEntries.date, date)),
    });

    let result;
    if (existing) {
      [result] = await db.update(habitEntries)
        .set({ status, notes, updatedAt: new Date() })
        .where(eq(habitEntries.id, existing.id))
        .returning();
    } else {
      [result] = await db.insert(habitEntries).values({
        habitId: req.params.id,
        date,
        status: status || 'empty',
        notes,
      }).returning();
    }
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create entry:', error);
    res.status(500).json({ error: 'Failed to create entry', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/habits/:id/entries - Get entries for date range
router.get('/:id/entries', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where conditions
    const conditions = [eq(habitEntries.habitId, req.params.id)];
    if (startDate) {
      conditions.push(gte(habitEntries.date, startDate as string));
    }
    if (endDate) {
      conditions.push(lte(habitEntries.date, endDate as string));
    }

    const result = await db.query.habitEntries.findMany({
      where: and(...conditions),
      orderBy: [desc(habitEntries.date)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits/auto-fill-missed - Auto-fill past unfilled days with 'missed' status (pink)
router.post('/auto-fill-missed', async (req, res) => {
  try {
    const { startDate, habitIds, status = 'missed' } = req.body;

    // Get day boundary hour
    const dayBoundaryHour = await getDayBoundaryHour();
    const effectiveToday = getEffectiveDate(new Date(), dayBoundaryHour);

    // Determine start date (default to 30 days ago)
    const start = startDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return formatDateToISO(d);
    })();

    // Get all active habits or filter by habitIds
    let habitsToProcess;
    if (habitIds && Array.isArray(habitIds) && habitIds.length > 0) {
      habitsToProcess = await db.query.habits.findMany({
        where: and(
          eq(habits.isDeleted, false),
          inArray(habits.id, habitIds)
        ),
      });
    } else {
      habitsToProcess = await db.query.habits.findMany({
        where: eq(habits.isDeleted, false),
      });
    }

    if (habitsToProcess.length === 0) {
      return res.json({
        data: {
          message: 'No habits to process',
          filled: 0,
        }
      });
    }

    // Generate date range from start to yesterday (not including today)
    const dateRange = getDateRange(start, effectiveToday);
    // Remove today from the range - we only fill past days
    const pastDates = dateRange.filter(d => d < effectiveToday);

    let filledCount = 0;
    const filledEntries: Array<{ habitId: string; date: string }> = [];

    for (const habit of habitsToProcess) {
      // Get existing entries for this habit in the date range
      const existingEntries = await db.query.habitEntries.findMany({
        where: and(
          eq(habitEntries.habitId, habit.id),
          gte(habitEntries.date, start),
          lt(habitEntries.date, effectiveToday)
        ),
      });

      const existingDates = new Set(existingEntries.map(e => e.date));

      // Find missing dates
      const missingDates = pastDates.filter(d => !existingDates.has(d));

      // Create entries for missing dates
      for (const date of missingDates) {
        await db.insert(habitEntries).values({
          habitId: habit.id,
          date,
          status,
        });
        filledCount++;
        filledEntries.push({ habitId: habit.id, date });
      }
    }

    res.json({
      data: {
        message: `Auto-filled ${filledCount} entries with status '${status}'`,
        filled: filledCount,
        dateRange: {
          start,
          end: effectiveToday,
        },
        habitsProcessed: habitsToProcess.length,
        entries: filledEntries.slice(0, 100), // Return first 100 for reference
      }
    });
  } catch (error) {
    console.error('Failed to auto-fill missed:', error);
    res.status(500).json({ error: 'Failed to auto-fill missed entries', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits/:id/auto-fill-missed - Auto-fill missed entries for a single habit
router.post('/:id/auto-fill-missed', async (req, res) => {
  try {
    const { startDate, status = 'missed' } = req.body;

    // Verify habit exists
    const habit = await db.query.habits.findFirst({
      where: eq(habits.id, req.params.id),
    });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }

    // Get day boundary hour
    const dayBoundaryHour = await getDayBoundaryHour();
    const effectiveToday = getEffectiveDate(new Date(), dayBoundaryHour);

    // Determine start date (default to habit creation date or 30 days ago)
    const start = startDate || (() => {
      const createdAt = habit.createdAt ? formatDateToISO(new Date(habit.createdAt)) : null;
      const thirtyDaysAgo = formatDateToISO(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      return createdAt && createdAt > thirtyDaysAgo ? createdAt : thirtyDaysAgo;
    })();

    // Generate date range from start to yesterday
    const dateRange = getDateRange(start, effectiveToday);
    const pastDates = dateRange.filter(d => d < effectiveToday);

    // Get existing entries
    const existingEntries = await db.query.habitEntries.findMany({
      where: and(
        eq(habitEntries.habitId, req.params.id),
        gte(habitEntries.date, start),
        lt(habitEntries.date, effectiveToday)
      ),
    });

    const existingDates = new Set(existingEntries.map(e => e.date));
    const missingDates = pastDates.filter(d => !existingDates.has(d));

    // Create entries for missing dates
    const filledEntries: Array<typeof habitEntries.$inferSelect> = [];
    for (const date of missingDates) {
      const [entry] = await db.insert(habitEntries).values({
        habitId: req.params.id,
        date,
        status,
      }).returning();
      filledEntries.push(entry);
    }

    res.json({
      data: {
        message: `Auto-filled ${filledEntries.length} entries with status '${status}'`,
        filled: filledEntries.length,
        dateRange: {
          start,
          end: effectiveToday,
        },
        entries: filledEntries,
      }
    });
  } catch (error) {
    console.error('Failed to auto-fill missed for habit:', error);
    res.status(500).json({ error: 'Failed to auto-fill missed entries', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/habits/:id/restore - Restore soft-deleted habit
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(habits)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(habits.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore habit:', error);
    res.status(500).json({ error: 'Failed to restore habit', code: 'INTERNAL_ERROR' });
  }
});

export default router;
