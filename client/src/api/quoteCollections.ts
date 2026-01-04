import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { QuoteCollection, ApiResponse, ApiListResponse } from '../types';
import { quoteKeys } from './quotes';

// Query keys
export const quoteCollectionKeys = {
  all: ['quote-collections'] as const,
  detail: (id: string) => ['quote-collections', id] as const,
};

// Fetch all collections
export function useQuoteCollections() {
  return useQuery({
    queryKey: quoteCollectionKeys.all,
    queryFn: () => apiFetch<ApiListResponse<QuoteCollection & { quoteCount: number }>>('/quote-collections'),
  });
}

// Fetch single collection
export function useQuoteCollection(id: string) {
  return useQuery({
    queryKey: quoteCollectionKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<QuoteCollection>>(`/quote-collections/${id}`),
    enabled: !!id,
  });
}

// Create collection
export function useCreateQuoteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<QuoteCollection>) =>
      apiFetch<ApiResponse<QuoteCollection>>('/quote-collections', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteCollectionKeys.all });
    },
  });
}

// Update collection
export function useUpdateQuoteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<QuoteCollection> & { id: string }) =>
      apiFetch<ApiResponse<QuoteCollection>>(`/quote-collections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteCollectionKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteCollectionKeys.detail(variables.id) });
      // Also invalidate quotes as they include collection data
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    },
  });
}

// Delete collection
export function useDeleteQuoteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/quote-collections/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteCollectionKeys.all });
      // Also invalidate quotes as they include collection data
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
    },
  });
}

// Seed default collections
export function useSeedQuoteCollections() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ data: QuoteCollection[]; message: string; seeded: boolean }>('/quote-collections/seed', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteCollectionKeys.all });
    },
  });
}
