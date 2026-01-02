import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type {
  Measurement,
  MeasurementEntry,
  MeasurementTarget,
  ApiListResponse,
  ApiResponse
} from '../types';

// Helper to transform API response decimal strings to numbers
function transformEntry(entry: MeasurementEntry): MeasurementEntry {
  return {
    ...entry,
    value: typeof entry.value === 'string' ? parseFloat(entry.value) : entry.value,
  };
}

function transformTarget(target: MeasurementTarget): MeasurementTarget {
  return {
    ...target,
    startValue: typeof target.startValue === 'string' ? parseFloat(target.startValue) : target.startValue,
    goalValue: typeof target.goalValue === 'string' ? parseFloat(target.goalValue) : target.goalValue,
    reachGoalValue: target.reachGoalValue != null
      ? (typeof target.reachGoalValue === 'string' ? parseFloat(target.reachGoalValue) : target.reachGoalValue)
      : undefined,
  };
}

// Query keys
export const measurementKeys = {
  all: ['measurements'] as const,
  detail: (id: string) => ['measurements', id] as const,
  entries: (id: string, dateRange?: { start: string; end: string }) =>
    ['measurements', id, 'entries', dateRange] as const,
  targets: (id: string) => ['measurements', id, 'targets'] as const,
};

// Fetch all measurements
export function useMeasurements() {
  return useQuery({
    queryKey: measurementKeys.all,
    queryFn: async () => {
      const response = await apiFetch<ApiListResponse<Measurement>>('/measurements');
      // Transform decimal strings to numbers in nested entries and targets
      return {
        ...response,
        data: response.data.map((measurement) => ({
          ...measurement,
          entries: measurement.entries?.map(transformEntry),
          targets: measurement.targets?.map(transformTarget),
        })),
      };
    },
  });
}

// Fetch single measurement
export function useMeasurement(id: string) {
  return useQuery({
    queryKey: measurementKeys.detail(id),
    queryFn: async () => {
      const response = await apiFetch<ApiResponse<Measurement>>(`/measurements/${id}`);
      // Transform decimal strings to numbers in nested entries and targets
      return {
        ...response,
        data: {
          ...response.data,
          entries: response.data.entries?.map(transformEntry),
          targets: response.data.targets?.map(transformTarget),
        },
      };
    },
    enabled: !!id,
  });
}

// Fetch measurement entries for date range
export function useMeasurementEntries(
  measurementId: string,
  startDate?: string,
  endDate?: string
) {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  const queryString = queryParams.toString();

  return useQuery({
    queryKey: measurementKeys.entries(
      measurementId,
      startDate && endDate ? { start: startDate, end: endDate } : undefined
    ),
    queryFn: async () => {
      const response = await apiFetch<ApiListResponse<MeasurementEntry>>(
        `/measurements/${measurementId}/entries${queryString ? `?${queryString}` : ''}`
      );
      // Transform decimal strings to numbers
      return {
        ...response,
        data: response.data.map(transformEntry),
      };
    },
    enabled: !!measurementId,
  });
}

// Fetch measurement targets
export function useMeasurementTargets(measurementId: string) {
  return useQuery({
    queryKey: measurementKeys.targets(measurementId),
    queryFn: async () => {
      const response = await apiFetch<ApiListResponse<MeasurementTarget>>(
        `/measurements/${measurementId}/targets`
      );
      // Transform decimal strings to numbers
      return {
        ...response,
        data: response.data.map(transformTarget),
      };
    },
    enabled: !!measurementId,
  });
}

// Create measurement
export function useCreateMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Measurement>) =>
      apiFetch<ApiResponse<Measurement>>('/measurements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

// Update measurement
export function useUpdateMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Measurement> & { id: string }) =>
      apiFetch<ApiResponse<Measurement>>(`/measurements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
      queryClient.invalidateQueries({ queryKey: measurementKeys.detail(variables.id) });
    },
  });
}

// Delete measurement
export function useDeleteMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/measurements/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

// --- Measurement Entry mutations ---

// Add entry
export function useAddMeasurementEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      measurementId,
      date,
      value,
    }: {
      measurementId: string;
      date: string;
      value: number;
    }) =>
      apiFetch<ApiResponse<MeasurementEntry>>(`/measurements/${measurementId}/entries`, {
        method: 'POST',
        body: JSON.stringify({ date, value }),
      }),
    onSuccess: (_, { measurementId }) => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.entries(measurementId) });
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

// Update entry
export function useUpdateMeasurementEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      measurementId,
      entryId,
      ...data
    }: {
      measurementId: string;
      entryId: string;
      date?: string;
      value?: number;
    }) =>
      apiFetch<ApiResponse<MeasurementEntry>>(
        `/measurements/${measurementId}/entries/${entryId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_, { measurementId }) => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.entries(measurementId) });
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

// Delete entry
export function useDeleteMeasurementEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      measurementId,
      entryId,
    }: {
      measurementId: string;
      entryId: string;
    }) =>
      apiFetch(`/measurements/${measurementId}/entries/${entryId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { measurementId }) => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.entries(measurementId) });
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

// --- Measurement Target mutations ---

// Create target
export function useCreateMeasurementTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      measurementId,
      ...data
    }: {
      measurementId: string;
      startValue: number;
      goalValue: number;
      reachGoalValue?: number;
      startDate: string;
      goalDate: string;
    }) =>
      apiFetch<ApiResponse<MeasurementTarget>>(`/measurements/${measurementId}/targets`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { measurementId }) => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.targets(measurementId) });
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

// Update target
export function useUpdateMeasurementTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      measurementId,
      targetId,
      ...data
    }: {
      measurementId: string;
      targetId: string;
      startValue?: number;
      goalValue?: number;
      reachGoalValue?: number;
      startDate?: string;
      goalDate?: string;
    }) =>
      apiFetch<ApiResponse<MeasurementTarget>>(
        `/measurements/${measurementId}/targets/${targetId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_, { measurementId }) => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.targets(measurementId) });
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}

// Delete target
export function useDeleteMeasurementTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      measurementId,
      targetId,
    }: {
      measurementId: string;
      targetId: string;
    }) =>
      apiFetch(`/measurements/${measurementId}/targets/${targetId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, { measurementId }) => {
      queryClient.invalidateQueries({ queryKey: measurementKeys.targets(measurementId) });
      queryClient.invalidateQueries({ queryKey: measurementKeys.all });
    },
  });
}
