import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      refetchInterval: 1000 * 30, // 30 second polling
      retry: 1,
    },
  },
});

// Use relative URL for production (works with same-origin), absolute for dev
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Destructure headers from options to prevent override when spreading
  const { headers: optionHeaders, ...restOptions } = options || {};

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(optionHeaders as Record<string, string>),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
