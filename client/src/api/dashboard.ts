import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type {
  Habit,
  HabitEntry,
  Task,
  TimeBlock,
  Measurement,
  MeasurementEntry,
  ParkingLotItem,
  ApiResponse,
  ApiListResponse,
} from '../types';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: ['dashboard', 'summary'] as const,
  weekView: (date: string) => ['dashboard', 'week', date] as const,
  dayView: (date: string) => ['dashboard', 'day', date] as const,
};

// Dashboard summary types
export interface DashboardSummary {
  todayProgress: {
    completedHabits: number;
    totalHabits: number;
    completedTasks: number;
    totalTasks: number;
  };
  streakInfo: {
    currentStreak: number;
    bestStreak: number;
  };
  weeklyStats: {
    habitsCompletionRate: number;
    tasksCompleted: number;
    daysStreak: number;
  };
}

// Dashboard week view data
export interface DashboardWeekView {
  habits: Habit[];
  entries: Record<string, HabitEntry[]>; // habitId -> entries
  tasks: Task[];
  timeBlocks: TimeBlock[];
  measurements: Measurement[];
  measurementEntries: Record<string, MeasurementEntry[]>; // measurementId -> entries
  parkingLot: ParkingLotItem[];
  dateRange: {
    start: string;
    end: string;
  };
}

// Dashboard day view data
export interface DashboardDayView {
  date: string;
  habits: Array<Habit & { entry?: HabitEntry }>;
  tasks: Task[];
  timeBlocks: Array<TimeBlock & { tasks: Task[] }>;
  measurements: Array<Measurement & { entry?: MeasurementEntry }>;
}

// Fetch dashboard summary
export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: () => apiFetch<ApiResponse<DashboardSummary>>('/dashboard/summary'),
  });
}

// Fetch dashboard week view
export function useDashboardWeekView(startDate: string) {
  return useQuery({
    queryKey: dashboardKeys.weekView(startDate),
    queryFn: () => apiFetch<ApiResponse<DashboardWeekView>>(
      `/dashboard/week?startDate=${startDate}`
    ),
    enabled: !!startDate,
  });
}

// Fetch dashboard day view
export function useDashboardDayView(date: string) {
  return useQuery({
    queryKey: dashboardKeys.dayView(date),
    queryFn: () => apiFetch<ApiResponse<DashboardDayView>>(
      `/dashboard/day?date=${date}`
    ),
    enabled: !!date,
  });
}

// Fetch all widget data at once (optimized batch fetch)
export function useDashboardData() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => apiFetch<ApiResponse<{
      habits: Habit[];
      tasks: Task[];
      timeBlocks: TimeBlock[];
      measurements: Measurement[];
      parkingLot: ParkingLotItem[];
    }>>('/dashboard'),
  });
}

// Widget-specific data hooks (for individual widget loading)

export function useHabitMatrixData(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['widgets', 'habitMatrix', startDate, endDate],
    queryFn: () => apiFetch<ApiResponse<{
      habits: Habit[];
      entries: Record<string, HabitEntry[]>;
      categories: Array<{ id: string; name: string; color?: string }>;
    }>>(`/widgets/habit-matrix?startDate=${startDate}&endDate=${endDate}`),
    enabled: !!startDate && !!endDate,
  });
}

export function useWeeklyKanbanData(startDate: string) {
  return useQuery({
    queryKey: ['widgets', 'weeklyKanban', startDate],
    queryFn: () => apiFetch<ApiResponse<{
      days: Array<{
        date: string;
        tasks: Task[];
      }>;
      unscheduled: Task[];
    }>>(`/widgets/weekly-kanban?startDate=${startDate}`),
    enabled: !!startDate,
  });
}

export function useTimeBlocksData() {
  return useQuery({
    queryKey: ['widgets', 'timeBlocks'],
    queryFn: () => apiFetch<ApiListResponse<TimeBlock>>('/widgets/time-blocks'),
  });
}

export function useTargetGraphData(measurementId: string) {
  return useQuery({
    queryKey: ['widgets', 'targetGraph', measurementId],
    queryFn: () => apiFetch<ApiResponse<{
      measurement: Measurement;
      entries: MeasurementEntry[];
      target?: {
        startValue: number;
        goalValue: number;
        startDate: string;
        goalDate: string;
        trendLine: Array<{ date: string; value: number }>;
      };
    }>>(`/widgets/target-graph/${measurementId}`),
    enabled: !!measurementId,
  });
}

export function useParkingLotData() {
  return useQuery({
    queryKey: ['widgets', 'parkingLot'],
    queryFn: () => apiFetch<ApiListResponse<ParkingLotItem>>('/widgets/parking-lot'),
  });
}
