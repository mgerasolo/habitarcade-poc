import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import * as MuiIcons from '@mui/icons-material';
import { useTasks, useUpdateTask, useProjects, useTags, useStatuses } from '../../api';
import { TaskCard } from '../../widgets/WeeklyKanban/TaskCard';
import { TaskModal } from '../../widgets/WeeklyKanban/TaskModal';
import type { Task } from '../../types';

type ViewMode = 'card' | 'details';

interface StatusColumnProps {
  statusId: string;
  title: string;
  tasks: Task[];
  icon: React.ReactNode;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  viewMode: ViewMode;
  onEditTask: (task: Task) => void;
  onAddTask: (statusId: string) => void;
}

/**
 * Compact task row for card view - minimal whiteboard style
 */
function CompactTaskRow({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: () => void;
}) {
  const isComplete = task.status === 'complete';
  const projectColor = task.project?.color || task.project?.iconColor || '#6366f1';

  return (
    <div
      onClick={onEdit}
      className={`
        flex items-center gap-2 py-1 px-1 cursor-pointer
        hover:bg-slate-700/30 rounded transition-colors
        ${isComplete ? 'opacity-60' : ''}
      `}
    >
      {/* Checkbox indicator */}
      <div
        className={`
          w-3 h-3 rounded-sm border flex-shrink-0
          ${isComplete
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-500'
          }
        `}
      />
      {/* Project indicator */}
      {task.project && (
        <div
          className="w-1.5 h-4 rounded-sm flex-shrink-0"
          style={{ backgroundColor: projectColor }}
        />
      )}
      {/* Title */}
      <span className={`text-sm truncate ${isComplete ? 'line-through text-slate-500' : 'text-slate-200'}`}>
        {task.title}
      </span>
      {/* Priority badge */}
      {task.priority && task.priority <= 2 && (
        <span className={`text-[10px] px-1 rounded flex-shrink-0 ${
          task.priority === 1 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
        }`}>
          P{task.priority}
        </span>
      )}
    </div>
  );
}

/**
 * Droppable column - whiteboard style with vertical dividers
 */
