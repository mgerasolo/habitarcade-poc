import { pgTable, uuid, varchar, text, boolean, timestamp, date, integer, json, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Categories (for organizing habits)
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 100 }), // Material Icons or Font Awesome class
  iconColor: varchar('icon_color', { length: 20 }), // Hex color for icon
  sortOrder: integer('sort_order').default(0),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Habits
export const habits = pgTable('habits', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  parentHabitId: uuid('parent_habit_id'), // Self-reference for parent/child relationships
  icon: varchar('icon', { length: 100 }),
  iconColor: varchar('icon_color', { length: 20 }),
  imageUrl: varchar('image_url', { length: 500 }), // Uploaded custom icon/image
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  dailyTarget: integer('daily_target'), // For count-based habits (e.g., 3 supplements)
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Habit Entries (daily status)
// Status values: empty, complete, missed, partial, na, exempt, extra, trending, pink
export const habitEntries = pgTable('habit_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  habitId: uuid('habit_id').references(() => habits.id).notNull(),
  date: date('date').notNull(),
  status: varchar('status', { length: 20 }).default('empty').notNull(),
  count: integer('count').default(0), // For count-based habits
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Projects (for grouping tasks)
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  iconColor: varchar('icon_color', { length: 20 }),
  imageUrl: varchar('image_url', { length: 500 }), // Uploaded custom icon/image
  color: varchar('color', { length: 20 }), // Project color for visual grouping
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tags (for labeling tasks)
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Time Blocks (defined before tasks due to reference)
export const timeBlocks = pgTable('time_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  linkedHabitId: uuid('linked_habit_id').references(() => habits.id),
  sortOrder: integer('sort_order').default(0),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  plannedDate: date('planned_date'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, complete
  priority: integer('priority'),
  projectId: uuid('project_id').references(() => projects.id),
  timeBlockId: uuid('time_block_id').references(() => timeBlocks.id),
  sortOrder: integer('sort_order').default(0),
  completedAt: timestamp('completed_at'),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Task Tags (many-to-many)
export const taskTags = pgTable('task_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  tagId: uuid('tag_id').references(() => tags.id).notNull(),
});

// Time Block Priorities
export const timeBlockPriorities = pgTable('time_block_priorities', {
  id: uuid('id').defaultRandom().primaryKey(),
  blockId: uuid('block_id').references(() => timeBlocks.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').default(0),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Measurements (weight, etc.)
export const measurements = pgTable('measurements', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // 'weight', etc.
  name: varchar('name', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Measurement Entries
export const measurementEntries = pgTable('measurement_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  measurementId: uuid('measurement_id').references(() => measurements.id).notNull(),
  date: date('date').notNull(),
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Measurement Targets
export const measurementTargets = pgTable('measurement_targets', {
  id: uuid('id').defaultRandom().primaryKey(),
  measurementId: uuid('measurement_id').references(() => measurements.id).notNull(),
  startValue: decimal('start_value', { precision: 10, scale: 2 }).notNull(),
  goalValue: decimal('goal_value', { precision: 10, scale: 2 }).notNull(),
  reachGoalValue: decimal('reach_goal_value', { precision: 10, scale: 2 }), // Optional stretch goal
  startDate: date('start_date').notNull(),
  goalDate: date('goal_date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Parking Lot (quick capture)
export const parkingLot = pgTable('parking_lot', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Settings
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: json('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Dashboard Layouts
export const dashboardLayouts = pgTable('dashboard_layouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).default('default'),
  layout: json('layout').notNull(), // react-grid-layout config
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Videos
export const videos = pgTable('videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  url: varchar('url', { length: 500 }).notNull(),
  platform: varchar('platform', { length: 50 }), // youtube, instagram, tiktok, vimeo, etc.
  videoId: varchar('video_id', { length: 100 }), // Platform-specific video ID
  title: varchar('title', { length: 255 }),
  description: text('description'),
  category: varchar('category', { length: 100 }), // motivation, mindset, productivity, etc.
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  duration: integer('duration'), // in seconds
  isFavorite: boolean('is_favorite').default(false),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Quotes
export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  text: text('text').notNull(),
  author: varchar('author', { length: 255 }),
  source: varchar('source', { length: 255 }), // Book, movie, etc.
  category: varchar('category', { length: 100 }), // motivational, productivity, mindset, etc.
  isFavorite: boolean('is_favorite').default(false),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  habits: many(habits),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  category: one(categories, {
    fields: [habits.categoryId],
    references: [categories.id],
  }),
  parent: one(habits, {
    fields: [habits.parentHabitId],
    references: [habits.id],
    relationName: 'parentChild',
  }),
  children: many(habits, { relationName: 'parentChild' }),
  entries: many(habitEntries),
  linkedTimeBlocks: many(timeBlocks),
}));

export const habitEntriesRelations = relations(habitEntries, ({ one }) => ({
  habit: one(habits, {
    fields: [habitEntries.habitId],
    references: [habits.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  timeBlock: one(timeBlocks, {
    fields: [tasks.timeBlockId],
    references: [timeBlocks.id],
  }),
  taskTags: many(taskTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  taskTags: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}));

export const timeBlocksRelations = relations(timeBlocks, ({ one, many }) => ({
  linkedHabit: one(habits, {
    fields: [timeBlocks.linkedHabitId],
    references: [habits.id],
  }),
  priorities: many(timeBlockPriorities),
  tasks: many(tasks),
}));

export const timeBlockPrioritiesRelations = relations(timeBlockPriorities, ({ one }) => ({
  block: one(timeBlocks, {
    fields: [timeBlockPriorities.blockId],
    references: [timeBlocks.id],
  }),
}));

export const measurementsRelations = relations(measurements, ({ many }) => ({
  entries: many(measurementEntries),
  targets: many(measurementTargets),
}));

export const measurementEntriesRelations = relations(measurementEntries, ({ one }) => ({
  measurement: one(measurements, {
    fields: [measurementEntries.measurementId],
    references: [measurements.id],
  }),
}));

export const measurementTargetsRelations = relations(measurementTargets, ({ one }) => ({
  measurement: one(measurements, {
    fields: [measurementTargets.measurementId],
    references: [measurements.id],
  }),
}));
