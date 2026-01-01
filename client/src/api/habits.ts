import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { Habit, HabitEntry, ApiListResponse, ApiResponse } from '../types';

// Query keys
export const habitKeys = {
  all: ['habits'] as const,
  detail: (id: string) => ['habits', id] as const,
  entries: (id: string, month?: string) => ['habits', id, 'entries', month] as const,
  today: ['habits', 'today'] as const,
};

// Types for new features
export interface EffectiveTodayResponse {
  effectiveDate: string;
  dayBoundaryHour: number;
  serverTime: string;
}

export interface ImportHabitsRequest {
  content: string;
  dryRun?: boolean;
}

export interface ImportHabitsResponse {
  dryRun?: boolean;
  categories?: Array<{ name: string; sortOrder: number }>;
  habits?: Array<{ name: string; categoryName: string | null; sortOrder: number }>;
  created?: {
    categories: number;
    habits: number;
  };
  skipped?: {
    habits: string[];
  };
  stats: {
    totalLines: number;
    categoriesFound: number;
    habitsFound: number;
    skippedLines: number;
  };
  warnings: string[];
}

export interface AutoFillMissedRequest {
  startDate?: string;
  habitIds?: string[];
  status?: 'missed' | 'pink';
}

export interface AutoFillMissedResponse {
  message: string;
  filled: number;
  dateRange: {
    start: string;
    end: string;
  };
  habitsProcessed?: number;
  entries: Array<{ habitId: string; date: string }>;
}

// Fetch all habits
export function useHabits() {
  return useQuery({
    queryKey: habitKeys.all,
    queryFn: () => apiFetch<ApiListResponse<Habit>>('/habits'),
  });
}

// Fetch effective today based on day boundary
export function useEffectiveToday() {
  return useQuery({
    queryKey: habitKeys.today,
    queryFn: () => apiFetch<ApiResponse<EffectiveTodayResponse>>('/habits/today'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Fetch single habit
export function useHabit(id: string) {
  return useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<Habit>>(`/habits/${id}`),
    enabled: !!id,
  });
}

// Fetch habit entries for a date range
export function useHabitEntries(habitId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: habitKeys.entries(habitId, startDate),
    queryFn: () => apiFetch<ApiListResponse<HabitEntry>>(
      `/habits/${habitId}/entries?startDate=${startDate}&endDate=${endDate}`
    ),
    enabled: !!habitId,
  });
}

// Create habit
export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Habit>) =>
      apiFetch<ApiResponse<Habit>>('/habits', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

// Import habits from markdown
export function useImportHabits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportHabitsRequest) =>
      apiFetch<ApiResponse<ImportHabitsResponse>>('/habits/import', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      // Only invalidate if not a dry run
      if (!variables.dryRun) {
        queryClient.invalidateQueries({ queryKey: habitKeys.all });
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      }
    },
  });
}

// Auto-fill missed entries for all habits
export function useAutoFillMissed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: AutoFillMissedRequest) =>
      apiFetch<ApiResponse<AutoFillMissedResponse>>('/habits/auto-fill-missed', {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

// Auto-fill missed entries for a single habit
export function useAutoFillHabitMissed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, startDate, status }: { habitId: string; startDate?: string; status?: string }) =>
      apiFetch<ApiResponse<AutoFillMissedResponse>>(`/habits/${habitId}/auto-fill-missed`, {
        method: 'POST',
        body: JSON.stringify({ startDate, status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(variables.habitId) });
    },
  });
}

// Update habit
export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Habit> & { id: string }) =>
      apiFetch<ApiResponse<Habit>>(`/habits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(variables.id) });
    },
  });
}

// Delete habit (soft delete)
export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/habits/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

// Update habit entry (status)
export function useUpdateHabitEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, status, notes }: {
      habitId: string;
      date: string;
      status: string;
      notes?: string
    }) =>
      apiFetch<ApiResponse<HabitEntry>>(`/habits/${habitId}/entries`, {
        method: 'POST',
        body: JSON.stringify({ date, status, notes }),
      }),
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: habitKeys.all });
      const previousHabits = queryClient.getQueryData(habitKeys.all);
      return { previousHabits };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(habitKeys.all, context.previousHabits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

// Reorder habits
export function useReorderHabits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiFetch('/habits/reorder', {
        method: 'POST',
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

// Restore deleted habit
export function useRestoreHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Habit>>(`/habits/${id}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}
