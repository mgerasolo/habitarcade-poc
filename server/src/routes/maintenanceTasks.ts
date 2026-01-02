import { Router } from 'express';
import { db } from '../db';
import { maintenanceTasks, maintenanceTaskCompletions } from '../db/schema';
import { eq, desc, and, lte, isNull, or } from 'drizzle-orm';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

const router = Router();

// Calculate next due date based on frequency
function calculateNextDue(frequency: string, frequencyDays?: number | null): Date {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return addDays(now, 1);
    case 'weekly':
      return addWeeks(now, 1);
    case 'biweekly':
      return addWeeks(now, 2);
    case 'monthly':
      return addMonths(now, 1);
    case 'quarterly':
      return addMonths(now, 3);
    case 'yearly':
      return addYears(now, 1);
    case 'custom':
      return addDays(now, frequencyDays || 7);
    default:
      return addWeeks(now, 1);
  }
}

// GET /api/maintenance-tasks - List all maintenance tasks
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const overdueOnly = req.query.overdueOnly === 'true';
    const location = req.query.location as string | undefined;

    let whereCondition = includeDeleted ? undefined : eq(maintenanceTasks.isDeleted, false);

    if (location) {
      whereCondition = and(
        whereCondition,
        eq(maintenanceTasks.location, location)
      );
    }

    const result = await db.query.maintenanceTasks.findMany({
      where: whereCondition,
      with: { completions: { orderBy: [desc(maintenanceTaskCompletions.completedAt)], limit: 5 } },
      orderBy: [maintenanceTasks.nextDueAt, maintenanceTasks.sortOrder],
    });

    // Filter for overdue if requested
    const filtered = overdueOnly
      ? result.filter(t => t.nextDueAt && new Date(t.nextDueAt) < new Date())
      : result;

    res.json({ data: filtered, count: filtered.length });
  } catch (error) {
    console.error('Failed to fetch maintenance tasks:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance tasks', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/maintenance-tasks/:id - Get single maintenance task
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, req.params.id),
      with: { completions: { orderBy: [desc(maintenanceTaskCompletions.completedAt)] } },
    });
    if (!result) {
      return res.status(404).json({ error: 'Maintenance task not found', code: 'NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch maintenance task:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance task', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/maintenance-tasks - Create maintenance task
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, iconColor, frequency, frequencyDays, location, priority, estimatedMinutes, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }
    if (!frequency) {
      return res.status(400).json({ error: 'Frequency is required', code: 'VALIDATION_ERROR' });
    }

    const nextDueAt = calculateNextDue(frequency, frequencyDays);

    const [result] = await db.insert(maintenanceTasks).values({
      name,
      description,
      icon,
      iconColor,
      frequency,
      frequencyDays: frequency === 'custom' ? frequencyDays : null,
      location,
      priority: priority || 1,
      estimatedMinutes,
      nextDueAt,
      sortOrder: sortOrder || 0,
    }).returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create maintenance task:', error);
    res.status(500).json({ error: 'Failed to create maintenance task', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/maintenance-tasks/:id - Update maintenance task
router.put('/:id', async (req, res) => {
  try {
    const { name, description, icon, iconColor, frequency, frequencyDays, location, priority, estimatedMinutes, sortOrder } = req.body;

    // If frequency changed, recalculate next due date
    let nextDueAt;
    if (frequency) {
      const existing = await db.query.maintenanceTasks.findFirst({
        where: eq(maintenanceTasks.id, req.params.id),
      });
      if (existing && existing.frequency !== frequency) {
        nextDueAt = calculateNextDue(frequency, frequencyDays);
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (iconColor !== undefined) updateData.iconColor = iconColor;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (frequencyDays !== undefined) updateData.frequencyDays = frequencyDays;
    if (location !== undefined) updateData.location = location;
    if (priority !== undefined) updateData.priority = priority;
    if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (nextDueAt) updateData.nextDueAt = nextDueAt;

    const [result] = await db.update(maintenanceTasks)
      .set(updateData)
      .where(eq(maintenanceTasks.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Maintenance task not found', code: 'NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update maintenance task:', error);
    res.status(500).json({ error: 'Failed to update maintenance task', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/maintenance-tasks/:id - Soft delete maintenance task
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(maintenanceTasks)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(maintenanceTasks.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Maintenance task not found', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete maintenance task:', error);
    res.status(500).json({ error: 'Failed to delete maintenance task', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/maintenance-tasks/:id/complete - Mark task as completed
router.post('/:id/complete', async (req, res) => {
  try {
    const { notes } = req.body;
    const now = new Date();

    // Get the task to calculate next due date
    const task = await db.query.maintenanceTasks.findFirst({
      where: eq(maintenanceTasks.id, req.params.id),
    });

    if (!task) {
      return res.status(404).json({ error: 'Maintenance task not found', code: 'NOT_FOUND' });
    }

    // Create completion record
    const [completion] = await db.insert(maintenanceTaskCompletions).values({
      taskId: req.params.id,
      completedAt: now,
      notes,
    }).returning();

    // Update task with last completed and next due date
    const nextDueAt = calculateNextDue(task.frequency, task.frequencyDays);
    const [updatedTask] = await db.update(maintenanceTasks)
      .set({
        lastCompletedAt: now,
        nextDueAt,
        updatedAt: now,
      })
      .where(eq(maintenanceTasks.id, req.params.id))
      .returning();

    res.status(201).json({
      data: {
        task: updatedTask,
        completion,
      },
    });
  } catch (error) {
    console.error('Failed to complete maintenance task:', error);
    res.status(500).json({ error: 'Failed to complete maintenance task', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/maintenance-tasks/:id/completions - Get completion history
router.get('/:id/completions', async (req, res) => {
  try {
    const result = await db.query.maintenanceTaskCompletions.findMany({
      where: eq(maintenanceTaskCompletions.taskId, req.params.id),
      orderBy: [desc(maintenanceTaskCompletions.completedAt)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch completions:', error);
    res.status(500).json({ error: 'Failed to fetch completions', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/maintenance-tasks/:id/restore - Restore soft-deleted task
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(maintenanceTasks)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(maintenanceTasks.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Maintenance task not found', code: 'NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore maintenance task:', error);
    res.status(500).json({ error: 'Failed to restore maintenance task', code: 'INTERNAL_ERROR' });
  }
});

export default router;
