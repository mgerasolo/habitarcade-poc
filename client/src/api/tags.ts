import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { Tag, ApiListResponse, ApiResponse } from '../types';
import { taskKeys } from './tasks';

// Query keys
export const tagKeys = {
  all: ['tags'] as const,
  detail: (id: string) => ['tags', id] as const,
};

// Fetch all tags
export function useTags() {
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: () => apiFetch<ApiListResponse<Tag>>('/tags'),
  });
}

// Fetch single tag
export function useTag(id: string) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<Tag>>(`/tags/${id}`),
    enabled: !!id,
  });
}

// Create tag
export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Tag>) =>
      apiFetch<ApiResponse<Tag>>('/tags', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

// Update tag
export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Tag> & { id: string }) =>
      apiFetch<ApiResponse<Tag>>(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(variables.id) });
      // Also invalidate tasks since they may display tag info
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Delete tag (soft delete)
export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/tags/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Restore deleted tag
export function useRestoreTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Tag>>(`/tags/${id}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}
