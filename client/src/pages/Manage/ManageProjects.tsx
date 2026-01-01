import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useProjects, useDeleteProject, useTasks } from '../../api';
import { useUIStore } from '../../stores';
import type { Project, Task } from '../../types';

/**
 * Manage Projects Page
 *
 * Features:
 * - View all projects in a table/list
 * - Create new projects
 * - Edit existing projects
 * - Delete projects with confirmation
 * - See task count per project
 */
export function ManageProjects() {
  const { data: projectsData, isLoading } = useProjects();
  const { data: tasksData } = useTasks();
  const deleteProject = useDeleteProject();
  const { openModal, setSelectedProject } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'tasks' | 'created'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get task count per project
  const taskCounts = useMemo(() => {
    if (!tasksData?.data) return {};
    const counts: Record<string, number> = {};
    tasksData.data.forEach((t: Task) => {
      if (t.projectId && !t.isDeleted) {
        counts[t.projectId] = (counts[t.projectId] || 0) + 1;
      }
    });
    return counts;
  }, [tasksData]);

  // Filter and sort projects
  const projects = useMemo(() => {
    if (!projectsData?.data) return [];

    let filtered = projectsData.data.filter((p: Project) => !p.isDeleted);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p: Project) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a: Project, b: Project) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'tasks':
          comparison = (taskCounts[a.id] || 0) - (taskCounts[b.id] || 0);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [projectsData, searchQuery, sortBy, sortDirection, taskCounts]);

  // Handle edit
  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    openModal('project-form');
  };

  // Handle delete with confirmation
  const handleDelete = (project: Project) => {
    const taskCount = taskCounts[project.id] || 0;
    openModal('confirm-delete', {
      title: 'Delete Project',
      message: taskCount > 0
        ? `Are you sure you want to delete "${project.name}"? This project has ${taskCount} task(s) that will become unassigned.`
        : `Are you sure you want to delete "${project.name}"?`,
      onConfirm: async () => {
        try {
          await deleteProject.mutateAsync(project.id);
          toast.success(`Deleted "${project.name}"`);
        } catch (error) {
          toast.error('Failed to delete project');
        }
      }
    });
  };

  // Handle add new
  const handleAdd = () => {
    setSelectedProject(null);
    openModal('project-form');
  };

  // Toggle sort
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Render icon
  const renderIcon = (project: Project) => {
    if (!project.icon) {
      return (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: project.color ? `${project.color}20` : '#64748b20' }}
        >
          <MuiIcons.Folder style={{ color: project.color || '#64748b', fontSize: 18 }} />
        </div>
      );
    }

    if (project.icon.startsWith('material:')) {
      const iconName = project.icon.replace('material:', '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${project.iconColor || project.color || '#8b5cf6'}20` }}
          >
            <IconComponent style={{ color: project.iconColor || project.color || '#8b5cf6', fontSize: 18 }} />
          </div>
        );
      }
    }

    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${project.iconColor || project.color || '#8b5cf6'}20` }}
      >
        <i className={project.icon} style={{ color: project.iconColor || project.color || '#8b5cf6', fontSize: 16 }} />
      </div>
    );
  };

  return (
    <div className="p-6" data-testid="manage-projects-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <MuiIcons.Folder style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Projects</h1>
            <p className="text-sm text-slate-400">{projects.length} projects</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-600/20"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          Add Project
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-5 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
            Project
            {sortBy === 'name' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('tasks')}>
            Tasks
            {sortBy === 'tasks' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('created')}>
            Created
            {sortBy === 'created' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-2" />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MuiIcons.FolderOutlined style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
            <p>No projects found</p>
            <button
              onClick={handleAdd}
              className="mt-4 text-purple-400 hover:text-purple-300 font-medium"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {projects.map((project: Project) => (
              <div
                key={project.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-700/30 transition-colors"
              >
                {/* Project Name */}
                <div className="col-span-5 flex items-center gap-3">
                  {renderIcon(project)}
                  <div>
                    <span className="text-white font-medium block">{project.name}</span>
                    {project.description && (
                      <span className="text-slate-400 text-sm line-clamp-1">{project.description}</span>
                    )}
                  </div>
                </div>

                {/* Task Count */}
                <div className="col-span-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                    <MuiIcons.Assignment style={{ fontSize: 14 }} />
                    {taskCounts[project.id] || 0} task{(taskCounts[project.id] || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Created */}
                <div className="col-span-2 text-sm text-slate-400">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <MuiIcons.Edit style={{ fontSize: 18 }} />
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <MuiIcons.Delete style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageProjects;
