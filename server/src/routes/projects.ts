import { Router } from 'express';
import { db } from '../db';
import { projects, tasks } from '../db/schema';
import { eq, and, asc, count } from 'drizzle-orm';

const router = Router();

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const result = await db.query.projects.findMany({
      where: includeDeleted ? undefined : eq(projects.isDeleted, false),
      with: { tasks: true },
      orderBy: [asc(projects.name)],
    });

    // Add task counts
    const projectsWithCounts = result.map(project => ({
      ...project,
      taskCount: project.tasks?.length || 0,
      completedTaskCount: project.tasks?.filter(t => t.status === 'complete' && !t.isDeleted).length || 0,
    }));

    res.json({ data: projectsWithCounts, count: result.length });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/projects/:id - Get single project with tasks
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
      with: {
        tasks: {
          where: eq(tasks.isDeleted, false),
          orderBy: [asc(tasks.sortOrder)],
        }
      },
    });
    if (!result) {
      return res.status(404).json({ error: 'Project not found', code: 'PROJECT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ error: 'Failed to fetch project', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/projects/:id/tasks - Get tasks for a specific project
router.get('/:id/tasks', async (req, res) => {
  try {
    const includeCompleted = req.query.includeCompleted !== 'false';
    const conditions = [
      eq(tasks.projectId, req.params.id),
      eq(tasks.isDeleted, false),
    ];

    if (!includeCompleted) {
      conditions.push(eq(tasks.status, 'pending'));
    }

    const result = await db.query.tasks.findMany({
      where: and(...conditions),
      with: {
        taskTags: {
          with: { tag: true }
        }
      },
      orderBy: [asc(tasks.sortOrder)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch project tasks:', error);
    res.status(500).json({ error: 'Failed to fetch project tasks', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/projects - Create project
router.post('/', async (req, res) => {
  try {
    const { name, description, color, icon, iconColor } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }

    const [result] = await db.insert(projects).values({
      name,
      description,
      color,
      icon,
      iconColor,
    }).returning();
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ error: 'Failed to create project', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const { name, description, color, icon, iconColor } = req.body;
    const [result] = await db.update(projects)
      .set({ name, description, color, icon, iconColor, updatedAt: new Date() })
      .where(eq(projects.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Project not found', code: 'PROJECT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update project:', error);
    res.status(500).json({ error: 'Failed to update project', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/projects/:id - Soft delete project
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(projects)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(projects.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Project not found', code: 'PROJECT_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(500).json({ error: 'Failed to delete project', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/projects/:id/restore - Restore soft-deleted project
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(projects)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(projects.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Project not found', code: 'PROJECT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore project:', error);
    res.status(500).json({ error: 'Failed to restore project', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, req.params.id),
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found', code: 'PROJECT_NOT_FOUND' });
    }

    const projectTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.projectId, req.params.id),
        eq(tasks.isDeleted, false)
      ),
    });

    const stats = {
      totalTasks: projectTasks.length,
      completedTasks: projectTasks.filter(t => t.status === 'complete').length,
      pendingTasks: projectTasks.filter(t => t.status === 'pending').length,
      completionRate: projectTasks.length > 0
        ? Math.round((projectTasks.filter(t => t.status === 'complete').length / projectTasks.length) * 100)
        : 0,
    };

    res.json({ data: stats });
  } catch (error) {
    console.error('Failed to fetch project stats:', error);
    res.status(500).json({ error: 'Failed to fetch project stats', code: 'INTERNAL_ERROR' });
  }
});

export default router;
