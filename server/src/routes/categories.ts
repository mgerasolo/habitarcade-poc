import { Router } from 'express';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

const router = Router();

// GET /api/categories - List all categories
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await db.query.categories.findMany({
      where: includeDeleted ? undefined : eq(categories.isDeleted, false),
      with: { habits: true },
      orderBy: [asc(categories.sortOrder)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.categories.findFirst({
      where: eq(categories.id, req.params.id),
      with: { habits: true },
    });
    if (!result) {
      return res.status(404).json({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch category:', error);
    res.status(500).json({ error: 'Failed to fetch category', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/categories - Create category
router.post('/', async (req, res) => {
  try {
    const { name, icon, iconColor, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.insert(categories).values({
      name,
      icon,
      iconColor,
      sortOrder,
    }).returning();
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create category:', error);
    res.status(500).json({ error: 'Failed to create category', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req, res) => {
  try {
    const { name, icon, iconColor, sortOrder } = req.body;
    const [result] = await db.update(categories)
      .set({ name, icon, iconColor, sortOrder, updatedAt: new Date() })
      .where(eq(categories.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update category:', error);
    res.status(500).json({ error: 'Failed to update category', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/categories/:id - Soft delete category
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(categories)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(categories.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete category:', error);
    res.status(500).json({ error: 'Failed to delete category', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/categories/:id/restore - Restore soft-deleted category
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(categories)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(categories.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Category not found', code: 'CATEGORY_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore category:', error);
    res.status(500).json({ error: 'Failed to restore category', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/categories/reorder - Reorder categories
router.put('/reorder', async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, sortOrder }

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array', code: 'VALIDATION_ERROR' });
    }

    // Update each category's sort order
    const updates = order.map(async (item: { id: string; sortOrder: number }) => {
      return db.update(categories)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(categories.id, item.id));
    });

    await Promise.all(updates);

    // Fetch updated categories
    const result = await db.query.categories.findMany({
      where: eq(categories.isDeleted, false),
      orderBy: [asc(categories.sortOrder)],
    });

    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to reorder categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories', code: 'INTERNAL_ERROR' });
  }
});

export default router;
