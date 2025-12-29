import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { ParkingLotItem, ApiListResponse, ApiResponse } from '../types';

// Query keys
export const parkingLotKeys = {
  all: ['parkingLot'] as const,
  detail: (id: string) => ['parkingLot', id] as const,
};

// Fetch all parking lot items
export function useParkingLot() {
  return useQuery({
    queryKey: parkingLotKeys.all,
    queryFn: () => apiFetch<ApiListResponse<ParkingLotItem>>('/parking-lot'),
  });
}

// Fetch single parking lot item
export function useParkingLotItem(id: string) {
  return useQuery({
    queryKey: parkingLotKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<ParkingLotItem>>(`/parking-lot/${id}`),
    enabled: !!id,
  });
}

// Create parking lot item
export function useCreateParkingLotItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string }) =>
      apiFetch<ApiResponse<ParkingLotItem>>('/parking-lot', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parkingLotKeys.all });
    },
  });
}

// Update parking lot item
export function useUpdateParkingLotItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; content?: string }) =>
      apiFetch<ApiResponse<ParkingLotItem>>(`/parking-lot/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: parkingLotKeys.all });
      queryClient.invalidateQueries({ queryKey: parkingLotKeys.detail(variables.id) });
    },
  });
}

// Delete parking lot item (soft delete)
export function useDeleteParkingLotItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/parking-lot/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parkingLotKeys.all });
    },
  });
}

// Restore deleted parking lot item
export function useRestoreParkingLotItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<ParkingLotItem>>(`/parking-lot/${id}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parkingLotKeys.all });
    },
  });
}

// Bulk delete parking lot items
export function useBulkDeleteParkingLotItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch('/parking-lot/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parkingLotKeys.all });
    },
  });
}

// Convert parking lot item to task
export function useConvertParkingLotToTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      projectId,
      plannedDate,
    }: {
      id: string;
      projectId?: string;
      plannedDate?: string;
    }) =>
      apiFetch<ApiResponse<{ taskId: string }>>(`/parking-lot/${id}/convert-to-task`, {
        method: 'POST',
        body: JSON.stringify({ projectId, plannedDate }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: parkingLotKeys.all });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
