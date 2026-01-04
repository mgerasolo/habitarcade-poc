import { Router } from 'express';
import { db } from '../db';
import { quoteCollections, quoteCollectionAssignments } from '../db/schema';
import { eq, and, desc, sql, asc } from 'drizzle-orm';

const router = Router();

// GET /api/quote-collections - List all collections
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';

    const conditions = [];
    if (!includeDeleted) {
      conditions.push(eq(quoteCollections.isDeleted, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.quoteCollections.findMany({
      where: whereClause,
      orderBy: [asc(quoteCollections.sortOrder), asc(quoteCollections.name)],
      with: {
        quoteAssignments: true,
      },
    });

    // Add quote count to each collection
    const collectionsWithCounts = result.map(collection => ({
      ...collection,
      quoteCount: collection.quoteAssignments?.length || 0,
      quoteAssignments: undefined, // Remove the raw assignments from response
    }));

    res.json({ data: collectionsWithCounts });
  } catch (error) {
    console.error('Failed to fetch quote collections:', error);
    res.status(500).json({ error: 'Failed to fetch quote collections', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/quote-collections/:id - Get single collection
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.quoteCollections.findFirst({
      where: eq(quoteCollections.id, req.params.id),
      with: {
        quoteAssignments: {
          with: {
            quote: true,
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'Collection not found', code: 'COLLECTION_NOT_FOUND' });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch quote collection:', error);
    res.status(500).json({ error: 'Failed to fetch quote collection', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/quote-collections - Create collection
router.post('/', async (req, res) => {
  try {
    const { name, color, icon, description, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Collection name is required', code: 'VALIDATION_ERROR' });
    }

    // Get max sort order if not provided
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${quoteCollections.sortOrder}), 0)` })
        .from(quoteCollections);
      finalSortOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
    }

    const [result] = await db.insert(quoteCollections).values({
      name,
      color,
      icon,
      description,
      sortOrder: finalSortOrder,
    }).returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create quote collection:', error);
    res.status(500).json({ error: 'Failed to create quote collection', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/quote-collections/:id - Update collection
router.patch('/:id', async (req, res) => {
  try {
    const { name, color, icon, description, sortOrder } = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [result] = await db.update(quoteCollections)
      .set(updateData)
      .where(eq(quoteCollections.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Collection not found', code: 'COLLECTION_NOT_FOUND' });
    }

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update quote collection:', error);
    res.status(500).json({ error: 'Failed to update quote collection', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/quote-collections/:id - Soft delete collection
router.delete('/:id', async (req, res) => {
  try {
    // First, remove all assignments to this collection
    await db.delete(quoteCollectionAssignments)
      .where(eq(quoteCollectionAssignments.collectionId, req.params.id));

    // Then soft delete the collection
    const [result] = await db.update(quoteCollections)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(quoteCollections.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Collection not found', code: 'COLLECTION_NOT_FOUND' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete quote collection:', error);
    res.status(500).json({ error: 'Failed to delete quote collection', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/quote-collections/seed - Seed default collections
router.post('/seed', async (req, res) => {
  try {
    const defaultCollections = [
      { name: 'Motivational', color: '#f97316', icon: 'EmojiEvents' },
      { name: 'Productivity', color: '#3b82f6', icon: 'Speed' },
      { name: 'Mindset', color: '#8b5cf6', icon: 'Psychology' },
      { name: 'Success', color: '#22c55e', icon: 'TrendingUp' },
      { name: 'Wisdom', color: '#eab308', icon: 'Lightbulb' },
      { name: 'Creativity', color: '#ec4899', icon: 'Palette' },
      { name: 'Perseverance', color: '#14b8a6', icon: 'FitnessCenter' },
    ];

    // Check if any collections already exist
    const existing = await db.query.quoteCollections.findMany({
      where: eq(quoteCollections.isDeleted, false),
    });

    if (existing.length > 0) {
      return res.json({
        data: existing,
        message: 'Collections already exist',
        seeded: false,
      });
    }

    // Create all default collections
    const result = await db.insert(quoteCollections)
      .values(defaultCollections.map((c, i) => ({ ...c, sortOrder: i })))
      .returning();

    res.status(201).json({
      data: result,
      message: `Seeded ${result.length} default collections`,
      seeded: true,
    });
  } catch (error) {
    console.error('Failed to seed quote collections:', error);
    res.status(500).json({ error: 'Failed to seed quote collections', code: 'INTERNAL_ERROR' });
  }
});

export default router;
