import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { habits, habitEntries, categories } from '../db/schema';
import { eq, and, gte, lte, desc, ilike } from 'drizzle-orm';

const router = Router();

// Configure multer for habit image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/habits');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Markdown import parser
interface ParsedHabit {
  name: string;
  icon?: string;
  iconColor?: string;
  categoryName?: string;
}

function parseMarkdownHabits(markdown: string): ParsedHabit[] {
  const lines = markdown.split('\n');
  const parsedHabits: ParsedHabit[] = [];
  let currentCategory: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for category header (## Category Name)
    const categoryMatch = trimmed.match(/^##\s+(.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Check for habit item (- Habit Name @icon:name @color:#hex)
    const habitMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (habitMatch) {
      const habitLine = habitMatch[1];

      // Extract @icon:value
      const iconMatch = habitLine.match(/@icon:(\S+)/);
      const icon = iconMatch ? iconMatch[1] : undefined;

      // Extract @color:#hex
      const colorMatch = habitLine.match(/@color:(#[0-9a-fA-F]{3,6})/);
      const iconColor = colorMatch ? colorMatch[1] : undefined;

      // Remove tags from name
      const name = habitLine
        .replace(/@icon:\S+/g, '')
        .replace(/@color:\S+/g, '')
        .trim();

      if (name) {
        parsedHabits.push({
          name,
          icon,
          iconColor,
          categoryName: currentCategory,
        });
      }
    }
  }

  return parsedHabits;
}

// GET /api/habits - List all habits (with optional category filter)
router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.includeDeleted === 'true';
    const categoryId = req.query.categoryId as string | undefined;

    let whereCondition = includeDeleted ? undefined : eq(habits.isDeleted, false);
    if (categoryId && !includeDeleted) {
      whereCondition = and(eq(habits.isDeleted, false), eq(habits.categoryId, categoryId));
    } else if (categoryId) {
      whereCondition = eq(habits.categoryId, categoryId);
    }

    const result = await db.query.habits.findMany({
      where: whereCondition,
      with: {
        category: true,
        entries: true,
        children: {
          with: { entries: true },
        },
      },
      orderBy: [habits.sortOrder],
    });

    // Filter out deleted children in post-processing (Drizzle ORM type issues with nested where)
    const filteredResult = result.map((habit) => ({
      ...habit,
      children: habit.children?.filter((child) => !child.isDeleted) || [],
    }));

    res.json({ data: filteredResult, count: filteredResult.length });
  } catch (error) {
    console.error('Failed to fetch habits:', error);
    res.status(500).json({ error: 'Failed to fetch habits', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/habits/:id - Get single habit
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query.habits.findFirst({
      where: eq(habits.id, req.params.id),
      with: { category: true, entries: true },
    });
    if (!result) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch habit:', error);
    res.status(500).json({ error: 'Failed to fetch habit', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits - Create habit
router.post('/', async (req, res) => {
  try {
    const { name, categoryId, parentHabitId, icon, iconColor, isActive, sortOrder, dailyTarget } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' });
    }

    // Validate parent exists if provided
    if (parentHabitId) {
      const parent = await db.query.habits.findFirst({
        where: eq(habits.id, parentHabitId),
      });
      if (!parent) {
        return res.status(400).json({ error: 'Parent habit not found', code: 'VALIDATION_ERROR' });
      }
    }

    const [result] = await db.insert(habits).values({
      name,
      categoryId,
      parentHabitId: parentHabitId || null,
      icon,
      iconColor,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder,
      dailyTarget: dailyTarget || null,
    }).returning();
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create habit:', error);
    res.status(500).json({ error: 'Failed to create habit', code: 'INTERNAL_ERROR' });
  }
});

// PUT /api/habits/:id - Update habit
router.put('/:id', async (req, res) => {
  try {
    const { name, categoryId, parentHabitId, icon, iconColor, isActive, sortOrder, dailyTarget } = req.body;

    // Validate parent exists if provided and prevent circular reference
    if (parentHabitId !== undefined && parentHabitId !== null) {
      if (parentHabitId === req.params.id) {
        return res.status(400).json({ error: 'Habit cannot be its own parent', code: 'VALIDATION_ERROR' });
      }
      const parent = await db.query.habits.findFirst({
        where: eq(habits.id, parentHabitId),
      });
      if (!parent) {
        return res.status(400).json({ error: 'Parent habit not found', code: 'VALIDATION_ERROR' });
      }
    }

    const [result] = await db.update(habits)
      .set({
        name,
        categoryId,
        parentHabitId: parentHabitId !== undefined ? (parentHabitId || null) : undefined,
        icon,
        iconColor,
        isActive,
        sortOrder,
        dailyTarget: dailyTarget !== undefined ? (dailyTarget || null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(habits.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to update habit:', error);
    res.status(500).json({ error: 'Failed to update habit', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/habits/:id - Soft delete habit
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.update(habits)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(habits.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete habit:', error);
    res.status(500).json({ error: 'Failed to delete habit', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits/:id/entries - Create/update habit entry for a date
router.post('/:id/entries', async (req, res) => {
  try {
    const { date, status, notes, count } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required', code: 'VALIDATION_ERROR' });
    }

    // Verify habit exists
    const habit = await db.query.habits.findFirst({
      where: eq(habits.id, req.params.id),
    });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }

    // Upsert pattern - update if exists, insert if not
    const existing = await db.query.habitEntries.findFirst({
      where: and(eq(habitEntries.habitId, req.params.id), eq(habitEntries.date, date)),
    });

    let result;
    if (existing) {
      [result] = await db.update(habitEntries)
        .set({
          status,
          notes,
          count: count !== undefined ? count : existing.count,
          updatedAt: new Date(),
        })
        .where(eq(habitEntries.id, existing.id))
        .returning();
    } else {
      [result] = await db.insert(habitEntries).values({
        habitId: req.params.id,
        date,
        status: status || 'empty',
        count: count || 0,
        notes,
      }).returning();
    }
    res.status(201).json({ data: result });
  } catch (error) {
    console.error('Failed to create entry:', error);
    res.status(500).json({ error: 'Failed to create entry', code: 'INTERNAL_ERROR' });
  }
});

// GET /api/habits/:id/entries - Get entries for date range
router.get('/:id/entries', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where conditions
    const conditions = [eq(habitEntries.habitId, req.params.id)];
    if (startDate) {
      conditions.push(gte(habitEntries.date, startDate as string));
    }
    if (endDate) {
      conditions.push(lte(habitEntries.date, endDate as string));
    }

    const result = await db.query.habitEntries.findMany({
      where: and(...conditions),
      orderBy: [desc(habitEntries.date)],
    });
    res.json({ data: result, count: result.length });
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries', code: 'INTERNAL_ERROR' });
  }
});

// PATCH /api/habits/:id/restore - Restore soft-deleted habit
router.patch('/:id/restore', async (req, res) => {
  try {
    const [result] = await db.update(habits)
      .set({ isDeleted: false, deletedAt: null })
      .where(eq(habits.id, req.params.id))
      .returning();
    if (!result) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('Failed to restore habit:', error);
    res.status(500).json({ error: 'Failed to restore habit', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits/import - Bulk import habits from markdown
router.post('/import', async (req, res) => {
  try {
    const { markdown } = req.body;

    if (!markdown || typeof markdown !== 'string') {
      return res.status(400).json({ error: 'Markdown content is required', code: 'VALIDATION_ERROR' });
    }

    const parsedHabits = parseMarkdownHabits(markdown);

    if (parsedHabits.length === 0) {
      return res.status(400).json({
        error: 'No habits found in markdown. Use format: ## Category\\n- Habit Name @icon:name @color:#hex',
        code: 'VALIDATION_ERROR'
      });
    }

    // Track categories to create/find
    const categoryMap = new Map<string, string>(); // name -> id
    const createdCategories: string[] = [];
    const createdHabits: string[] = [];

    // Get max sort order for habits
    const allHabits = await db.query.habits.findMany();
    let maxSortOrder = Math.max(0, ...allHabits.map(h => h.sortOrder || 0));

    // Process each parsed habit
    for (const parsed of parsedHabits) {
      let categoryId: string | undefined;

      // Handle category
      if (parsed.categoryName) {
        // Check cache first
        if (categoryMap.has(parsed.categoryName)) {
          categoryId = categoryMap.get(parsed.categoryName);
        } else {
          // Look for existing category
          const existingCategory = await db.query.categories.findFirst({
            where: eq(categories.name, parsed.categoryName),
          });

          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            // Create new category
            const [newCategory] = await db.insert(categories).values({
              name: parsed.categoryName,
              sortOrder: 0,
            }).returning();
            categoryId = newCategory.id;
            createdCategories.push(parsed.categoryName);
          }
          categoryMap.set(parsed.categoryName, categoryId!);
        }
      }

      // Create habit
      maxSortOrder++;
      const [newHabit] = await db.insert(habits).values({
        name: parsed.name,
        categoryId,
        icon: parsed.icon,
        iconColor: parsed.iconColor,
        sortOrder: maxSortOrder,
      }).returning();

      createdHabits.push(parsed.name);
    }

    res.status(201).json({
      data: {
        habitsCreated: createdHabits.length,
        categoriesCreated: createdCategories.length,
        habits: createdHabits,
        categories: createdCategories,
      },
      message: `Imported ${createdHabits.length} habits and ${createdCategories.length} new categories`,
    });
  } catch (error) {
    console.error('Failed to import habits:', error);
    res.status(500).json({ error: 'Failed to import habits', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits/reorder - Reorder habits
router.post('/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds must be an array', code: 'VALIDATION_ERROR' });
    }

    // Update sort order for each habit
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(habits)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(habits.id, orderedIds[i]));
    }

    res.json({ data: { success: true, count: orderedIds.length } });
  } catch (error) {
    console.error('Failed to reorder habits:', error);
    res.status(500).json({ error: 'Failed to reorder habits', code: 'INTERNAL_ERROR' });
  }
});

// POST /api/habits/:id/upload-image - Upload habit image
router.post('/:id/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided', code: 'VALIDATION_ERROR' });
    }

    // Verify habit exists
    const habit = await db.query.habits.findFirst({
      where: eq(habits.id, req.params.id),
    });

    if (!habit) {
      // Clean up uploaded file if habit not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }

    // Delete old image if exists
    if (habit.imageUrl) {
      const oldImagePath = path.join(__dirname, '../..', habit.imageUrl);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Store relative path for serving via static middleware
    const imageUrl = `/uploads/habits/${req.file.filename}`;

    const [result] = await db.update(habits)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(habits.id, req.params.id))
      .returning();

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to upload habit image:', error);
    res.status(500).json({ error: 'Failed to upload image', code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/habits/:id/image - Delete habit image
router.delete('/:id/image', async (req, res) => {
  try {
    // Verify habit exists
    const habit = await db.query.habits.findFirst({
      where: eq(habits.id, req.params.id),
    });

    if (!habit) {
      return res.status(404).json({ error: 'Habit not found', code: 'HABIT_NOT_FOUND' });
    }

    if (!habit.imageUrl) {
      return res.status(400).json({ error: 'Habit has no image', code: 'VALIDATION_ERROR' });
    }

    // Delete image file
    const imagePath = path.join(__dirname, '../..', habit.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Clear imageUrl in database
    const [result] = await db.update(habits)
      .set({ imageUrl: null, updatedAt: new Date() })
      .where(eq(habits.id, req.params.id))
      .returning();

    res.json({ data: result });
  } catch (error) {
    console.error('Failed to delete habit image:', error);
    res.status(500).json({ error: 'Failed to delete image', code: 'INTERNAL_ERROR' });
  }
});

export default router;
