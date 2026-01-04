import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { ApiListResponse, ApiResponse } from '../types';

// Extended TaskStatus interface for the new statuses table
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

export interface WorkflowResponse {
  mainWorkflow: TaskStatusEntity[];
  breakouts: TaskStatusEntity[];
  all: TaskStatusEntity[];
}

// Query keys
export const statusKeys = {
  all: ['statuses'] as const,
  detail: (id: string) => ['statuses', id] as const,
  workflow: ['statuses', 'workflow'] as const,
};

// Fetch all statuses
export function useStatuses() {
  return useQuery({
    queryKey: statusKeys.all,
    queryFn: () => apiFetch<ApiListResponse<TaskStatusEntity>>('/statuses'),
  });
}

// Fetch statuses organized by workflow
export function useStatusWorkflow() {
  return useQuery({
    queryKey: statusKeys.workflow,
    queryFn: () => apiFetch<ApiResponse<WorkflowResponse>>('/statuses/workflow'),
  });
}

// Fetch single status
export function useStatus(id: string) {
  return useQuery({
    queryKey: statusKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<TaskStatusEntity>>(`/statuses/${id}`),
    enabled: !!id,
  });
}

// Create status
export function useCreateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TaskStatusEntity>) =>
      apiFetch<ApiResponse<TaskStatusEntity>>('/statuses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
      queryClient.invalidateQueries({ queryKey: statusKeys.workflow });
    },
  });
}

// Update status
export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TaskStatusEntity> & { id: string }) =>
      apiFetch<ApiResponse<TaskStatusEntity>>(`/statuses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
      queryClient.invalidateQueries({ queryKey: statusKeys.workflow });
      queryClient.invalidateQueries({ queryKey: statusKeys.detail(variables.id) });
    },
  });
}

// Delete status (soft delete)
export function useDeleteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/statuses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
      queryClient.invalidateQueries({ queryKey: statusKeys.workflow });
    },
  });
}

// Restore deleted status
export function useRestoreStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<TaskStatusEntity>>(`/statuses/${id}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
      queryClient.invalidateQueries({ queryKey: statusKeys.workflow });
    },
  });
}

// Reorder statuses
export function useReorderStatuses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: { id: string; sortOrder: number; workflowOrder?: number }[]) =>
      apiFetch('/statuses/reorder', {
        method: 'PUT',
        body: JSON.stringify({ order }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all });
      queryClient.invalidateQueries({ queryKey: statusKeys.workflow });
    },
  });
}
