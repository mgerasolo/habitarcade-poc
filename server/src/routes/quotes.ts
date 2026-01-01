import { Router } from 'express';
import { db } from '../db';
import { quotes } from '../db/schema';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';

const router = Router();

// GET /api/quotes - List all quotes (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, favorites, search, limit, offset } = req.query;
    const includeDeleted = req.query.includeDeleted === 'true';

    // Build where conditions
    const conditions = [];

    if (!includeDeleted) {
      conditions.push(eq(quotes.isDeleted, false));
    }

    if (category) {
      conditions.push(eq(quotes.category, category as string));
    }

    if (favorites === 'true') {
      conditions.push(eq(quotes.isFavorite, true));
    }

    if (search) {
      conditions.push(
        or(
          ilike(quotes.text, `%${search}%`),
          ilike(quotes.author, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query with pagination
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    const result = await db.query.quotes.findMany({
      where: whereClause,
      orderBy: [desc(quotes.createdAt)],
      limit: limitNum,
      offset: offsetNum,
    });

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotes)
      .where(whereClause);

    res.json({
      data: result,
      count: result.length,
      total: Number(countResult[0]?.count || 0),
    });
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/quotes/random - Get a random quote
router.get('/random', async (req, res) => {
  try {
    const { category, favorites } = req.query;

    // Build where conditions
    const conditions = [eq(quotes.isDeleted, false)];

    if (category) {
      conditions.push(eq(quotes.category, category as string));
    }

    if (favorites === 'true') {
      conditions.push(eq(quotes.isFavorite, true));
    }

    const whereClause = and(...conditions);

    // Get random quote using SQL RANDOM()
    const result = await db.query.quotes.findMany({
      where: whereClause,
      orderBy: [sql`RANDOM()`],
      limit: 1,
    });

    if (result.length === 0) {
      return res.status(404).json({ error: 'No quotes found', code: 'NOT_FOUND' });
    }

    res.json({ data: result[0] });
  } catch (error) {
    console.error('Failed to fetch random quote:', error);
    res.status(500).json({ error: 'Failed to fetch random quote', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/quotes/categories - Get all unique categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db
      .selectDistinct({ category: quotes.category })
      .from(quotes)
      .where(and(eq(quotes.isDeleted, false), sql`${quotes.category} IS NOT NULL`))
      .orderBy(quotes.category);

    const categories = result.map(r => r.category).filter(Boolean);
    res.json({ data: categories });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/quotes/:id - Get single quote
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.quotes.findFirst({
      where: eq(quotes.id, req.params.id),
    });
    if (!result) {
      return res.status(404).json({ error: 'Quote not found', code: 'QUOTE_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/quotes - Create quote
router.post('/', async (req, res) => {
  try {
    const { text, author, source, category, isFavorite } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Quote text is required', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.insert(quotes).values({
      text,
      author,
      source,
      category,
      isFavorite: isFavorite || false,
    }).returning();

    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create quote:', error);
    res.status(500).json({ error: 'Failed to create quote', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/quotes/bulk - Bulk import quotes
router.post('/bulk', async (req, res) => {
  try {
    const { quotes: quotesToImport } = req.body;

    if (!Array.isArray(quotesToImport) || quotesToImport.length === 0) {
      return res.status(400).json({ error: 'Quotes array is required', code: 'VALIDATION_ERROR' });
    }

    const validQuotes = quotesToImport
      .filter(q => q.text)
      .map(q => ({
        text: q.text,
        author: q.author || null,
        source: q.source || null,
        category: q.category || null,
        isFavorite: q.isFavorite || false,
      }));

    if (validQuotes.length === 0) {
      return res.status(400).json({ error: 'No valid quotes found', code: 'VALIDATION_ERROR' });
    }

    const result = await db.insert(quotes).values(validQuotes).returning();

    res.status(201).json({
      data: result,
      count: result.length,
      message: `Imported ${result.length} quotes`,
    });
  } catch (error) {
    console.error('Failed to bulk import quotes:', error);
    res.status(500).json({ error: 'Failed to import quotes', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/quotes/:id - Update quote
router.patch('/:id', async (req, res) => {
  try {
    const { text, author, source, category, isFavorite } = req.body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (text !== undefined) updateData.text = text;
    if (author !== undefined) updateData.author = author;
    if (source !== undefined) updateData.source = source;
    if (category !== undefined) updateData.category = category;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;

    const [result] = await db.update(quotes)
      .set(updateData)
      .where(eq(quotes.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Quote not found', code: 'QUOTE_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update quote:', error);
    res.status(500).json({ error: 'Failed to update quote', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/quotes/:id/favorite - Toggle favorite
router.post('/:id/favorite', async (req, res) => {
  try {
    // First get current status
    const current = await db.query.quotes.findFirst({
      where: eq(quotes.id, req.params.id),
    });

    if (!current) {
      return res.status(404).json({ error: 'Quote not found', code: 'QUOTE_NOT_FOUND' });
    }

    // Toggle favorite
    const [result] = await db.update(quotes)
      .set({
        isFavorite: !current.isFavorite,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, req.params.id))
      .returning();

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/quotes/:id - Soft delete quote
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(quotes)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(quotes.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Quote not found', code: 'QUOTE_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete quote:', error);
    res.status(500).json({ error: 'Failed to delete quote', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/quotes/:id/restore - Restore soft-deleted quote
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(quotes)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(quotes.id, req.params.id))
      .returning();

    if (!result) {
      return res.status(404).json({ error: 'Quote not found', code: 'QUOTE_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore quote:', error);
    res.status(500).json({ error: 'Failed to restore quote', code: 'INTERNAL_ERROR' });
  }
});

export default router;
