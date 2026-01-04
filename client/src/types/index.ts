// Habit Status Types
export type HabitStatus =
  | 'empty'
  | 'complete'
  | 'missed'
  | 'partial'
  | 'na'
  | 'exempt'
  | 'extra'
  | 'pink'
  | 'gray_missed'; // For low frequency habits: shows gray but counts as missed

export const HABIT_STATUSES: HabitStatus[] = [
  'empty', 'complete', 'missed', 'partial', 'na', 'exempt', 'extra', 'pink', 'gray_missed'
];

// Common statuses for click cycling (green → red → orange → white)
export const COMMON_STATUSES: HabitStatus[] = ['complete', 'missed', 'partial', 'empty'];

// Status colors mapping
// partial = orange, exempt = blue, na = gray
export const STATUS_COLORS: Record<HabitStatus, string> = {
  empty: '#ffffff',    // White - truly empty/unset cells (#41)
  complete: '#10b981',
  missed: '#ef4444',
  partial: '#f97316',  // Orange
  na: '#666666',       // Darker gray for visibility against weekend backgrounds (#56)
  exempt: '#3b82f6',   // Blue
  extra: '#047857',
  pink: '#ffd3dc',  // Pink for "Likely Missed" - rgb(255, 211, 220)
  gray_missed: '#666666', // Gray for low frequency habits - same as N/A but counts as missed
};

// Category
export interface Category {
  id: string;
  name: string;
  icon?: string;
  iconColor?: string;
  sortOrder: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Habit
export interface Habit {
  id: string;
  name: string;
  categoryId?: string;
  category?: Category;
  parentHabitId?: string; // Self-reference for parent/child relationships
  parent?: Habit;
  children?: Habit[];
  icon?: string;
  iconColor?: string;
  imageUrl?: string; // Custom uploaded icon/image
  isActive: boolean;
  sortOrder: number;
  targetPercentage?: number; // Completion % for green (default: 90)
  warningPercentage?: number; // Completion % for yellow/red boundary (default: 75)
  grayMissedWhenOnTrack?: boolean; // Low frequency habit - show gray instead of pink when on track
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  entries?: HabitEntry[];
}

// Habit Entry
export interface HabitEntry {
  id: string;
  habitId: string;
  date: string; // ISO date string YYYY-MM-DD
  status: HabitStatus;
  count?: number; // For count-based habits
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: Category;
  startDate?: string; // ISO date YYYY-MM-DD
  targetDate?: string; // ISO date YYYY-MM-DD (target completion)
  icon?: string;
  iconColor?: string;
  imageUrl?: string; // Uploaded custom icon/image
  color?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

// Tag
export interface Tag {
  id: string;
  name: string;
  color?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}

// Task Status (legacy - for backward compatibility)
export type TaskStatus = 'pending' | 'complete';

// Task Status Entity (new dynamic statuses)
export interface TaskStatusEntity {
  id: string;
  name: string;
  color: string;
  icon?: string;
  workflowOrder?: number;
  isBreakout: boolean;
  breakoutParentId?: string;
  breakoutParent?: TaskStatusEntity;
  breakoutChildren?: TaskStatusEntity[];
  isDefault: boolean;
  isInitialStatus: boolean;
  sortOrder: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Task
export interface Task {
  id: string;
  title: string;
  description?: string;
  plannedDate?: string; // ISO date string YYYY-MM-DD
  status: TaskStatus; // DEPRECATED - use statusId
  statusId?: string; // New: references task_statuses table
  taskStatus?: TaskStatusEntity; // Populated status entity
  parentTaskId?: string; // Self-reference for parent/child (subtask) relationships
  parent?: Task;
  children?: Task[];
  priority?: number;
  projectId?: string;
  project?: Project;
  timeBlockId?: string;
  timeBlock?: TimeBlock;
  sortOrder: number;
  completedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

// Task Tag (junction)
export interface TaskTag {
  id: string;
  taskId: string;
  tagId: string;
}

// Time Block
export interface TimeBlock {
  id: string;
  name: string;
  durationMinutes: number;
  linkedHabitId?: string;
  linkedHabit?: Habit;
  sortOrder: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  priorities?: TimeBlockPriority[];
}

// Time Block Priority
export interface TimeBlockPriority {
  id: string;
  blockId: string;
  title: string;
  sortOrder: number;
  completedAt?: string;
  createdAt: string;
}

// Measurement
export interface Measurement {
  id: string;
  type: string; // 'weight', 'steps', etc.
  name: string;
  unit?: string;
  createdAt: string;
  entries?: MeasurementEntry[];
  targets?: MeasurementTarget[];
}

// Measurement Entry
export interface MeasurementEntry {
  id: string;
  measurementId: string;
  date: string;
  value: number;
  createdAt: string;
}

// Measurement Target
export interface MeasurementTarget {
  id: string;
  measurementId: string;
  startValue: number;
  goalValue: number;
  reachGoalValue?: number; // Optional stretch/reach goal
  startDate: string;
  goalDate: string;
  createdAt: string;
}

// Parking Lot Item
export interface ParkingLotItem {
  id: string;
  content: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}

// Settings Theme
export type ThemeMode = 'light' | 'dark' | 'auto';

// Week Start Day (0 = Sunday, 1 = Monday, etc.)
export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Settings
export interface Settings {
  dayBoundaryHour: number; // Default 6 (6 AM), range 0-23
  theme: ThemeMode; // Default 'light'
  weekStartDay: WeekStartDay; // Default 0 (Sunday)
  showCompletedTasks: boolean; // Default true
  showDeletedItems: boolean; // Default false
  habitMatrixWeeks: number; // Default 4
  kanbanDays: number; // Default 7
  autoSyncInterval: number; // Default 30000 (30 seconds)
  notificationsEnabled: boolean; // Default false
  autoMarkPink: boolean; // Default true - auto-mark unfilled past days as pink
  [key: string]: unknown;
}

// Dashboard Layout (react-grid-layout)
export interface DashboardLayoutItem {
  i: string; // widget id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardLayout {
  id: string;
  name: string;
  layout: DashboardLayoutItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Page (user-created pages under Dashboard section)
export interface DashboardPage {
  id: string;
  name: string;
  icon?: string; // MUI icon name
  iconColor?: string;
  layout: DashboardLayoutItem[];
  collapsedWidgets: Record<string, number>;
  sortOrder: number;
  isDefault?: boolean; // 'Today' page is default
  createdAt: string;
  updatedAt: string;
}

// Quote Collection
export interface QuoteCollection {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  sortOrder: number;
  quoteCount?: number; // Computed field from API
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Quote
export interface Quote {
  id: string;
  text: string;
  author?: string;
  source?: string;
  category?: string; // Legacy - use collections instead
  collections?: QuoteCollection[];
  collectionIds?: string[]; // For create/update requests
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Video
export interface Video {
  id: string;
  url: string;
  platform?: string; // youtube, instagram, tiktok, vimeo
  videoId?: string; // Platform-specific video ID
  title?: string;
  description?: string;
  category?: string; // motivation, mindset, productivity
  thumbnailUrl?: string;
  duration?: number; // in seconds
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Widget types for the dashboard
export type WidgetType =
  | 'habit-matrix'
  | 'weekly-kanban'
  | 'time-blocks'
  | 'target-graph'
  | 'parking-lot'
  | 'quotes'
  | 'videos';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config?: Record<string, unknown>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  count: number;
}

export interface ApiError {
  error: string;
  code?: string;
}

// Icon types for the icon browser
export type IconProvider = 'material' | 'fontawesome';

export interface IconOption {
  provider: IconProvider;
  name: string;
  class: string;
}
