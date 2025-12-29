import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './queryClient';
import type { Project, Task, ApiListResponse, ApiResponse } from '../types';
import { taskKeys } from './tasks';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
  tasks: (id: string) => ['projects', id, 'tasks'] as const,
};

// Fetch all projects
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => apiFetch<ApiListResponse<Project>>('/projects'),
  });
}

// Fetch single project
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => apiFetch<ApiResponse<Project>>(`/projects/${id}`),
    enabled: !!id,
  });
}

// Fetch project tasks
export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: projectKeys.tasks(projectId),
    queryFn: () => apiFetch<ApiListResponse<Task>>(`/projects/${projectId}/tasks`),
    enabled: !!projectId,
  });
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Project>) =>
      apiFetch<ApiResponse<Project>>('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Project> & { id: string }) =>
      apiFetch<ApiResponse<Project>>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) });
    },
  });
}

// Delete project (soft delete)
export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

// Restore deleted project
export function useRestoreProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<ApiResponse<Project>>(`/projects/${id}/restore`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
