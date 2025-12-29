import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { Task, ApiListResponse, ApiResponse } from '../types';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  detail: (id: string) => ['tasks', id] as const,
  byDate: (date: string) => ['tasks', 'date', date] as const,
  byProject: (projectId: string) => ['tasks', 'project', projectId] as const,
  byStatus: (status: string) => ['tasks', 'status', status] as const,
};

// Fetch all tasks
export function useTasks(params?: {
  projectId?: string;
  status?: string;
  plannedDate?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.projectId) queryParams.append('projectId', params.projectId);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.plannedDate) queryParams.append('plannedDate', params.plannedDate);

  const queryString = queryParams.toString();
  const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: params?.plannedDate
      ? taskKeys.byDate(params.plannedDate)
      : params?.projectId
        ? taskKeys.byProject(params.projectId)
        : params?.status
          ? taskKeys.byStatus(params.status)
          : taskKeys.all,
    queryFn: () => apiFetch<ApiListResponse<Task>>(endpoint),
  });
}

// Fetch single task
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<Task>>(`/tasks/${id}`),
    enabled: !!id,
  });
}

// Fetch tasks for a specific date
export function useTasksByDate(date: string) {
  return useQuery({
    queryKey: taskKeys.byDate(date),
    queryFn: () => apiFetch<ApiListResponse<Task>>(`/tasks?plannedDate=${date}`),
    enabled: !!date,
  });
}

// Create task
export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) =>
      apiFetch<ApiResponse<Task>>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      if (result.data.plannedDate) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byDate(result.data.plannedDate)
        });
      }
      if (result.data.projectId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byProject(result.data.projectId)
        });
      }
    },
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      apiFetch<ApiResponse<Task>>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
      if (result.data.plannedDate) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byDate(result.data.plannedDate)
        });
      }
      if (result.data.projectId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.byProject(result.data.projectId)
        });
      }
    },
  });
}

// Delete task (soft delete)
export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Complete task
export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Task>>(`/tasks/${id}/complete`, {
        method: 'POST',
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousTasks = queryClient.getQueryData(taskKeys.all);
      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.all, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Uncomplete task
export function useUncompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Task>>(`/tasks/${id}/uncomplete`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Reorder tasks
export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiFetch('/tasks/reorder', {
        method: 'POST',
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Move task to date
export function useMoveTaskToDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, date }: { taskId: string; date: string | null }) =>
      apiFetch<ApiResponse<Task>>(`/tasks/${taskId}/move`, {
        method: 'POST',
        body: JSON.stringify({ plannedDate: date }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Restore deleted task
export function useRestoreTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Task>>(`/tasks/${id}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Add tag to task
export function useAddTaskTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      apiFetch(`/tasks/${taskId}/tags/${tagId}`, {
        method: 'POST',
      }),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Remove tag from task
export function useRemoveTaskTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      apiFetch(`/tasks/${taskId}/tags/${tagId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
