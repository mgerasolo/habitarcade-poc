import { Router } from 'express';
import { db } from '../db';
import { habits, habitEntries } from '../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

const router = Router();

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
    const { name, categoryId, icon, iconColor, sortOrder, goalTarget, goalFrequency, goalDays, links, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.insert(habits).values({
      name,
      categoryId,
      icon,
      iconColor,
      sortOrder,
      goalTarget,
      goalFrequency,
      goalDays,
      links,
      description,
    }).returning();
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create habit:', error);
    res.status(500).json({ error: 'Failed to create habit', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/habits/:id - Update habit
router.put('/:id', async (req, res) => {
  try {
    const { name, categoryId, icon, iconColor, sortOrder, goalTarget, goalFrequency, goalDays, links, description } = req.body;
    const [result] = await db.update(habits)
      .set({
        name,
        categoryId,
        icon,
        iconColor,
        sortOrder,
        goalTarget,
        goalFrequency,
        goalDays,
        links,
        description,
        updatedAt: new Date()
      })
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
