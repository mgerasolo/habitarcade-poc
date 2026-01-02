import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { MaintenanceTask, MaintenanceTaskCompletion, ApiListResponse, ApiResponse } from '../types';

// Query keys
export const maintenanceTaskKeys = {
  all: ['maintenance-tasks'] as const,
  detail: (id: string) => ['maintenance-tasks', id] as const,
  completions: (id: string) => ['maintenance-tasks', id, 'completions'] as const,
};

// Fetch all maintenance tasks
export function useMaintenanceTasks(options?: { overdueOnly?: boolean; location?: string }) {
  const params = new URLSearchParams();
  if (options?.overdueOnly) params.append('overdueOnly', 'true');
  if (options?.location) params.append('location', options.location);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  return useQuery({
    queryKey: [...maintenanceTaskKeys.all, options],
    queryFn: () => apiFetch<ApiListResponse<MaintenanceTask>>(`/maintenance-tasks${queryString}`),
  });
}

// Fetch single maintenance task
export function useMaintenanceTask(id: string) {
  return useQuery({
    queryKey: maintenanceTaskKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<MaintenanceTask>>(`/maintenance-tasks/${id}`),
    enabled: !!id,
  });
}

// Fetch task completions
export function useMaintenanceTaskCompletions(taskId: string) {
  return useQuery({
    queryKey: maintenanceTaskKeys.completions(taskId),
    queryFn: () => apiFetch<ApiListResponse<MaintenanceTaskCompletion>>(`/maintenance-tasks/${taskId}/completions`),
    enabled: !!taskId,
  });
}

// Create maintenance task
export function useCreateMaintenanceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MaintenanceTask>) =>
      apiFetch<ApiResponse<MaintenanceTask>>('/maintenance-tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceTaskKeys.all });
    },
  });
}

// Update maintenance task
export function useUpdateMaintenanceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MaintenanceTask> & { id: string }) =>
      apiFetch<ApiResponse<MaintenanceTask>>(`/maintenance-tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: maintenanceTaskKeys.detail(variables.id) });
    },
  });
}

// Delete maintenance task
export function useDeleteMaintenanceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/maintenance-tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceTaskKeys.all });
    },
  });
}

// Complete maintenance task
export function useCompleteMaintenanceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiFetch<ApiResponse<{ task: MaintenanceTask; completion: MaintenanceTaskCompletion }>>(
        `/maintenance-tasks/${id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({ notes }),
        }
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: maintenanceTaskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: maintenanceTaskKeys.completions(variables.id) });
    },
  });
}

// Restore maintenance task
export function useRestoreMaintenanceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<MaintenanceTask>>(`/maintenance-tasks/${id}/restore`, {
        method: 'PATCH',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceTaskKeys.all });
    },
  });
}
