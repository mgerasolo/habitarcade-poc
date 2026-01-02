import { Router } from 'express';
import { db } from '../db';
import { measurements, measurementEntries, measurementTargets } from '../db/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

const router = Router();

// GET /api/measurements - List all measurements
router.get('/', async (req, res) => {
  try {
    const result = await db.query.measurements.findMany({
      with: {
        entries: {
          orderBy: [desc(measurementEntries.date)],
          limit: 30, // Last 30 entries by default
        },
        targets: {
          orderBy: [desc(measurementTargets.createdAt)],
          limit: 1, // Current target
        },
      },
      orderBy: [asc(measurements.name)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch measurements:', error);
    res.status(500).json({ error: 'Failed to fetch measurements', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/measurements/:id - Get single measurement with entries
router.get('/:id', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await db.query.measurements.findFirst({
      where: eq(measurements.id, req.params.id),
      with: {
        entries: {
          orderBy: [desc(measurementEntries.date)],
        },
        targets: {
          orderBy: [desc(measurementTargets.createdAt)],
        },
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'Measurement not found', code: 'MEASUREMENT_NOT_FOUND' });
    }

    // Filter entries by date range if provided
    if (startDate || endDate) {
      result.entries = result.entries.filter(entry => {
        const entryDate = new Date(entry.date);
        if (startDate && entryDate < new Date(startDate as string)) return false;
        if (endDate && entryDate > new Date(endDate as string)) return false;
        return true;
      });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch measurement:', error);
    res.status(500).json({ error: 'Failed to fetch measurement', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/measurements - Create measurement
router.post('/', async (req, res) => {
  try {
    const { type, name, unit } = req.body;

    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.insert(measurements).values({
      type,
      name,
      unit,
    }).returning();
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create measurement:', error);
    res.status(500).json({ error: 'Failed to create measurement', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/measurements/:id - Update measurement
router.put('/:id', async (req, res) => {
  try {
    const { type, name, unit } = req.body;
    const [result] = await db.update(measurements)
      .set({ type, name, unit })
      .where(eq(measurements.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Measurement not found', code: 'MEASUREMENT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update measurement:', error);
    res.status(500).json({ error: 'Failed to update measurement', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/measurements/:id - Delete measurement
router.delete('/:id', async (req, res) => {
  try {
    // Delete related entries and targets first
    await db.delete(measurementEntries).where(eq(measurementEntries.measurementId, req.params.id));
    await db.delete(measurementTargets).where(eq(measurementTargets.measurementId, req.params.id));

    const [result] = await db.delete(measurements)
      .where(eq(measurements.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Measurement not found', code: 'MEASUREMENT_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete measurement:', error);
    res.status(500).json({ error: 'Failed to delete measurement', code: 'INTERNAL_ERROR' });
  }
});

// === Measurement Entries ===

// GET /api/measurements/:id/entries - Get entries for a measurement
router.get('/:id/entries', async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;

    const conditions = [eq(measurementEntries.measurementId, req.params.id)];
    if (startDate) {
      conditions.push(gte(measurementEntries.date, startDate as string));
    }
    if (endDate) {
      conditions.push(lte(measurementEntries.date, endDate as string));
    }

    const result = await db.query.measurementEntries.findMany({
      where: and(...conditions),
      orderBy: [desc(measurementEntries.date)],
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/measurements/:id/entries - Create/update entry for a date
router.post('/:id/entries', async (req, res) => {
  try {
    const { date, value } = req.body;

    if (!date || value === undefined) {
      return res.status(400).json({ error: 'Date and value are required', code: 'VALIDATION_ERROR' });
    }

    // Verify measurement exists
    const measurement = await db.query.measurements.findFirst({
      where: eq(measurements.id, req.params.id),
    });
    if (!measurement) {
      return res.status(404).json({ error: 'Measurement not found', code: 'MEASUREMENT_NOT_FOUND' });
    }

    // Upsert pattern
    const existing = await db.query.measurementEntries.findFirst({
      where: and(
        eq(measurementEntries.measurementId, req.params.id),
        eq(measurementEntries.date, date)
      ),
    });

    let result;
    if (existing) {
      [result] = await db.update(measurementEntries)
        .set({ value: value.toString() })
        .where(eq(measurementEntries.id, existing.id))
        .returning();
    } else {
      [result] = await db.insert(measurementEntries).values({
        measurementId: req.params.id,
        date,
        value: value.toString(),
      }).returning();
    }

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create entry:', error);
    res.status(500).json({ error: 'Failed to create entry', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/measurements/:measurementId/entries/:entryId - Delete entry
router.delete('/:measurementId/entries/:entryId', async (req, res) => {
  try {
    const [result] = await db.delete(measurementEntries)
      .where(and(
        eq(measurementEntries.id, req.params.entryId),
        eq(measurementEntries.measurementId, req.params.measurementId)
      ))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Entry not found', code: 'ENTRY_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete entry:', error);
    res.status(500).json({ error: 'Failed to delete entry', code: 'INTERNAL_ERROR' });
  }
});

// === Measurement Targets ===

// GET /api/measurements/:id/targets - Get targets for a measurement
router.get('/:id/targets', async (req, res) => {
  try {
    const result = await db.query.measurementTargets.findMany({
      where: eq(measurementTargets.measurementId, req.params.id),
      orderBy: [desc(measurementTargets.createdAt)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch targets:', error);
    res.status(500).json({ error: 'Failed to fetch targets', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/measurements/:id/targets - Create target
router.post('/:id/targets', async (req, res) => {
  try {
    const { startValue, goalValue, reachGoalValue, startDate, goalDate } = req.body;

    if (!startValue || !goalValue || !startDate || !goalDate) {
      return res.status(400).json({
        error: 'startValue, goalValue, startDate, and goalDate are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Verify measurement exists
    const measurement = await db.query.measurements.findFirst({
      where: eq(measurements.id, req.params.id),
    });
    if (!measurement) {
      return res.status(404).json({ error: 'Measurement not found', code: 'MEASUREMENT_NOT_FOUND' });
    }

    const [result] = await db.insert(measurementTargets).values({
      measurementId: req.params.id,
      startValue: startValue.toString(),
      goalValue: goalValue.toString(),
      reachGoalValue: reachGoalValue !== undefined ? reachGoalValue.toString() : null,
      startDate,
      goalDate,
    }).returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create target:', error);
    res.status(500).json({ error: 'Failed to create target', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/measurements/:measurementId/targets/:targetId - Update target
router.put('/:measurementId/targets/:targetId', async (req, res) => {
  try {
    const { startValue, goalValue, reachGoalValue, startDate, goalDate } = req.body;
    const [result] = await db.update(measurementTargets)
      .set({
        startValue: startValue?.toString(),
        goalValue: goalValue?.toString(),
        reachGoalValue: reachGoalValue !== undefined ? reachGoalValue?.toString() : null,
        startDate,
        goalDate,
      })
      .where(and(
        eq(measurementTargets.id, req.params.targetId),
        eq(measurementTargets.measurementId, req.params.measurementId)
      ))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Target not found', code: 'TARGET_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update target:', error);
    res.status(500).json({ error: 'Failed to update target', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/measurements/:measurementId/targets/:targetId - Delete target
router.delete('/:measurementId/targets/:targetId', async (req, res) => {
  try {
    const [result] = await db.delete(measurementTargets)
      .where(and(
        eq(measurementTargets.id, req.params.targetId),
        eq(measurementTargets.measurementId, req.params.measurementId)
      ))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Target not found', code: 'TARGET_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete target:', error);
    res.status(500).json({ error: 'Failed to delete target', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/measurements/:id/graph-data - Get data formatted for target line graph
router.get('/:id/graph-data', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const measurement = await db.query.measurements.findFirst({
      where: eq(measurements.id, req.params.id),
    });

    if (!measurement) {
      return res.status(404).json({ error: 'Measurement not found', code: 'MEASUREMENT_NOT_FOUND' });
    }

    // Get entries
    const entryConditions = [eq(measurementEntries.measurementId, req.params.id)];
    if (startDate) entryConditions.push(gte(measurementEntries.date, startDate as string));
    if (endDate) entryConditions.push(lte(measurementEntries.date, endDate as string));

    const entries = await db.query.measurementEntries.findMany({
      where: and(...entryConditions),
      orderBy: [asc(measurementEntries.date)],
    });

    // Get current target
    const target = await db.query.measurementTargets.findFirst({
      where: eq(measurementTargets.measurementId, req.params.id),
      orderBy: [desc(measurementTargets.createdAt)],
    });

    // Calculate target line if target exists
    let targetLine: Array<{ date: string; value: number }> = [];
    if (target) {
      const start = new Date(target.startDate);
      const end = new Date(target.goalDate);
      const startVal = parseFloat(target.startValue);
      const goalVal = parseFloat(target.goalValue);
      const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

      // Generate target line points
      for (let i = 0; i <= totalDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(currentDate.getDate() + i);
        const progress = i / totalDays;
        const value = startVal + (goalVal - startVal) * progress;
        targetLine.push({
          date: currentDate.toISOString().split('T')[0],
          value: Math.round(value * 100) / 100,
        });
      }
    }

    res.json({
      data: {
        measurement,
        entries: entries.map(e => ({
          date: e.date,
          value: parseFloat(e.value),
        })),
        target: target ? {
          startValue: parseFloat(target.startValue),
          goalValue: parseFloat(target.goalValue),
          startDate: target.startDate,
          goalDate: target.goalDate,
          targetLine,
        } : null,
      }
    });
  } catch (error) {
    console.error('Failed to fetch graph data:', error);
    res.status(500).json({ error: 'Failed to fetch graph data', code: 'INTERNAL_ERROR' });
  }
});

export default router;
