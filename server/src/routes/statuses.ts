import { Router } from 'express';
import { db } from '../db';
import { taskStatuses, tasks } from '../db/schema';
import { eq, and, asc, isNull, count } from 'drizzle-orm';

const router = Router();

// Default statuses to seed if none exist
const DEFAULT_STATUSES = [
  {
    name: 'Backlog',
    color: '#64748b', // slate-500
    icon: 'Inbox',
    workflowOrder: 0,
    isBreakout: false,
    isDefault: true,
    isInitialStatus: true,
    sortOrder: 0,
  },
  {
    name: 'To Do',
    color: '#3b82f6', // blue-500
    icon: 'List',
    workflowOrder: 1,
    isBreakout: false,
    isDefault: true,
    isInitialStatus: false,
    sortOrder: 1,
  },
  {
    name: 'In Progress',
    color: '#f59e0b', // amber-500
    icon: 'PlayCircle',
    workflowOrder: 2,
    isBreakout: false,
    isDefault: true,
    isInitialStatus: false,
    sortOrder: 2,
  },
  {
    name: 'Blocked',
    color: '#ef4444', // red-500
    icon: 'Block',
    workflowOrder: null,
    isBreakout: true,
    isDefault: true,
    isInitialStatus: false,
    sortOrder: 3,
    // breakoutParentId will be set after "In Progress" is created
  },
  {
    name: 'Waiting',
    color: '#a855f7', // purple-500
    icon: 'HourglassEmpty',
    workflowOrder: null,
    isBreakout: true,
    isDefault: true,
    isInitialStatus: false,
    sortOrder: 4,
    // breakoutParentId will be set after "In Progress" is created
  },
  {
    name: 'Review',
    color: '#14b8a6', // teal-500
    icon: 'RateReview',
    workflowOrder: 3,
    isBreakout: false,
    isDefault: true,
    isInitialStatus: false,
    sortOrder: 5,
  },
  {
    name: 'Complete',
    color: '#10b981', // emerald-500
    icon: 'CheckCircle',
    workflowOrder: 4,
    isBreakout: false,
    isDefault: true,
    isInitialStatus: false,
    sortOrder: 6,
  },
];

// Helper to seed default statuses
async function seedDefaultStatuses() {
  const existing = await db.query.taskStatuses.findFirst();
  if (existing) return; // Already seeded

  console.log('Seeding default task statuses...');

  // Insert non-breakout statuses first
  const mainStatuses = DEFAULT_STATUSES.filter(s => !s.isBreakout);
  const insertedMain: Record<string, string> = {};

  for (const status of mainStatuses) {
    const [inserted] = await db.insert(taskStatuses).values(status).returning();
    insertedMain[status.name] = inserted.id;
  }

  // Now insert breakout statuses with their parent reference
  const breakoutStatuses = DEFAULT_STATUSES.filter(s => s.isBreakout);
  const inProgressId = insertedMain['In Progress'];

  for (const status of breakoutStatuses) {
    await db.insert(taskStatuses).values({
      ...status,
      breakoutParentId: inProgressId,
    });
  }

  console.log('Default task statuses seeded successfully');
}

