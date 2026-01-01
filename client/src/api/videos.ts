import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { Video, ApiResponse, ApiListResponse } from '../types';

// Query keys
export const videoKeys = {
  all: ['videos'] as const,
  random: ['videos', 'random'] as const,
  categories: ['videos', 'categories'] as const,
  platforms: ['videos', 'platforms'] as const,
  detail: (id: string) => ['videos', id] as const,
};

// Fetch all videos
export function useVideos(options?: {
  category?: string;
  platform?: string;
  favorites?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (options?.category) params.set('category', options.category);
  if (options?.platform) params.set('platform', options.platform);
  if (options?.favorites) params.set('favorites', 'true');
  if (options?.search) params.set('search', options.search);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const queryString = params.toString();
  const url = `/videos${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [...videoKeys.all, options],
    queryFn: () => apiFetch<ApiListResponse<Video> & { total: number }>(url),
  });
}

// Fetch random video
export function useRandomVideo(options?: {
  category?: string;
  platform?: string;
  favorites?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.category) params.set('category', options.category);
  if (options?.platform) params.set('platform', options.platform);
  if (options?.favorites) params.set('favorites', 'true');

  const queryString = params.toString();
  const url = `/videos/random${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [...videoKeys.random, options],
    queryFn: () => apiFetch<ApiResponse<Video>>(url),
  });
}

// Fetch video categories
export function useVideoCategories() {
  return useQuery({
    queryKey: videoKeys.categories,
    queryFn: () => apiFetch<{ data: string[] }>('/videos/categories'),
  });
}

// Fetch video platforms
export function useVideoPlatforms() {
  return useQuery({
    queryKey: videoKeys.platforms,
    queryFn: () => apiFetch<{ data: string[] }>('/videos/platforms'),
  });
}

// Fetch single video
export function useVideo(id: string) {
  return useQuery({
    queryKey: videoKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<Video>>(`/videos/${id}`),
    enabled: !!id,
  });
}

// Create video
export function useCreateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Video>) =>
      apiFetch<ApiResponse<Video>>('/videos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
      queryClient.invalidateQueries({ queryKey: videoKeys.categories });
      queryClient.invalidateQueries({ queryKey: videoKeys.platforms });
    },
  });
}

// Bulk import videos
export function useImportVideos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videos: Partial<Video>[]) =>
      apiFetch<{ data: Video[]; count: number; message: string }>('/videos/bulk', {
        method: 'POST',
        body: JSON.stringify({ videos }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
      queryClient.invalidateQueries({ queryKey: videoKeys.categories });
      queryClient.invalidateQueries({ queryKey: videoKeys.platforms });
    },
  });
}

// Update video
export function useUpdateVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Video> & { id: string }) =>
      apiFetch<ApiResponse<Video>>(`/videos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
      queryClient.invalidateQueries({ queryKey: videoKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: videoKeys.categories });
    },
  });
}

// Toggle favorite
export function useToggleVideoFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Video>>(`/videos/${id}/favorite`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
      queryClient.invalidateQueries({ queryKey: videoKeys.random });
    },
  });
}

// Delete video
export function useDeleteVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/videos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
      queryClient.invalidateQueries({ queryKey: videoKeys.categories });
    },
  });
}

// Refetch random video (for refresh button)
export function useRefetchRandomVideo() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: videoKeys.random });
  };
}
