import { Router } from 'express';
import { db } from '../db';
import { tags, taskTags } from '../db/schema';
import { eq, asc } from 'drizzle-orm';

const router = Router();

// GET /api/tags - List all tags
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await db.query.tags.findMany({
      where: includeDeleted ? undefined : eq(tags.isDeleted, false),
      orderBy: [asc(tags.name)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/tags/:id - Get single tag
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.tags.findFirst({
      where: eq(tags.id, req.params.id),
      with: {
        taskTags: {
          with: { task: true }
        }
      },
    });
    if (!result) {
      return res.status(404).json({ error: 'Tag not found', code: 'TAG_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/tags/:id/tasks - Get tasks with this tag
router.get('/:id/tasks', async (req, res) => {
  try {
    const result = await db.query.taskTags.findMany({
      where: eq(taskTags.tagId, req.params.id),
      with: {
        task: {
          with: {
            project: true,
            timeBlock: true,
          }
        }
      },
    });

    // Filter out deleted tasks and extract task objects
    const tasksWithTag = result
      .map(tt => tt.task)
      .filter(task => task && !task.isDeleted);

    res.json({ data: tasksWithTag, count: tasksWithTag.length });
  } catch (error) {
    console.error('Failed to fetch tasks for tag:', error);
    res.status(500).json({ error: 'Failed to fetch tasks for tag', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/tags - Create tag
router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }

    // Check for duplicate name
    const existing = await db.query.tags.findFirst({
      where: eq(tags.name, name),
    });
    if (existing && !existing.isDeleted) {
      return res.status(400).json({ error: 'Tag with this name already exists', code: 'DUPLICATE_TAG' });
    }

    const [result] = await db.insert(tags).values({
      name,
      color,
    }).returning();
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create tag:', error);
    res.status(500).json({ error: 'Failed to create tag', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/tags/:id - Update tag
router.put('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;

    // Check for duplicate name if name is being changed
    if (name) {
      const existing = await db.query.tags.findFirst({
        where: eq(tags.name, name),
      });
      if (existing && existing.id !== req.params.id && !existing.isDeleted) {
        return res.status(400).json({ error: 'Tag with this name already exists', code: 'DUPLICATE_TAG' });
      }
    }

    const [result] = await db.update(tags)
      .set({ name, color })
      .where(eq(tags.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Tag not found', code: 'TAG_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update tag:', error);
    res.status(500).json({ error: 'Failed to update tag', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/tags/:id - Soft delete tag
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(tags)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(tags.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Tag not found', code: 'TAG_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete tag:', error);
    res.status(500).json({ error: 'Failed to delete tag', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/tags/:id/restore - Restore soft-deleted tag
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(tags)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(tags.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Tag not found', code: 'TAG_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore tag:', error);
    res.status(500).json({ error: 'Failed to restore tag', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/tags/bulk - Create multiple tags
router.post('/bulk', async (req, res) => {
  try {
    const { tags: tagList } = req.body;

    if (!Array.isArray(tagList) || tagList.length === 0) {
      return res.status(400).json({ error: 'Tags array is required', code: 'VALIDATION_ERROR' });
    }

    const results = await db.insert(tags)
      .values(tagList.map((t: { name: string; color?: string }) => ({
        name: t.name,
        color: t.color,
      })))
      .returning();

    res.status(201).json({ data: results, count: results.length });
  } catch (error) {
    console.error('Failed to create tags:', error);
    res.status(500).json({ error: 'Failed to create tags', code: 'INTERNAL_ERROR' });
  }
});

export default router;