// GET /api/statuses - List all statuses
router.get('/', async (req, res) => {
  try {
    // Seed defaults if none exist
    await seedDefaultStatuses();

    const includeDeleted = req.query.includeDeleted === 'true';

    const conditions = [];
    if (!includeDeleted) {
      conditions.push(eq(taskStatuses.isDeleted, false));
    }

    const result = await db.query.taskStatuses.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        breakoutParent: true,
        breakoutChildren: {
          where: eq(taskStatuses.isDeleted, false),
        },
      },
      orderBy: [asc(taskStatuses.sortOrder)],
    });

    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch statuses:', error);
    res.status(500).json({ error: 'Failed to fetch statuses', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/statuses/workflow - Get statuses organized by workflow
router.get('/workflow', async (req, res) => {
  try {
    await seedDefaultStatuses();

    const allStatuses = await db.query.taskStatuses.findMany({
      where: eq(taskStatuses.isDeleted, false),
      with: {
        breakoutChildren: {
          where: eq(taskStatuses.isDeleted, false),
        },
      },
      orderBy: [asc(taskStatuses.sortOrder)],
    });

    // Separate main workflow and breakouts
    const mainWorkflow = allStatuses.filter(s => !s.isBreakout);
    const breakouts = allStatuses.filter(s => s.isBreakout);

    res.json({
      data: {
        mainWorkflow,
        breakouts,
        all: allStatuses,
      },
    });
  } catch (error) {
    console.error('Failed to fetch workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/statuses/:id - Get single status
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.taskStatuses.findFirst({
      where: eq(taskStatuses.id, req.params.id),
      with: {
        breakoutParent: true,
        breakoutChildren: true,
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'Status not found', code: 'STATUS_NOT_FOUND' });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch status:', error);
    res.status(500).json({ error: 'Failed to fetch status', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/statuses - Create status
router.post('/', async (req, res) => {
  try {
    const {
      name,
      color,
      icon,
      workflowOrder,
      isBreakout,
      breakoutParentId,
      isInitialStatus,
      sortOrder,
    } = req.body;

    if (!name || !color) {
      return res.status(400).json({
        error: 'Name and color are required',
        code: 'VALIDATION_ERROR',
      });
    }

    // If this is marked as initial status, unset any existing initial status
    if (isInitialStatus) {
      await db.update(taskStatuses)
        .set({ isInitialStatus: false })
        .where(eq(taskStatuses.isInitialStatus, true));
    }

    // Calculate sortOrder if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const maxOrder = await db.query.taskStatuses.findFirst({
        orderBy: [asc(taskStatuses.sortOrder)],
      });
      finalSortOrder = (maxOrder?.sortOrder ?? -1) + 1;
    }

    const [result] = await db.insert(taskStatuses).values({
      name,
      color,
      icon,
      workflowOrder: isBreakout ? null : workflowOrder,
      isBreakout: isBreakout ?? false,
      breakoutParentId: isBreakout ? breakoutParentId : null,
      isInitialStatus: isInitialStatus ?? false,
      sortOrder: finalSortOrder,
    }).returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create status:', error);
    res.status(500).json({ error: 'Failed to create status', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/statuses/:id - Update status
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      color,
      icon,
      workflowOrder,
      isBreakout,
      breakoutParentId,
      isInitialStatus,
      sortOrder,
    } = req.body;

    // Check if status exists
    const existing = await db.query.taskStatuses.findFirst({
      where: eq(taskStatuses.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Status not found', code: 'STATUS_NOT_FOUND' });
    }

    // If this is marked as initial status, unset any existing initial status
    if (isInitialStatus && !existing.isInitialStatus) {
      await db.update(taskStatuses)
        .set({ isInitialStatus: false })
        .where(eq(taskStatuses.isInitialStatus, true));
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (workflowOrder !== undefined) updateData.workflowOrder = isBreakout ? null : workflowOrder;
    if (isBreakout !== undefined) updateData.isBreakout = isBreakout;
    if (breakoutParentId !== undefined) updateData.breakoutParentId = isBreakout ? breakoutParentId : null;
    if (isInitialStatus !== undefined) updateData.isInitialStatus = isInitialStatus;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [result] = await db.update(taskStatuses)
      .set(updateData)
      .where(eq(taskStatuses.id, req.params.id))
      .returning();

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update status:', error);
    res.status(500).json({ error: 'Failed to update status', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/statuses/:id - Soft delete status
router.delete('/:id', async (req, res) => {
  try {
    // Check if status exists
    const existing = await db.query.taskStatuses.findFirst({
      where: eq(taskStatuses.id, req.params.id),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Status not found', code: 'STATUS_NOT_FOUND' });
    }

    // Prevent deletion of default system statuses
    if (existing.isDefault) {
      return res.status(400).json({
        error: 'Cannot delete default system status',
        code: 'CANNOT_DELETE_DEFAULT',
      });
    }

    // Check if any tasks are using this status
    const taskCount = await db.select({ count: count() })
      .from(tasks)
      .where(and(
        eq(tasks.statusId, req.params.id),
        eq(tasks.isDeleted, false)
      ));

    if (taskCount[0]?.count > 0) {
      return res.status(400).json({
        error: `Cannot delete status: ${taskCount[0].count} tasks are using it`,
        code: 'STATUS_IN_USE',
      });
    }

    // Soft delete
    const [result] = await db.update(taskStatuses)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(taskStatuses.id, req.params.id))
      .returning();

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete status:', error);
    res.status(500).json({ error: 'Failed to delete status', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/statuses/reorder - Reorder statuses
router.put('/reorder', async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, sortOrder, workflowOrder? }

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array', code: 'VALIDATION_ERROR' });
    }

    const updates = order.map(async (item: { id: string; sortOrder: number; workflowOrder?: number }) => {
      const updateData: Record<string, unknown> = {
        sortOrder: item.sortOrder,
        updatedAt: new Date(),
      };
      if (item.workflowOrder !== undefined) {
        updateData.workflowOrder = item.workflowOrder;
      }
      return db.update(taskStatuses)
        .set(updateData)
        .where(eq(taskStatuses.id, item.id));
    });

    await Promise.all(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder statuses:', error);
    res.status(500).json({ error: 'Failed to reorder statuses', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/statuses/:id/restore - Restore soft-deleted status
router.post('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(taskStatuses)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(taskStatuses.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Status not found', code: 'STATUS_NOT_FOUND' });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore status:', error);
    res.status(500).json({ error: 'Failed to restore status', code: 'INTERNAL_ERROR' });
  }
});

export default router;
