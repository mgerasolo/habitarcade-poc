import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useTasks, useDeleteTask, useCompleteTask, useUncompleteTask, useProjects } from '../../api';
import { useUIStore } from '../../stores';
import type { Task, Project } from '../../types';

type ViewMode = 'list' | 'detailed';
type TaskFilter = 'all' | 'pending' | 'complete' | 'maintenance';

/**
 * Manage Tasks Page
 *
 * Features:
 * - View tasks in list (compact) or detailed (expanded) views
 * - Toggle between views
 * - Filter by status (all, pending, complete, maintenance)
 * - Maintenance tasks management for recurring upkeep tasks
 * - Create, edit, delete tasks
 */
export function ManageTasks() {
  const { data: tasksData, isLoading } = useTasks();
  const { data: projectsData } = useProjects();
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const { openModal, setSelectedTask } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<'title' | 'priority' | 'created' | 'status'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter and sort tasks
  const tasks = useMemo(() => {
    if (!tasksData?.data) return [];

    let filtered = tasksData.data.filter((t: Task) => !t.isDeleted);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t: Task) =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    // Apply project filter
    if (projectFilter !== 'all') {
      if (projectFilter === 'unassigned') {
        filtered = filtered.filter((t: Task) => !t.projectId);
      } else {
        filtered = filtered.filter((t: Task) => t.projectId === projectFilter);
      }
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'maintenance') {
        // Maintenance tasks are recurring/no due date tasks
        filtered = filtered.filter((t: Task) => !t.plannedDate);
      } else {
        filtered = filtered.filter((t: Task) => t.status === statusFilter);
      }
    }

    // Sort
    filtered.sort((a: Task, b: Task) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = (a.priority ?? 999) - (b.priority ?? 999);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasksData, searchQuery, projectFilter, statusFilter, sortBy, sortDirection]);

  const projects = useMemo(() => {
    if (!projectsData?.data) return [];
    return projectsData.data.filter((p: Project) => !p.isDeleted);
  }, [projectsData]);

  // Stats
  const stats = useMemo(() => {
    if (!tasksData?.data) return { total: 0, pending: 0, complete: 0, maintenance: 0 };
    const all = tasksData.data.filter((t: Task) => !t.isDeleted);
    return {
      total: all.length,
      pending: all.filter((t: Task) => t.status === 'pending').length,
      complete: all.filter((t: Task) => t.status === 'complete').length,
      maintenance: all.filter((t: Task) => !t.plannedDate).length,
    };
  }, [tasksData]);

  // Handle edit
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    openModal('task-form');
  };

  // Handle delete with confirmation
  const handleDelete = (task: Task) => {
    openModal('confirm-delete', {
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteTask.mutateAsync(task.id);
          toast.success(`Deleted "${task.title}"`);
        } catch {
          toast.error('Failed to delete task');
        }
      }
    });
  };

  // Handle toggle complete
  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === 'complete') {
        await uncompleteTask.mutateAsync(task.id);
        toast.success('Task marked as pending');
      } else {
        await completeTask.mutateAsync(task.id);
        toast.success('Task completed!');
      }
    } catch {
      toast.error('Failed to update task');
    }
  };

  // Handle add new
  const handleAdd = () => {
    setSelectedTask(null);
    openModal('task-form');
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

  // Get priority color
  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'bg-slate-600/50 text-slate-400';
    if (priority === 1) return 'bg-red-500/20 text-red-400';
    if (priority === 2) return 'bg-amber-500/20 text-amber-400';
    if (priority === 3) return 'bg-blue-500/20 text-blue-400';
    return 'bg-slate-600/50 text-slate-400';
  };

  // Render list view row
  const renderListRow = (task: Task) => {
    const isComplete = task.status === 'complete';

    return (
      <div
        key={task.id}
        className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-700/30 transition-colors"
      >
        {/* Checkbox + Title */}
        <div className="col-span-5 flex items-center gap-3">
          <button
            onClick={() => handleToggleComplete(task)}
            className={`
              flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200
              flex items-center justify-center
              ${isComplete
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-500 hover:border-teal-400 hover:bg-teal-500/10'
              }
            `}
          >
            {isComplete && (
              <MuiIcons.Check style={{ fontSize: 14 }} />
            )}
          </button>
          <span className={`font-medium ${isComplete ? 'text-slate-400 line-through' : 'text-white'}`}>
            {task.title}
          </span>
        </div>

        {/* Project */}
        <div className="col-span-2">
          {task.project ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm"
              style={{
                backgroundColor: `${task.project.color || task.project.iconColor || '#6366f1'}20`,
                color: task.project.color || task.project.iconColor || '#6366f1',
              }}
            >
              {task.project.icon && <span>{task.project.icon}</span>}
              {task.project.name}
            </span>
          ) : (
            <span className="text-slate-500 text-sm">-</span>
          )}
        </div>

        {/* Priority */}
        <div className="col-span-1">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
            P{task.priority || '-'}
          </span>
        </div>

        {/* Status */}
        <div className="col-span-2">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">
              <MuiIcons.CheckCircle style={{ fontSize: 14 }} />
              Complete
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">
              <MuiIcons.Schedule style={{ fontSize: 14 }} />
              Pending
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-2 flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(task)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Edit"
          >
            <MuiIcons.Edit style={{ fontSize: 18 }} />
          </button>
          <button
            onClick={() => handleDelete(task)}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
            title="Delete"
          >
            <MuiIcons.Delete style={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
    );
  };

  // Render detailed view card
  const renderDetailedCard = (task: Task) => {
    const isComplete = task.status === 'complete';

    return (
      <div
        key={task.id}
        className={`
          relative bg-slate-800/50 border rounded-xl p-4 transition-all
          ${isComplete ? 'border-slate-700/50 opacity-70' : 'border-slate-700 hover:border-slate-600'}
        `}
      >
        {/* Priority indicator */}
        {task.priority && task.priority > 0 && (
          <div
            className={`
              absolute left-0 top-0 bottom-0 w-1 rounded-l-xl
              ${task.priority === 1
                ? 'bg-red-500'
                : task.priority === 2
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }
            `}
          />
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <button
            onClick={() => handleToggleComplete(task)}
            className={`
              flex-shrink-0 w-6 h-6 mt-0.5 rounded-lg border-2 transition-all duration-200
              flex items-center justify-center
              ${isComplete
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-500 hover:border-teal-400 hover:bg-teal-500/10'
              }
            `}
          >
            {isComplete && (
              <MuiIcons.Check style={{ fontSize: 16 }} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-lg ${isComplete ? 'text-slate-400 line-through' : 'text-white'}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(task)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Edit"
            >
              <MuiIcons.Edit style={{ fontSize: 18 }} />
            </button>
            <button
              onClick={() => handleDelete(task)}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
              title="Delete"
            >
              <MuiIcons.Delete style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 ml-9">
          {/* Project */}
          {task.project && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm"
              style={{
                backgroundColor: `${task.project.color || task.project.iconColor || '#6366f1'}20`,
                color: task.project.color || task.project.iconColor || '#6366f1',
              }}
            >
              <MuiIcons.Folder style={{ fontSize: 14 }} />
              {task.project.name}
            </span>
          )}

          {/* Priority */}
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(task.priority)}`}>
            <MuiIcons.Flag style={{ fontSize: 14 }} />
            Priority {task.priority || '-'}
          </span>

          {/* Planned Date */}
          {task.plannedDate ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm">
              <MuiIcons.CalendarToday style={{ fontSize: 14 }} />
              {new Date(task.plannedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
              <MuiIcons.Repeat style={{ fontSize: 14 }} />
              Maintenance
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {task.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : '#6b728020',
                    color: tag.color || '#9ca3af',
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-slate-500">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Completed info */}
        {isComplete && task.completedAt && (
          <div className="mt-3 ml-9 text-xs text-slate-500 flex items-center gap-1">
            <MuiIcons.CheckCircle style={{ fontSize: 12 }} />
            Completed {new Date(task.completedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6" data-testid="manage-tasks-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <MuiIcons.Assignment style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Maintenance Tasks</h1>
            <p className="text-sm text-slate-400">
              {stats.total} tasks ({stats.pending} pending, {stats.complete} complete)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-800/50 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${viewMode === 'list'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white'
                }
              `}
              title="List View"
            >
              <MuiIcons.ViewList style={{ fontSize: 18 }} />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${viewMode === 'detailed'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white'
                }
              `}
              title="Detailed View"
            >
              <MuiIcons.ViewAgenda style={{ fontSize: 18 }} />
              <span className="hidden sm:inline">Detailed</span>
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-600/20"
          >
            <MuiIcons.Add style={{ fontSize: 20 }} />
            Add Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`
            p-4 rounded-xl border transition-all
            ${statusFilter === 'all'
              ? 'bg-slate-700/50 border-teal-500'
              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
              <MuiIcons.Assignment style={{ fontSize: 20, color: '#94a3b8' }} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">All Tasks</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`
            p-4 rounded-xl border transition-all
            ${statusFilter === 'pending'
              ? 'bg-amber-500/10 border-amber-500'
              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <MuiIcons.Schedule style={{ fontSize: 20, color: '#f59e0b' }} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('complete')}
          className={`
            p-4 rounded-xl border transition-all
            ${statusFilter === 'complete'
              ? 'bg-emerald-500/10 border-emerald-500'
              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <MuiIcons.CheckCircle style={{ fontSize: 20, color: '#10b981' }} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-white">{stats.complete}</p>
              <p className="text-xs text-slate-400">Complete</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('maintenance')}
          className={`
            p-4 rounded-xl border transition-all
            ${statusFilter === 'maintenance'
              ? 'bg-purple-500/10 border-purple-500'
              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <MuiIcons.Repeat style={{ fontSize: 20, color: '#a855f7' }} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-bold text-white">{stats.maintenance}</p>
              <p className="text-xs text-slate-400">Maintenance</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Project Filter */}
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
        >
          <option value="all">All Projects</option>
          <option value="unassigned">Unassigned</option>
          {projects.map((project: Project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${sortBy}-${sortDirection}`}
          onChange={(e) => {
            const [field, direction] = e.target.value.split('-') as [typeof sortBy, 'asc' | 'desc'];
            setSortBy(field);
            setSortDirection(direction);
          }}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
        >
          <option value="priority-asc">Priority (High first)</option>
          <option value="priority-desc">Priority (Low first)</option>
          <option value="title-asc">Title (A-Z)</option>
          <option value="title-desc">Title (Z-A)</option>
          <option value="created-desc">Newest first</option>
          <option value="created-asc">Oldest first</option>
          <option value="status-asc">Status</option>
        </select>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-400">
            <div className="col-span-5 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('title')}>
              Task
              {sortBy === 'title' && (
                sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
              )}
            </div>
            <div className="col-span-2">Project</div>
            <div className="col-span-1 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('priority')}>
              Priority
              {sortBy === 'priority' && (
                sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
              )}
            </div>
            <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('status')}>
              Status
              {sortBy === 'status' && (
                sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
              )}
            </div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MuiIcons.AssignmentOutlined style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
              <p>No tasks found</p>
              <button
                onClick={handleAdd}
                className="mt-4 text-teal-400 hover:text-teal-300 font-medium"
              >
                Create your first task
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {tasks.map((task: Task) => renderListRow(task))}
            </div>
          )}
        </div>
      ) : (
        /* Detailed View */
        <div>
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-800/50 border border-slate-700 rounded-xl">
              <MuiIcons.AssignmentOutlined style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
              <p>No tasks found</p>
              <button
                onClick={handleAdd}
                className="mt-4 text-teal-400 hover:text-teal-300 font-medium"
              >
                Create your first task
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task: Task) => renderDetailedCard(task))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageTasks;
