import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { Habit, HabitEntry, ApiListResponse, ApiResponse } from '../types';

// Query keys
export const habitKeys = {
  all: ['habits'] as const,
  detail: (id: string) => ['habits', id] as const,
  entries: (id: string, month?: string) => ['habits', id, 'entries', month] as const,
};

// Fetch all habits
export function useHabits() {
  return useQuery({
    queryKey: habitKeys.all,
    queryFn: () => apiFetch<ApiListResponse<Habit>>('/habits'),
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

// Update habit entry (status or count)
export function useUpdateHabitEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, date, status, notes, count }: {
      habitId: string;
      date: string;
      status: string;
      notes?: string;
      count?: number;
    }) =>
      apiFetch<ApiResponse<HabitEntry>>(`/habits/${habitId}/entries`, {
        method: 'POST',
        body: JSON.stringify({ date, status, notes, count }),
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

// Import result type
interface ImportResult {
  habitsCreated: number;
  categoriesCreated: number;
  habits: string[];
  categories: string[];
}

// Import habits from markdown
export function useImportHabits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (markdown: string) =>
      apiFetch<{ data: ImportResult; message: string }>('/habits/import', {
        method: 'POST',
        body: JSON.stringify({ markdown }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      // Also invalidate categories since import may create new ones
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Upload habit image
export function useUploadHabitImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/habits/${id}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      return response.json() as Promise<ApiResponse<Habit>>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(variables.id) });
    },
  });
}

// Delete habit image
export function useDeleteHabitImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Habit>>(`/habits/${id}/image`, {
        method: 'DELETE',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
      queryClient.invalidateQueries({ queryKey: habitKeys.detail(id) });
    },
  });
}
