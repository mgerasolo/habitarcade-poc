import { Router } from 'express';
import { db } from '../db';
import { timeBlocks, timeBlockPriorities, tasks, habitEntries } from '../db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

const router = Router();

// GET /api/time-blocks - List all time blocks
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await db.query.timeBlocks.findMany({
      where: includeDeleted ? undefined : eq(timeBlocks.isDeleted, false),
      with: {
        linkedHabit: true,
        priorities: {
          orderBy: [asc(timeBlockPriorities.sortOrder)],
        },
      },
      orderBy: [asc(timeBlocks.sortOrder)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch time blocks:', error);
    res.status(500).json({ error: 'Failed to fetch time blocks', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/time-blocks/:id - Get single time block
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, req.params.id),
      with: {
        linkedHabit: true,
        priorities: {
          orderBy: [asc(timeBlockPriorities.sortOrder)],
        },
        tasks: {
          where: eq(tasks.isDeleted, false),
          orderBy: [asc(tasks.sortOrder)],
        },
      },
    });
    if (!result) {
      return res.status(404).json({ error: 'Time block not found', code: 'TIME_BLOCK_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch time block:', error);
    res.status(500).json({ error: 'Failed to fetch time block', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/time-blocks - Create time block
router.post('/', async (req, res) => {
  try {
    const { name, durationMinutes, linkedHabitId, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }
    if (!durationMinutes || durationMinutes <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.insert(timeBlocks).values({
      name,
      durationMinutes,
      linkedHabitId,
      sortOrder,
    }).returning();

    // Fetch complete time block with relations
    const completeBlock = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, result.id),
      with: { linkedHabit: true },
    });

    res.status(201).json({ data: completeBlock });
  } catch (error) {
    console.error('Failed to create time block:', error);
    res.status(500).json({ error: 'Failed to create time block', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/time-blocks/:id - Update time block
router.put('/:id', async (req, res) => {
  try {
    const { name, durationMinutes, linkedHabitId, sortOrder } = req.body;
    const [result] = await db.update(timeBlocks)
      .set({ name, durationMinutes, linkedHabitId, sortOrder, updatedAt: new Date() })
      .where(eq(timeBlocks.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Time block not found', code: 'TIME_BLOCK_NOT_FOUND' });
    }

    // Fetch complete time block with relations
    const completeBlock = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, req.params.id),
      with: { linkedHabit: true },
    });

    res.json({ data: completeBlock });
  } catch (error) {
    console.error('Failed to update time block:', error);
    res.status(500).json({ error: 'Failed to update time block', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/time-blocks/:id - Soft delete time block
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(timeBlocks)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(timeBlocks.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Time block not found', code: 'TIME_BLOCK_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete time block:', error);
    res.status(500).json({ error: 'Failed to delete time block', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/time-blocks/:id/restore - Restore soft-deleted time block
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(timeBlocks)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(timeBlocks.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Time block not found', code: 'TIME_BLOCK_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore time block:', error);
    res.status(500).json({ error: 'Failed to restore time block', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/time-blocks/:id/complete - Complete time block (and linked habit)
router.post('/:id/complete', async (req, res) => {
  try {
    const { date } = req.body;
    const today = date || new Date().toISOString().split('T')[0];

    const block = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, req.params.id),
      with: { linkedHabit: true },
    });

    if (!block) {
      return res.status(404).json({ error: 'Time block not found', code: 'TIME_BLOCK_NOT_FOUND' });
    }

    // If there's a linked habit, mark it as complete for today
    if (block.linkedHabitId) {
      const existingEntry = await db.query.habitEntries.findFirst({
        where: and(
          eq(habitEntries.habitId, block.linkedHabitId),
          eq(habitEntries.date, today)
        ),
      });

      if (existingEntry) {
        await db.update(habitEntries)
          .set({ status: 'complete', updatedAt: new Date() })
          .where(eq(habitEntries.id, existingEntry.id));
      } else {
        await db.insert(habitEntries).values({
          habitId: block.linkedHabitId,
          date: today,
          status: 'complete',
        });
      }
    }

    res.json({ data: { completed: true, date: today, linkedHabitCompleted: !!block.linkedHabitId } });
  } catch (error) {
    console.error('Failed to complete time block:', error);
    res.status(500).json({ error: 'Failed to complete time block', code: 'INTERNAL_ERROR' });
  }
});

// === Priority Items ===

// GET /api/time-blocks/:id/priorities - Get priorities for a time block
router.get('/:id/priorities', async (req, res) => {
  try {
    const result = await db.query.timeBlockPriorities.findMany({
      where: eq(timeBlockPriorities.blockId, req.params.id),
      orderBy: [asc(timeBlockPriorities.sortOrder)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch priorities:', error);
    res.status(500).json({ error: 'Failed to fetch priorities', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/time-blocks/:id/priorities - Add priority to time block
router.post('/:id/priorities', async (req, res) => {
  try {
    const { title, sortOrder } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required', code: 'VALIDATION_ERROR' });
    }

    // Verify time block exists
    const block = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, req.params.id),
    });
    if (!block) {
      return res.status(404).json({ error: 'Time block not found', code: 'TIME_BLOCK_NOT_FOUND' });
    }

    const [result] = await db.insert(timeBlockPriorities).values({
      blockId: req.params.id,
      title,
      sortOrder,
    }).returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create priority:', error);
    res.status(500).json({ error: 'Failed to create priority', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/time-blocks/:blockId/priorities/:priorityId - Update priority
router.put('/:blockId/priorities/:priorityId', async (req, res) => {
  try {
    const { title, sortOrder, completedAt } = req.body;
    const [result] = await db.update(timeBlockPriorities)
      .set({ title, sortOrder, completedAt })
      .where(and(
        eq(timeBlockPriorities.id, req.params.priorityId),
        eq(timeBlockPriorities.blockId, req.params.blockId)
      ))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Priority not found', code: 'PRIORITY_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update priority:', error);
    res.status(500).json({ error: 'Failed to update priority', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/time-blocks/:blockId/priorities/:priorityId/complete - Complete priority
router.patch('/:blockId/priorities/:priorityId/complete', async (req, res) => {
  try {
    const [result] = await db.update(timeBlockPriorities)
      .set({ completedAt: new Date() })
      .where(and(
        eq(timeBlockPriorities.id, req.params.priorityId),
        eq(timeBlockPriorities.blockId, req.params.blockId)
      ))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Priority not found', code: 'PRIORITY_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to complete priority:', error);
    res.status(500).json({ error: 'Failed to complete priority', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/time-blocks/:blockId/priorities/:priorityId - Delete priority
router.delete('/:blockId/priorities/:priorityId', async (req, res) => {
  try {
    const [result] = await db.delete(timeBlockPriorities)
      .where(and(
        eq(timeBlockPriorities.id, req.params.priorityId),
        eq(timeBlockPriorities.blockId, req.params.blockId)
      ))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Priority not found', code: 'PRIORITY_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete priority:', error);
    res.status(500).json({ error: 'Failed to delete priority', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/time-blocks/reorder - Reorder time blocks
router.put('/reorder', async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array', code: 'VALIDATION_ERROR' });
    }

    const updates = order.map(async (item: { id: string; sortOrder: number }) => {
      return db.update(timeBlocks)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(timeBlocks.id, item.id));
    });

    await Promise.all(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder time blocks:', error);
    res.status(500).json({ error: 'Failed to reorder time blocks', code: 'INTERNAL_ERROR' });
  }
});

export default router;
