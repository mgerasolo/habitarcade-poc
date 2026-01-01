import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { Quote, ApiResponse, ApiListResponse } from '../types';

// Query keys
export const quoteKeys = {
  all: ['quotes'] as const,
  random: ['quotes', 'random'] as const,
  categories: ['quotes', 'categories'] as const,
  detail: (id: string) => ['quotes', id] as const,
};

// Fetch all quotes
export function useQuotes(options?: {
  category?: string;
  favorites?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (options?.category) params.set('category', options.category);
  if (options?.favorites) params.set('favorites', 'true');
  if (options?.search) params.set('search', options.search);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const queryString = params.toString();
  const url = `/quotes${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [...quoteKeys.all, options],
    queryFn: () => apiFetch<ApiListResponse<Quote> & { total: number }>(url),
  });
}

// Fetch random quote
export function useRandomQuote(options?: {
  category?: string;
  favorites?: boolean;
}) {
  const params = new URLSearchParams();
  if (options?.category) params.set('category', options.category);
  if (options?.favorites) params.set('favorites', 'true');

  const queryString = params.toString();
  const url = `/quotes/random${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [...quoteKeys.random, options],
    queryFn: () => apiFetch<ApiResponse<Quote>>(url),
  });
}

// Fetch quote categories
export function useQuoteCategories() {
  return useQuery({
    queryKey: quoteKeys.categories,
    queryFn: () => apiFetch<{ data: string[] }>('/quotes/categories'),
  });
}

// Fetch single quote
export function useQuote(id: string) {
  return useQuery({
    queryKey: quoteKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<Quote>>(`/quotes/${id}`),
    enabled: !!id,
  });
}

// Create quote
export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Quote>) =>
      apiFetch<ApiResponse<Quote>>('/quotes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.categories });
    },
  });
}

// Bulk import quotes
export function useImportQuotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quotes: Partial<Quote>[]) =>
      apiFetch<{ data: Quote[]; count: number; message: string }>('/quotes/bulk', {
        method: 'POST',
        body: JSON.stringify({ quotes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.categories });
    },
  });
}

// Update quote
export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Quote> & { id: string }) =>
      apiFetch<ApiResponse<Quote>>(`/quotes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.categories });
    },
  });
}

// Toggle favorite
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Quote>>(`/quotes/${id}/favorite`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.random });
    },
  });
}

// Delete quote
export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/quotes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKeys.all });
      queryClient.invalidateQueries({ queryKey: quoteKeys.categories });
    },
  });
}

// Refetch random quote (for refresh button)
export function useRefetchRandomQuote() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: quoteKeys.random });
  };
}