function StatusColumn({
  statusId,
  title,
  tasks,
  icon,
  color,
  isFirst: _isFirst,
  isLast,
  viewMode,
  onEditTask,
  onAddTask,
}: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-h-0 h-full transition-colors duration-150
        ${!isLast ? 'border-r border-slate-600/40' : ''}
        ${isOver ? 'bg-teal-900/10' : ''}
      `}
    >
      {/* Column header - minimal */}
      <div className="flex items-center gap-2 px-2 py-1.5 flex-shrink-0 border-b border-slate-600/30">
        <span style={{ color }} className="opacity-80">{icon}</span>
        <span className="font-condensed font-medium text-sm text-slate-300">{title}</span>
        <span className="text-xs text-slate-500">{tasks.length}</span>
        <button
          onClick={() => onAddTask(statusId)}
          className="ml-auto p-0.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-teal-400 transition-colors"
          title={`Add task to ${title}`}
        >
          <MuiIcons.Add style={{ fontSize: 16 }} />
        </button>
      </div>

      {/* Tasks list - scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {viewMode === 'card' ? (
            // Compact card view
            <div className="space-y-0.5">
              {tasks.map((task) => (
                <CompactTaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                />
              ))}
            </div>
          ) : (
            // Original card view (kept for drag overlay)
            <div className="space-y-1">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => onEditTask(task)}
                />
              ))}
            </div>
          )}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="text-center py-4 text-slate-600 text-xs">
            <MuiIcons.Inbox style={{ fontSize: 20, opacity: 0.4 }} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Details view - data table with inline editing
 */
function DetailsTable({
  tasks,
  statuses,
  projects,
  tags: _tags,
  onEditTask,
  onUpdateTask,
}: {
  tasks: Task[];
  statuses: { id: string; name: string; color: string }[];
  projects: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  onEditTask: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'title' | 'status' | 'priority' | 'project'>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filterProject) {
      result = result.filter(t => t.projectId === filterProject);
    }
    if (filterStatus) {
      result = result.filter(t => t.statusId === filterStatus);
    }
    if (filterPriority) {
      result = result.filter(t => t.priority === parseInt(filterPriority));
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'status':
          cmp = (a.statusId || '').localeCompare(b.statusId || '');
          break;
        case 'priority':
          cmp = (a.priority || 99) - (b.priority || 99);
          break;
        case 'project':
          cmp = (a.project?.name || '').localeCompare(b.project?.name || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tasks, filterProject, filterStatus, filterPriority, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedRows.size === filteredTasks.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <MuiIcons.UnfoldMore style={{ fontSize: 14 }} className="opacity-30" />;
    return sortDir === 'asc'
      ? <MuiIcons.KeyboardArrowUp style={{ fontSize: 14 }} />
      : <MuiIcons.KeyboardArrowDown style={{ fontSize: 14 }} />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Bulk actions bar */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-2 px-2 py-1 bg-teal-900/30 border-b border-teal-700/30 text-xs">
          <span className="text-teal-400">{selectedRows.size} selected</span>
          <button className="text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-700/50">
            Bulk Edit
          </button>
          <button
            onClick={() => setSelectedRows(new Set())}
            className="text-slate-500 hover:text-white ml-auto"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm">
            <tr className="border-b border-slate-600/30">
              <th className="w-8 px-1 py-1.5">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredTasks.length && filteredTasks.length > 0}
                  onChange={toggleAllSelection}
                  className="rounded border-slate-500"
                />
              </th>
              <th className="text-left px-2 py-1.5">
                <button
                  onClick={() => toggleSort('title')}
                  className="flex items-center gap-1 text-slate-400 hover:text-white font-medium"
                >
                  Title <SortIcon field="title" />
                </button>
              </th>
              <th className="text-left px-2 py-1.5 w-32">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleSort('status')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white font-medium"
                  >
                    Status <SortIcon field="status" />
                  </button>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="ml-1 bg-transparent text-xs text-slate-500 border-none focus:ring-0 p-0"
                  >
                    <option value="">▼</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="text-left px-2 py-1.5 w-24">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleSort('priority')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white font-medium"
                  >
                    Priority <SortIcon field="priority" />
                  </button>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="ml-1 bg-transparent text-xs text-slate-500 border-none focus:ring-0 p-0"
                  >
                    <option value="">▼</option>
                    <option value="1">P1</option>
                    <option value="2">P2</option>
                    <option value="3">P3</option>
                    <option value="4">P4</option>
                  </select>
                </div>
              </th>
              <th className="text-left px-2 py-1.5 w-32">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleSort('project')}
                    className="flex items-center gap-1 text-slate-400 hover:text-white font-medium"
                  >
                    Project <SortIcon field="project" />
                  </button>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="ml-1 bg-transparent text-xs text-slate-500 border-none focus:ring-0 p-0"
                  >
                    <option value="">▼</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </th>
              <th className="text-left px-2 py-1.5 w-24">Tags</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => {
              const status = statuses.find(s => s.id === task.statusId);
              return (
                <tr
                  key={task.id}
                  className={`
                    border-b border-slate-700/20 hover:bg-slate-700/20 cursor-pointer
                    ${selectedRows.has(task.id) ? 'bg-teal-900/20' : ''}
                  `}
                  onClick={() => onEditTask(task)}
                >
                  <td className="px-1 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(task.id)}
                      onChange={() => toggleRowSelection(task.id)}
                      className="rounded border-slate-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <span className={task.status === 'complete' ? 'line-through text-slate-500' : 'text-slate-200'}>
                      {task.title}
                    </span>
                  </td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.statusId || ''}
                      onChange={(e) => onUpdateTask(task.id, { statusId: e.target.value })}
                      className="w-full bg-transparent border-none text-xs p-0 focus:ring-0"
                      style={{ color: status?.color || '#94a3b8' }}
                    >
                      {statuses.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.priority || ''}
                      onChange={(e) => onUpdateTask(task.id, { priority: parseInt(e.target.value) || undefined })}
                      className="w-full bg-transparent border-none text-xs p-0 focus:ring-0 text-slate-400"
                    >
                      <option value="">-</option>
                      <option value="1">P1</option>
                      <option value="2">P2</option>
                      <option value="3">P3</option>
                      <option value="4">P4</option>
                    </select>
                  </td>
                  <td className="px-2 py-1 text-slate-400 text-xs">
                    {task.project?.name || '-'}
                  </td>
                  <td className="px-2 py-1">
                    {task.tags?.slice(0, 2).map(tag => (
                      <span key={tag.id} className="text-[10px] px-1 py-0.5 rounded bg-slate-700/50 text-slate-400 mr-1">
                        {tag.name}
                      </span>
                    ))}
                    {(task.tags?.length || 0) > 2 && (
                      <span className="text-[10px] text-slate-500">+{(task.tags?.length || 0) - 2}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTasks.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No tasks match filters
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helper to render a MUI icon by name
 */
function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName) return <MuiIcons.Label style={{ fontSize: 16 }} />;
  const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
  return IconComponent ? <IconComponent style={{ fontSize: 16 }} /> : <MuiIcons.Label style={{ fontSize: 16 }} />;
}

/**
 * Status View - Kanban board organized by dynamic task statuses
 * Features:
 * - Card view: Compact whiteboard-style columns
 * - Details view: Data table with inline editing and Excel-like filters
 * - Drag-drop between status columns
 * - Filter by project, priority, and tags
 */
export function StatusView() {
  // View mode toggle
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Filter state
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<string>>(new Set());

  // Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createStatusId, setCreateStatusId] = useState<string>('');

  // Handler for adding a new task in a specific column
  const handleAddTask = useCallback((statusId: string) => {
    setCreateStatusId(statusId);
    setIsCreatingTask(true);
  }, []);

  // Handler for closing the create modal
  const handleCloseCreateModal = useCallback(() => {
    setIsCreatingTask(false);
    setCreateStatusId('');
  }, []);

  // Fetch data
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: statusesData, isLoading: statusesLoading } = useStatuses();
  const { data: projectsData } = useProjects();
  const { data: tagsData } = useTags();

  const allTasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);
  const allStatuses = useMemo(() => statusesData?.data ?? [], [statusesData?.data]);
  const projects = useMemo(() => projectsData?.data ?? [], [projectsData?.data]);
  const tags = useMemo(() => tagsData?.data ?? [], [tagsData?.data]);

  // Filter to main workflow statuses (non-breakout) sorted by sortOrder
  const workflowStatuses = useMemo(() =>
    allStatuses
      .filter((s) => !s.isBreakout)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [allStatuses]
  );

  const updateTask = useUpdateTask();

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter tasks and group by statusId
  const { tasksByStatus, filteredTasks } = useMemo(() => {
    let filtered = allTasks.filter((t) => !t.isDeleted);

    // Apply project filter
    if (selectedProject) {
      filtered = filtered.filter((t) => t.projectId === selectedProject);
    }

    // Apply priority filter
    if (selectedPriority) {
      const priority = parseInt(selectedPriority, 10);
      filtered = filtered.filter((t) => t.priority === priority);
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter((t) =>
        t.tags?.some((tag) => tag.id === selectedTag)
      );
    }

    // Sort by sortOrder then by creation date
    const sorted = [...filtered].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Group by statusId
    const byStatus: Record<string, Task[]> = {};
    for (const status of workflowStatuses) {
      byStatus[status.id] = [];
    }
    for (const task of sorted) {
      const statusId = task.statusId;
      if (statusId && byStatus[statusId]) {
        byStatus[statusId].push(task);
      } else {
        // Tasks without statusId or with unknown status go to first column
        const firstStatus = workflowStatuses[0];
        if (firstStatus) {
          byStatus[firstStatus.id].push(task);
        }
      }
    }

    return { tasksByStatus: byStatus, filteredTasks: sorted };
  }, [allTasks, workflowStatuses, selectedProject, selectedPriority, selectedTag]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = allTasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [allTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const taskId = active.id as string;
      const newStatusId = over.id as string;

      // Check if dropped on a valid status column
      const targetStatus = workflowStatuses.find((s) => s.id === newStatusId);
      if (targetStatus) {
        const task = allTasks.find((t) => t.id === taskId);
        if (task && task.statusId !== newStatusId) {
          // Check if this is a "complete" type status (last in workflow)
          const isComplete = targetStatus.name.toLowerCase() === 'complete' ||
                           targetStatus.name.toLowerCase() === 'done';
          updateTask.mutate({
            id: taskId,
            statusId: newStatusId,
            completedAt: isComplete ? new Date().toISOString() : undefined,
          });
        }
      }
    },
    [allTasks, workflowStatuses, updateTask]
  );

  const handleUpdateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateTask.mutate({ id, ...updates });
  }, [updateTask]);

  const toggleStatusVisibility = useCallback((statusId: string) => {
    setHiddenStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) {
        next.delete(statusId);
      } else {
        next.add(statusId);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedProject('');
    setSelectedPriority('');
    setSelectedTag('');
  }, []);

  const hasActiveFilters = selectedProject || selectedPriority || selectedTag;

  // Calculate total task count
  const totalTasks = Object.values(tasksByStatus).reduce((sum, tasks) => sum + tasks.length, 0);
  const visibleStatuses = workflowStatuses.filter((s) => !hiddenStatuses.has(s.id));

  if (tasksLoading || statusesLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <MuiIcons.Sync className="animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact header */}
      <div className="flex-shrink-0 px-2 py-1.5 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          {/* Title and view toggle */}
          <div className="flex items-center gap-2">
            <MuiIcons.ViewKanban className="text-teal-400" style={{ fontSize: 20 }} />
            <span className="font-condensed font-semibold text-slate-200">Status</span>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-800/50 rounded p-0.5">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MuiIcons.ViewWeek style={{ fontSize: 14 }} />
              Card
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'details'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MuiIcons.TableRows style={{ fontSize: 14 }} />
              Details
            </button>
          </div>

          {/* Status toggles (card view only) */}
          {viewMode === 'card' && (
            <div className="flex items-center gap-1 ml-2">
              {workflowStatuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => toggleStatusVisibility(status.id)}
                  className={`
                    flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
                    transition-colors border
                    ${!hiddenStatuses.has(status.id)
                      ? 'border-transparent'
                      : 'opacity-40 border-slate-700/30'
                    }
                  `}
                  style={{
                    backgroundColor: !hiddenStatuses.has(status.id) ? `${status.color}15` : undefined,
                    color: !hiddenStatuses.has(status.id) ? status.color : '#64748b',
                  }}
                >
                  {status.name}
                  <span className="opacity-60">({tasksByStatus[status.id]?.length ?? 0})</span>
                </button>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-800/50 border-none rounded px-2 py-0.5 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-800/50 border-none rounded px-2 py-0.5 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50"
            >
              <option value="">All Priorities</option>
              <option value="1">P1 - Critical</option>
              <option value="2">P2 - High</option>
              <option value="3">P3 - Normal</option>
              <option value="4">P4 - Low</option>
            </select>

            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-slate-800/50 border-none rounded px-2 py-0.5 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-slate-500 hover:text-white text-xs"
              >
                <MuiIcons.Clear style={{ fontSize: 14 }} />
              </button>
            )}

            <span className="text-xs text-slate-500 ml-2">
              {totalTasks} tasks
            </span>

            {/* Add Task button */}
            <button
              onClick={() => handleAddTask(workflowStatuses[0]?.id || '')}
              className="flex items-center gap-1 px-2 py-1 ml-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded transition-colors"
            >
              <MuiIcons.Add style={{ fontSize: 14 }} />
              Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Content area - fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewMode === 'card' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="h-full flex">
              {visibleStatuses.map((status, index) => (
                <div
                  key={status.id}
                  className="flex-1 min-w-0 h-full"
                  style={{ minWidth: 150 }}
                >
                  <StatusColumn
                    statusId={status.id}
                    title={status.name}
                    tasks={tasksByStatus[status.id] ?? []}
                    icon={getIconComponent(status.icon)}
                    color={status.color}
                    isFirst={index === 0}
                    isLast={index === visibleStatuses.length - 1}
                    viewMode={viewMode}
                    onEditTask={setEditingTask}
                    onAddTask={handleAddTask}
                  />
                </div>
              ))}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeTask ? (
                <div className="bg-slate-800 rounded px-2 py-1 shadow-lg border border-teal-500/50">
                  <span className="text-sm text-white">{activeTask.title}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <DetailsTable
            tasks={filteredTasks}
            statuses={workflowStatuses}
            projects={projects}
            tags={tags}
            onEditTask={setEditingTask}
            onUpdateTask={handleUpdateTask}
          />
        )}
      </div>

      {/* Task edit modal */}
      {editingTask && (
        <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}

      {/* Task create modal */}
      {isCreatingTask && (
        <TaskModal
          defaultStatusId={createStatusId}
          onClose={handleCloseCreateModal}
        />
      )}
    </div>
  );
}

export default StatusView;
