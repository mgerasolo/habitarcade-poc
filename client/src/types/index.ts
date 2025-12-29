// Habit Status Types
export type HabitStatus =
  | 'empty'
  | 'complete'
  | 'missed'
  | 'partial'
  | 'na'
  | 'exempt'
  | 'extra'
  | 'trending'
  | 'pink';

export const HABIT_STATUSES: HabitStatus[] = [
  'empty', 'complete', 'missed', 'partial', 'na', 'exempt', 'extra', 'trending', 'pink'
];

// Common statuses for click cycling
export const COMMON_STATUSES: HabitStatus[] = ['empty', 'complete', 'missed'];

// Status colors mapping
export const STATUS_COLORS: Record<HabitStatus, string> = {
  empty: '#f3f4f6',
  complete: '#10b981',
  missed: '#ef4444',
  partial: '#3b82f6',
  na: '#9ca3af',
  exempt: '#fbbf24',
  extra: '#047857',
  trending: '#f97316',
  pink: '#ec4899',
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
  icon?: string;
  iconColor?: string;
  sortOrder: number;
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  iconColor?: string;
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

// Task Status
export type TaskStatus = 'pending' | 'complete';

// Task
export interface Task {
  id: string;
  title: string;
  description?: string;
  plannedDate?: string; // ISO date string YYYY-MM-DD
  status: TaskStatus;
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

// Settings
export interface Settings {
  dayBoundaryHour: number; // Default 6 (6 AM)
  theme: 'dark' | 'light';
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

// Widget types for the dashboard
export type WidgetType =
  | 'habit-matrix'
  | 'weekly-kanban'
  | 'time-blocks'
  | 'target-graph'
  | 'parking-lot';

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
