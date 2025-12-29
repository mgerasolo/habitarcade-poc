import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { Settings, DashboardLayout, ApiResponse, ApiListResponse } from '../types';

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  layouts: ['settings', 'layouts'] as const,
  activeLayout: ['settings', 'layouts', 'active'] as const,
};

// Fetch settings
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => apiFetch<ApiResponse<Settings>>('/settings'),
  });
}

// Update settings
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Settings>) =>
      apiFetch<ApiResponse<Settings>>('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// Update single setting
export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      apiFetch<ApiResponse<Settings>>(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.all });
      const previousSettings = queryClient.getQueryData<ApiResponse<Settings>>(settingsKeys.all);

      // Optimistic update
      if (previousSettings) {
        queryClient.setQueryData<ApiResponse<Settings>>(settingsKeys.all, {
          ...previousSettings,
          data: { ...previousSettings.data, [key]: value },
        });
      }

      return { previousSettings };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.all, context.previousSettings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}

// --- Dashboard Layout hooks ---

// Fetch all dashboard layouts
export function useDashboardLayouts() {
  return useQuery({
    queryKey: settingsKeys.layouts,
    queryFn: () => apiFetch<ApiListResponse<DashboardLayout>>('/settings/layouts'),
  });
}

// Fetch active layout
export function useActiveDashboardLayout() {
  return useQuery({
    queryKey: settingsKeys.activeLayout,
    queryFn: () => apiFetch<ApiResponse<DashboardLayout>>('/settings/layouts/active'),
  });
}

// Create layout
export function useCreateDashboardLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; layout: DashboardLayout['layout'] }) =>
      apiFetch<ApiResponse<DashboardLayout>>('/settings/layouts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.layouts });
    },
  });
}

// Update layout
export function useUpdateDashboardLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      layout?: DashboardLayout['layout'];
    }) =>
      apiFetch<ApiResponse<DashboardLayout>>(`/settings/layouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.layouts });
      queryClient.invalidateQueries({ queryKey: settingsKeys.activeLayout });
    },
  });
}

// Delete layout
export function useDeleteDashboardLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/settings/layouts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.layouts });
    },
  });
}

// Set active layout
export function useSetActiveDashboardLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<DashboardLayout>>(`/settings/layouts/${id}/activate`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.layouts });
      queryClient.invalidateQueries({ queryKey: settingsKeys.activeLayout });
    },
  });
}

// Save current layout (upsert)
export function useSaveCurrentLayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (layout: DashboardLayout['layout']) =>
      apiFetch<ApiResponse<DashboardLayout>>('/settings/layouts/current', {
        method: 'POST',
        body: JSON.stringify({ layout }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.layouts });
      queryClient.invalidateQueries({ queryKey: settingsKeys.activeLayout });
    },
  });
}
