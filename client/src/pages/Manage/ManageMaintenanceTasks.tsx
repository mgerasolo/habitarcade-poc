import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useMaintenanceTasks, useDeleteMaintenanceTask, useCompleteMaintenanceTask, useRestoreMaintenanceTask } from '../../api/maintenanceTasks';
import { useUIStore } from '../../stores';
import type { MaintenanceTask, MaintenanceFrequency } from '../../types';
import { formatDistanceToNow, isPast, format } from 'date-fns';

// Frequency display labels
const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  custom: 'Custom',
};

// Priority display
const PRIORITY_CONFIG: Record<number, { label: string; color: string; bgColor: string }> = {
  1: { label: 'Low', color: '#94a3b8', bgColor: '#94a3b820' },
  2: { label: 'Medium', color: '#f59e0b', bgColor: '#f59e0b20' },
  3: { label: 'High', color: '#ef4444', bgColor: '#ef444420' },
};

/**
 * Manage Maintenance Tasks Page
 *
 * Features:
 * - View all recurring maintenance tasks
 * - Filter by location or overdue status
 * - Mark tasks as complete
 * - See when tasks are due
 * - Create, edit, and delete tasks
 */
export function ManageMaintenanceTasks() {
  const { data: tasksData, isLoading } = useMaintenanceTasks();
  const deleteTask = useDeleteMaintenanceTask();
  const completeTask = useCompleteMaintenanceTask();
  const restoreTask = useRestoreMaintenanceTask();
  const { openModal } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'priority' | 'location'>('due');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get unique locations for filter
  const locations = useMemo(() => {
    if (!tasksData?.data) return [];
    const locs = new Set<string>();
    tasksData.data.forEach((t: MaintenanceTask) => {
      if (t.location && !t.isDeleted) locs.add(t.location);
    });
    return Array.from(locs).sort();
  }, [tasksData]);

  // Filter and sort tasks
  const tasks = useMemo(() => {
    if (!tasksData?.data) return [];

    let filtered = tasksData.data.filter((t: MaintenanceTask) => !t.isDeleted);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t: MaintenanceTask) =>
        t.name.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)) ||
        (t.location && t.location.toLowerCase().includes(query))
      );
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter((t: MaintenanceTask) => t.location === locationFilter);
    }

    // Apply overdue filter
    if (showOverdueOnly) {
      filtered = filtered.filter((t: MaintenanceTask) =>
        t.nextDueAt && isPast(new Date(t.nextDueAt))
      );
    }

    // Sort
    filtered.sort((a: MaintenanceTask, b: MaintenanceTask) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'due':
          const dateA = a.nextDueAt ? new Date(a.nextDueAt).getTime() : Infinity;
          const dateB = b.nextDueAt ? new Date(b.nextDueAt).getTime() : Infinity;
          comparison = dateA - dateB;
          break;
        case 'priority':
          comparison = (b.priority || 1) - (a.priority || 1);
          break;
        case 'location':
          comparison = (a.location || '').localeCompare(b.location || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tasksData, searchQuery, locationFilter, showOverdueOnly, sortBy, sortDirection]);

  // Count overdue tasks
  const overdueCount = useMemo(() => {
    if (!tasksData?.data) return 0;
    return tasksData.data.filter((t: MaintenanceTask) =>
      !t.isDeleted && t.nextDueAt && isPast(new Date(t.nextDueAt))
    ).length;
  }, [tasksData]);

  // Handle complete
  const handleComplete = async (task: MaintenanceTask) => {
    try {
      await completeTask.mutateAsync({ id: task.id });
      toast.success(`Completed "${task.name}"`);
    } catch (error) {
      toast.error('Failed to mark task as complete');
    }
  };

  // Handle delete with confirmation
  const handleDelete = (task: MaintenanceTask) => {
    openModal('confirm-delete', {
      title: 'Delete Maintenance Task',
      message: `Are you sure you want to delete "${task.name}"? This will remove the task and its completion history.`,
      onConfirm: async () => {
        try {
          await deleteTask.mutateAsync(task.id);
          toast.success(`Deleted "${task.name}"`);
        } catch (error) {
          toast.error('Failed to delete task');
        }
      }
    });
  };

  // Handle add new (placeholder - will need a form modal)
  const handleAdd = () => {
    toast('Maintenance task form coming soon!', { icon: 'info' });
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
  const renderIcon = (task: MaintenanceTask) => {
    if (!task.icon) {
      return (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: task.iconColor ? `${task.iconColor}20` : '#f59e0b20' }}
        >
          <MuiIcons.Build style={{ color: task.iconColor || '#f59e0b', fontSize: 18 }} />
        </div>
      );
    }

    if (task.icon.startsWith('material:')) {
      const iconName = task.icon.replace('material:', '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${task.iconColor || '#f59e0b'}20` }}
          >
            <IconComponent style={{ color: task.iconColor || '#f59e0b', fontSize: 18 }} />
          </div>
        );
      }
    }

    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${task.iconColor || '#f59e0b'}20` }}
      >
        <i className={task.icon} style={{ color: task.iconColor || '#f59e0b', fontSize: 16 }} />
      </div>
    );
  };

  // Render due status
  const renderDueStatus = (task: MaintenanceTask) => {
    if (!task.nextDueAt) {
      return <span className="text-slate-500">No due date</span>;
    }

    const dueDate = new Date(task.nextDueAt);
    const isOverdue = isPast(dueDate);
    const timeAgo = formatDistanceToNow(dueDate, { addSuffix: true });

    return (
      <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
        {isOverdue && <MuiIcons.Warning style={{ fontSize: 14 }} />}
        <span className="text-sm">
          {isOverdue ? `Overdue ${timeAgo}` : `Due ${timeAgo}`}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6" data-testid="manage-maintenance-tasks-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <MuiIcons.Build style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Maintenance Tasks</h1>
            <p className="text-sm text-slate-400">
              {tasks.length} tasks
              {overdueCount > 0 && (
                <span className="text-red-400 ml-2">({overdueCount} overdue)</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-amber-600/20"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        {/* Location Filter */}
        {locations.length > 0 && (
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">All Locations</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        )}

        {/* Overdue Filter */}
        <button
          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            showOverdueOnly
              ? 'bg-red-600/20 text-red-400 border border-red-600/50'
              : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <MuiIcons.Warning style={{ fontSize: 18 }} />
          Overdue Only
          {overdueCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full">
              {overdueCount}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-4 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
            Task
            {sortBy === 'name' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('location')}>
            Location
            {sortBy === 'location' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('priority')}>
            Priority
            {sortBy === 'priority' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('due')}>
            Due
            {sortBy === 'due' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            Loading maintenance tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MuiIcons.BuildOutlined style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
            <p>{showOverdueOnly ? 'No overdue tasks' : 'No maintenance tasks found'}</p>
            {!showOverdueOnly && (
              <button
                onClick={handleAdd}
                className="mt-4 text-amber-400 hover:text-amber-300 font-medium"
              >
                Create your first maintenance task
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {tasks.map((task: MaintenanceTask) => {
              const priorityConfig = PRIORITY_CONFIG[task.priority || 1];
              const isOverdue = task.nextDueAt && isPast(new Date(task.nextDueAt));

              return (
                <div
                  key={task.id}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-700/30 transition-colors ${
                    isOverdue ? 'bg-red-900/10' : ''
                  }`}
                >
                  {/* Task Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    {renderIcon(task)}
                    <div>
                      <span className="text-white font-medium block">{task.name}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">
                          {FREQUENCY_LABELS[task.frequency as MaintenanceFrequency]}
                        </span>
                        {task.estimatedMinutes && (
                          <>
                            <span className="text-slate-600">-</span>
                            <span className="text-slate-400">{task.estimatedMinutes} min</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-span-2">
                    {task.location ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                        <MuiIcons.Room style={{ fontSize: 14 }} />
                        {task.location}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="col-span-2">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium"
                      style={{ backgroundColor: priorityConfig.bgColor, color: priorityConfig.color }}
                    >
                      {priorityConfig.label}
                    </span>
                  </div>

                  {/* Due Date */}
                  <div className="col-span-2">
                    {renderDueStatus(task)}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleComplete(task)}
                      className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-600/10 rounded-lg transition-colors"
                      title="Mark Complete"
                    >
                      <MuiIcons.CheckCircle style={{ fontSize: 18 }} />
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
            })}
          </div>
        )}
      </div>

      {/* Last completed info */}
      {tasks.length > 0 && (
        <div className="mt-4 text-sm text-slate-500">
          Click the checkmark to mark a task complete and reset its due date.
        </div>
      )}
    </div>
  );
}

export default ManageMaintenanceTasks;
