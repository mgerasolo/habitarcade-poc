import { Router } from 'express';
import { db } from '../db';
import { parkingLot, tasks } from '../db/schema';
import { eq, asc, desc } from 'drizzle-orm';

const router = Router();

// GET /api/parking-lot - List all parking lot items
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await db.query.parkingLot.findMany({
      where: includeDeleted ? undefined : eq(parkingLot.isDeleted, false),
      orderBy: [desc(parkingLot.createdAt)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch parking lot items:', error);
    res.status(500).json({ error: 'Failed to fetch parking lot items', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/parking-lot/:id - Get single parking lot item
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.parkingLot.findFirst({
      where: eq(parkingLot.id, req.params.id),
    });
    if (!result) {
      return res.status(404).json({ error: 'Parking lot item not found', code: 'PARKING_LOT_ITEM_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch parking lot item:', error);
    res.status(500).json({ error: 'Failed to fetch parking lot item', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/parking-lot - Create parking lot item (quick capture)
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.insert(parkingLot).values({
      content: content.trim(),
    }).returning();
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create parking lot item:', error);
    res.status(500).json({ error: 'Failed to create parking lot item', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/parking-lot/:id - Update parking lot item
router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.update(parkingLot)
      .set({ content: content.trim() })
      .where(eq(parkingLot.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Parking lot item not found', code: 'PARKING_LOT_ITEM_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update parking lot item:', error);
    res.status(500).json({ error: 'Failed to update parking lot item', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/parking-lot/:id - Soft delete parking lot item
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(parkingLot)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(parkingLot.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Parking lot item not found', code: 'PARKING_LOT_ITEM_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete parking lot item:', error);
    res.status(500).json({ error: 'Failed to delete parking lot item', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/parking-lot/:id/restore - Restore soft-deleted item
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(parkingLot)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(parkingLot.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Parking lot item not found', code: 'PARKING_LOT_ITEM_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore parking lot item:', error);
    res.status(500).json({ error: 'Failed to restore parking lot item', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/parking-lot/:id/convert-to-task - Convert parking lot item to task
router.post('/:id/convert-to-task', async (req, res) => {
  try {
    const { projectId, plannedDate, priority } = req.body;

    // Get the parking lot item
    const item = await db.query.parkingLot.findFirst({
      where: eq(parkingLot.id, req.params.id),
    });

    if (!item) {
      return res.status(404).json({ error: 'Parking lot item not found', code: 'PARKING_LOT_ITEM_NOT_FOUND' });
    }

    if (item.isDeleted) {
      return res.status(400).json({ error: 'Cannot convert deleted item', code: 'ITEM_DELETED' });
    }

    // Create the task
    const [newTask] = await db.insert(tasks).values({
      title: item.content,
      projectId,
      plannedDate,
      priority,
      status: 'pending',
    }).returning();

    // Mark the parking lot item as converted (soft delete with reference)
    await db.update(parkingLot)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(parkingLot.id, req.params.id));

    // Fetch complete task with relations
    const completeTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, newTask.id),
      with: {
        project: true,
        taskTags: {
          with: { tag: true }
        }
      },
    });

    res.status(201).json({
      data: {
        task: completeTask,
        parkingLotItem: item,
      }
    });
  } catch (error) {
    console.error('Failed to convert parking lot item:', error);
    res.status(500).json({ error: 'Failed to convert parking lot item', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/parking-lot/bulk - Create multiple parking lot items
router.post('/bulk', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required', code: 'VALIDATION_ERROR' });
    }

    // Filter out empty items
    const validItems = items
      .filter((item: string) => item && item.trim() !== '')
      .map((item: string) => ({ content: item.trim() }));

    if (validItems.length === 0) {
      return res.status(400).json({ error: 'No valid items provided', code: 'VALIDATION_ERROR' });
    }

    const results = await db.insert(parkingLot)
      .values(validItems)
      .returning();

    res.status(201).json({ data: results, count: results.length });
  } catch (error) {
    console.error('Failed to create parking lot items:', error);
    res.status(500).json({ error: 'Failed to create parking lot items', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/parking-lot/bulk - Bulk delete parking lot items
router.delete('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array is required', code: 'VALIDATION_ERROR' });
    }

    const updates = ids.map((id: string) =>
      db.update(parkingLot)
        .set({ isDeleted: true, deletedAt: new Date() })
        .where(eq(parkingLot.id, id))
    );

    await Promise.all(updates);
    res.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error('Failed to bulk delete parking lot items:', error);
    res.status(500).json({ error: 'Failed to bulk delete parking lot items', code: 'INTERNAL_ERROR' });
  }
});

export default router;
