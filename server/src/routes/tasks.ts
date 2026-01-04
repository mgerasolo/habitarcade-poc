import { Router } from 'express';
import { db } from '../db';
import { tasks, taskTags } from '../db/schema';
import { eq, and, gte, lte, desc, asc, isNull } from 'drizzle-orm';

const router = Router();

// GET /api/tasks - List all tasks (with optional filters)
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const projectId = req.query.projectId as string | undefined;
    const timeBlockId = req.query.timeBlockId as string | undefined;
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Build where conditions
    const conditions = [];
    if (!includeDeleted) {
      conditions.push(eq(tasks.isDeleted, false));
    }
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }
    if (timeBlockId) {
      conditions.push(eq(tasks.timeBlockId, timeBlockId));
    }
    if (status) {
      conditions.push(eq(tasks.status, status));
    }
    if (startDate) {
      conditions.push(gte(tasks.plannedDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(tasks.plannedDate, endDate));
    }

    const result = await db.query.tasks.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        project: true,
        timeBlock: true,
        taskStatus: true,
        taskTags: {
          with: { tag: true }
        },
        children: {
          with: {
            project: true,
            taskStatus: true,
            taskTags: { with: { tag: true } }
          }
        }
      },
      orderBy: [asc(tasks.sortOrder), desc(tasks.createdAt)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/tasks/unscheduled - Get unscheduled tasks (for parking lot)
router.get('/unscheduled', async (req, res) => {
  try {
    const result = await db.query.tasks.findMany({
      where: and(
        eq(tasks.isDeleted, false),
        isNull(tasks.plannedDate)
      ),
      with: {
        project: true,
        taskStatus: true,
        taskTags: {
          with: { tag: true }
        },
        children: {
          with: {
            project: true,
            taskStatus: true,
            taskTags: { with: { tag: true } }
          }
        }
      },
      orderBy: [asc(tasks.sortOrder), desc(tasks.createdAt)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch unscheduled tasks:', error);
    res.status(500).json({ error: 'Failed to fetch unscheduled tasks', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/tasks/week/:weekStart - Get tasks for a specific week
router.get('/week/:weekStart', async (req, res) => {
  try {
    const weekStart = new Date(req.params.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const result = await db.query.tasks.findMany({
      where: and(
        eq(tasks.isDeleted, false),
        gte(tasks.plannedDate, weekStart.toISOString().split('T')[0]),
        lte(tasks.plannedDate, weekEnd.toISOString().split('T')[0])
      ),
      with: {
        project: true,
        timeBlock: true,
        taskStatus: true,
        taskTags: {
          with: { tag: true }
        },
        children: {
          with: {
            project: true,
            taskStatus: true,
            taskTags: { with: { tag: true } }
          }
        }
      },
      orderBy: [asc(tasks.sortOrder)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch weekly tasks:', error);
    res.status(500).json({ error: 'Failed to fetch weekly tasks', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.tasks.findFirst({
      where: eq(tasks.id, req.params.id),
      with: {
        project: true,
        timeBlock: true,
        taskStatus: true,
        taskTags: {
          with: { tag: true }
        },
        parent: true,
        children: {
          with: {
            project: true,
            taskStatus: true,
            taskTags: { with: { tag: true } }
          }
        }
      },
    });
    if (!result) {
      return res.status(404).json({ error: 'Task not found', code: 'TASK_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch task:', error);
    res.status(500).json({ error: 'Failed to fetch task', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, plannedDate, status, statusId, parentTaskId, priority, projectId, timeBlockId, sortOrder, tagIds } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required', code: 'VALIDATION_ERROR' });
    }

    // Validate parentTaskId exists if provided
    if (parentTaskId) {
      const parentExists = await db.query.tasks.findFirst({
        where: eq(tasks.id, parentTaskId),
      });
      if (!parentExists) {
        return res.status(400).json({ error: 'Parent task not found', code: 'VALIDATION_ERROR' });
      }
    }

    const [result] = await db.insert(tasks).values({
      title,
      description,
      plannedDate,
      status: status || 'pending',
      statusId,
      parentTaskId,
      priority,
      projectId,
      timeBlockId,
      sortOrder,
    }).returning();

    // Add tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const tagInserts = tagIds.map((tagId: string) => ({
        taskId: result.id,
        tagId,
      }));
      await db.insert(taskTags).values(tagInserts);
    }

    // Fetch the complete task with relations
    const completeTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, result.id),
      with: {
        project: true,
        timeBlock: true,
        taskStatus: true,
        taskTags: {
          with: { tag: true }
        },
        parent: true,
        children: {
          with: {
            project: true,
            taskStatus: true,
            taskTags: { with: { tag: true } }
          }
        }
      },
    });

    res.status(201).json({ data: completeTask });
  } catch (error) {
    console.error('Failed to create task:', error);
    res.status(500).json({ error: 'Failed to create task', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, plannedDate, status, statusId, parentTaskId, completedAt, priority, projectId, timeBlockId, sortOrder, tagIds } = req.body;

    console.log('PUT /api/tasks/:id - body:', req.body);
    console.log('PUT /api/tasks/:id - statusId:', statusId);

    // Validate parentTaskId - can't be self or create circular reference
    if (parentTaskId !== undefined && parentTaskId !== null) {
      if (parentTaskId === req.params.id) {
        return res.status(400).json({ error: 'Task cannot be its own parent', code: 'VALIDATION_ERROR' });
      }
      const parentExists = await db.query.tasks.findFirst({
        where: eq(tasks.id, parentTaskId),
      });
      if (!parentExists) {
        return res.status(400).json({ error: 'Parent task not found', code: 'VALIDATION_ERROR' });
      }
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (plannedDate !== undefined) updateData.plannedDate = plannedDate;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'complete') {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (statusId !== undefined) updateData.statusId = statusId;
    if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId;
    console.log('PUT /api/tasks/:id - updateData:', updateData);
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (timeBlockId !== undefined) updateData.timeBlockId = timeBlockId;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [result] = await db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Task not found', code: 'TASK_NOT_FOUND' });
    }

    // Update tags if provided
    if (tagIds !== undefined && Array.isArray(tagIds)) {
      // Remove existing tags
      await db.delete(taskTags).where(eq(taskTags.taskId, req.params.id));

      // Add new tags
      if (tagIds.length > 0) {
        const tagInserts = tagIds.map((tagId: string) => ({
          taskId: req.params.id,
          tagId,
        }));
        await db.insert(taskTags).values(tagInserts);
      }
    }

    // Fetch the complete task with relations
    const completeTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, req.params.id),
      with: {
        project: true,
        timeBlock: true,
        taskStatus: true,
        taskTags: {
          with: { tag: true }
        },
        parent: true,
        children: {
          with: {
            project: true,
            taskStatus: true,
            taskTags: { with: { tag: true } }
          }
        }
      },
    });

    res.json({ data: completeTask });
  } catch (error) {
    console.error('Failed to update task:', error);
    res.status(500).json({ error: 'Failed to update task', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/tasks/:id/status - Quick status update
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required', code: 'VALIDATION_ERROR' });
    }

    const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === 'complete') {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    const [result] = await db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Task not found', code: 'TASK_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update task status:', error);
    res.status(500).json({ error: 'Failed to update task status', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/tasks/:id/schedule - Schedule/reschedule a task
router.patch('/:id/schedule', async (req, res) => {
  try {
    const { plannedDate, timeBlockId } = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (plannedDate !== undefined) updateData.plannedDate = plannedDate;
    if (timeBlockId !== undefined) updateData.timeBlockId = timeBlockId;

    const [result] = await db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Task not found', code: 'TASK_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to schedule task:', error);
    res.status(500).json({ error: 'Failed to schedule task', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/tasks/:id - Soft delete task
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(tasks)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(tasks.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Task not found', code: 'TASK_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({ error: 'Failed to delete task', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/tasks/:id/restore - Restore soft-deleted task
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(tasks)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(tasks.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Task not found', code: 'TASK_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore task:', error);
    res.status(500).json({ error: 'Failed to restore task', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/tasks/reorder - Reorder tasks
router.put('/reorder', async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array', code: 'VALIDATION_ERROR' });
    }

    const updates = order.map(async (item: { id: string; sortOrder: number }) => {
      return db.update(tasks)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(tasks.id, item.id));
    });

    await Promise.all(updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks', code: 'INTERNAL_ERROR' });
  }
});

export default router;
