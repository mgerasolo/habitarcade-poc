import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { TimeBlock, TimeBlockPriority, ApiListResponse, ApiResponse } from '../types';

// Query keys
export const timeBlockKeys = {
  all: ['timeBlocks'] as const,
  detail: (id: string) => ['timeBlocks', id] as const,
  priorities: (id: string) => ['timeBlocks', id, 'priorities'] as const,
};

// Fetch all time blocks
export function useTimeBlocks() {
  return useQuery({
    queryKey: timeBlockKeys.all,
    queryFn: () => apiFetch<ApiListResponse<TimeBlock>>('/time-blocks'),
  });
}

// Fetch single time block
export function useTimeBlock(id: string) {
  return useQuery({
    queryKey: timeBlockKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<TimeBlock>>(`/time-blocks/${id}`),
    enabled: !!id,
  });
}

// Fetch time block priorities
export function useTimeBlockPriorities(blockId: string) {
  return useQuery({
    queryKey: timeBlockKeys.priorities(blockId),
    queryFn: () => apiFetch<ApiListResponse<TimeBlockPriority>>(
      `/time-blocks/${blockId}/priorities`
    ),
    enabled: !!blockId,
  });
}

// Create time block
export function useCreateTimeBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TimeBlock>) =>
      apiFetch<ApiResponse<TimeBlock>>('/time-blocks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}

// Update time block
export function useUpdateTimeBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<TimeBlock> & { id: string }) =>
      apiFetch<ApiResponse<TimeBlock>>(`/time-blocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.detail(variables.id) });
    },
  });
}

// Delete time block (soft delete)
export function useDeleteTimeBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/time-blocks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}

// Reorder time blocks
export function useReorderTimeBlocks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiFetch('/time-blocks/reorder', {
        method: 'POST',
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}

// Restore deleted time block
export function useRestoreTimeBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<TimeBlock>>(`/time-blocks/${id}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}

// --- Time Block Priority mutations ---

// Create priority
export function useCreateTimeBlockPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, ...data }: { blockId: string; title: string; sortOrder?: number }) =>
      apiFetch<ApiResponse<TimeBlockPriority>>(`/time-blocks/${blockId}/priorities`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { blockId }) => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.priorities(blockId) });
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}

// Update priority
export function useUpdateTimeBlockPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      blockId,
      priorityId,
      ...data
    }: {
      blockId: string;
      priorityId: string;
      title?: string;
      sortOrder?: number;
      completedAt?: string | null;
    }) =>
      apiFetch<ApiResponse<TimeBlockPriority>>(
        `/time-blocks/${blockId}/priorities/${priorityId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_, { blockId }) => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.priorities(blockId) });
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}

// Delete priority
export function useDeleteTimeBlockPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, priorityId }: { blockId: string; priorityId: string }) =>
      apiFetch(`/time-blocks/${blockId}/priorities/${priorityId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { blockId }) => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.priorities(blockId) });
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}

// Complete priority
export function useCompleteTimeBlockPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, priorityId }: { blockId: string; priorityId: string }) =>
      apiFetch<ApiResponse<TimeBlockPriority>>(
        `/time-blocks/${blockId}/priorities/${priorityId}/complete`,
        { method: 'POST' }
      ),
    onSuccess: (_, { blockId }) => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.priorities(blockId) });
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}

// Reorder priorities
export function useReorderTimeBlockPriorities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ blockId, orderedIds }: { blockId: string; orderedIds: string[] }) =>
      apiFetch(`/time-blocks/${blockId}/priorities/reorder`, {
        method: 'POST',
        body: JSON.stringify({ orderedIds }),
      }),
    onSuccess: (_, { blockId }) => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.priorities(blockId) });
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.all });
    },
  });
}
