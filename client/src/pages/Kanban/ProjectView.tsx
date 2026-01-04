import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast, parseISO } from 'date-fns';
import * as MuiIcons from '@mui/icons-material';
import { useTasks, useUpdateTask, useProjects, useTags, useStatuses } from '../../api';
import { TaskModal } from '../../widgets/WeeklyKanban/TaskModal';
import type { Task, Project } from '../../types';

// View modes: list (compact), card (enhanced)
type ViewMode = 'list' | 'card';

interface ProjectColumnProps {
  projectId: string | null;
  title: string;
  tasks: Task[];
  icon: React.ReactNode;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  viewMode: ViewMode;
  isCollapsed: boolean;
  movingTaskIds: Set<string>;
  onEditTask: (task: Task) => void;
  onAddTask: (projectId: string | null) => void;
  onToggleCollapse: (projectId: string | null) => void;
}

/**
 * List view - compact task row
 */
function ListTaskRow({
  task,
  onEdit,
  isBeingMoved,
}: {
  task: Task;
  onEdit: () => void;
  isBeingMoved?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isComplete = task.status === 'complete';
  const statusColor = task.statusId ? '#14b8a6' : '#94a3b8';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isBeingMoved ? 'none' : transition,
    opacity: isDragging ? 0.5 : isBeingMoved ? 0 : 1,
    visibility: isBeingMoved ? 'hidden' as const : 'visible' as const,
  };

  const DragHandle = (
    <div
      {...attributes}
      {...listeners}
      className={`flex-shrink-0 cursor-grab active:cursor-grabbing transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
      title="Drag to move"
    >
      <MuiIcons.DragIndicator style={{ fontSize: 14 }} className="text-slate-500 hover:text-slate-300" />
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 py-1 px-1 rounded transition-colors group hover:bg-slate-700/30 ${isComplete ? 'opacity-60' : ''} ${isDragging ? 'z-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {DragHandle}
      <div
        className={`w-3 h-3 rounded-sm border flex-shrink-0 ${isComplete ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}
      />
      {/* Status indicator */}
      <div
        className="w-1.5 h-4 rounded-sm flex-shrink-0"
        style={{ backgroundColor: statusColor }}
        title={task.status || 'No status'}
      />
      <span
        onClick={onEdit}
        className={`flex-1 text-sm truncate cursor-pointer ${isComplete ? 'line-through text-slate-500' : 'text-slate-200'}`}
        title={task.title}
      >
        {task.title}
      </span>
      {task.children && task.children.length > 0 && (
        <span className="text-[10px] px-1 rounded flex-shrink-0 bg-slate-600/50 text-slate-400">
          <MuiIcons.AccountTree style={{ fontSize: 10, marginRight: 2 }} />
          {task.children.length}
        </span>
      )}
      {task.priority && task.priority <= 2 && (
        <span className={`text-[10px] px-1 rounded flex-shrink-0 ${task.priority === 1 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
          P{task.priority}
        </span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className={`flex-shrink-0 p-0.5 rounded hover:bg-slate-600/50 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        title="Edit task"
      >
        <MuiIcons.Edit style={{ fontSize: 12 }} className="text-slate-400 hover:text-teal-400" />
      </button>
      {DragHandle}
    </div>
  );
}

/**
 * Card view - enhanced task card with more details
 */
function CardTaskRow({
  task,
  onEdit,
  isBeingMoved,
}: {
  task: Task;
  onEdit: () => void;
  isBeingMoved?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isComplete = task.status === 'complete';
  const statusColor = task.statusId ? '#14b8a6' : '#94a3b8';
  const isOverdue = task.plannedDate && !isComplete && isPast(parseISO(task.plannedDate + 'T23:59:59'));
  const hasDescription = !!task.description;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isBeingMoved ? 'none' : transition,
    opacity: isDragging ? 0.5 : isBeingMoved ? 0 : 1,
    visibility: isBeingMoved ? 'hidden' as const : 'visible' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-lg border transition-all cursor-pointer ${isComplete ? 'border-slate-700/50 bg-slate-800/30 opacity-60' : 'border-slate-600/50 bg-slate-800/50 hover:border-slate-500/70 hover:bg-slate-700/50'} ${isDragging ? 'z-50 shadow-lg' : ''} ${isOverdue ? 'border-l-2 border-l-red-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEdit}
    >
      <div className="relative py-1.5 pl-2.5 pr-1.5">
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className={`absolute left-0 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          title="Drag to move"
        >
          <MuiIcons.DragIndicator style={{ fontSize: 14 }} className="text-slate-500 hover:text-slate-300" />
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 ${isComplete ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`} />
          <span
            className={`text-sm leading-tight flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${isComplete ? 'line-through text-slate-500' : 'text-slate-200'}`}
            title={task.title}
          >
            {task.title}
          </span>
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor }}
            title={task.status || 'No status'}
          />
          {hasDescription && <MuiIcons.Notes style={{ fontSize: 11 }} className="text-slate-500 flex-shrink-0" titleAccess="Has notes" />}
          {task.plannedDate && !isOverdue && <MuiIcons.Alarm style={{ fontSize: 11 }} className="text-amber-400 flex-shrink-0" titleAccess="Has due date" />}
          {isOverdue && <MuiIcons.Warning style={{ fontSize: 11 }} className="text-red-400 flex-shrink-0" titleAccess="Overdue" />}
          {task.children && task.children.length > 0 && (
            <span className="text-[10px] px-1 rounded flex-shrink-0 bg-slate-600/50 text-slate-400">
              <MuiIcons.AccountTree style={{ fontSize: 10, marginRight: 2 }} />
              {task.children.length}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={`flex-shrink-0 p-0.5 rounded hover:bg-slate-600/50 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            title="Edit task"
          >
            <MuiIcons.Edit style={{ fontSize: 12 }} className="text-slate-400 hover:text-teal-400" />
          </button>
        </div>

        {(task.plannedDate || (task.priority && task.priority <= 3) || (task.tags && task.tags.length > 0)) && (
          <div className="flex items-center gap-1.5 mt-1 ml-5 flex-wrap">
            {task.priority && task.priority <= 3 && (
              <span className={`text-[10px] px-1 rounded ${task.priority === 1 ? 'bg-red-500/20 text-red-400' : task.priority === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                P{task.priority}
              </span>
            )}
            {task.plannedDate && (
              <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                <MuiIcons.CalendarToday style={{ fontSize: 10 }} className="mr-0.5 -mt-0.5" />
                {format(parseISO(task.plannedDate), 'MMM d')}
              </span>
            )}
            {task.tags?.slice(0, 2).map(tag => (
              <span key={tag.id} className="text-[10px] px-1 py-0.5 rounded bg-slate-700/50 text-slate-400">
                {tag.name}
              </span>
            ))}
            {(task.tags?.length || 0) > 2 && (
              <span className="text-[10px] text-slate-500">+{(task.tags?.length || 0) - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Droppable project column
 */
function ProjectColumn({
  projectId,
  title,
  tasks,
  icon,
  color,
  isFirst: _isFirst,
  isLast,
  viewMode,
  isCollapsed,
  movingTaskIds,
  onEditTask,
  onAddTask,
  onToggleCollapse,
}: ProjectColumnProps) {
  const droppableId = projectId ?? 'no-project';
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const [isHovered, setIsHovered] = useState(false);

  // Collapsed column
  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        onClick={() => onToggleCollapse(projectId)}
        className={`flex flex-col items-center h-full cursor-pointer transition-all duration-200 hover:bg-slate-700/30 ${!isLast ? 'border-r border-slate-600/40' : ''}`}
        style={{ width: 28, minWidth: 28, maxWidth: 28 }}
        title={`${title} (${tasks.length}) - Click to expand`}
      >
        <div className="flex items-center justify-center py-2 flex-shrink-0 border-b border-slate-600/30 w-full" style={{ height: 32 }}>
          <span style={{ color }} className="opacity-60">
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ style?: React.CSSProperties }>, { style: { fontSize: 14 } }) : icon}
          </span>
        </div>
        <div className="flex-1 flex items-start justify-center pt-2 overflow-hidden">
          <span
            className="font-condensed font-medium text-xs text-slate-400 whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {title}
            <span className="text-slate-500 ml-1">({tasks.length})</span>
          </span>
        </div>
      </div>
    );
  }

  // Expanded column
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-0 h-full transition-all duration-150 ${!isLast ? 'border-r border-slate-600/40' : ''} ${isOver ? 'bg-teal-800/25 ring-2 ring-inset ring-teal-500/40' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center gap-2 px-2 py-1.5 flex-shrink-0 border-b group transition-colors duration-150 ${isOver ? 'bg-teal-700/30 border-teal-500/50' : 'border-slate-600/30'}`}>
        <span style={{ color }} className="opacity-80">{icon}</span>
        <span className="font-condensed font-medium text-sm text-slate-300 truncate">{title}</span>
        <span className="text-xs text-slate-500">{tasks.length}</span>
        <div className={`ml-auto flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(projectId); }}
            className="p-0.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-orange-400 transition-colors"
            title={`Hide ${title} column`}
          >
            <MuiIcons.VisibilityOff style={{ fontSize: 14 }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddTask(projectId); }}
            className="p-0.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-teal-400 transition-colors"
            title={`Add task to ${title}`}
          >
            <MuiIcons.Add style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-1">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {viewMode === 'list' ? (
            <div className="space-y-0.5">
              {tasks.map((task) => (
                <ListTaskRow key={task.id} task={task} onEdit={() => onEditTask(task)} isBeingMoved={movingTaskIds.has(task.id)} />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <CardTaskRow key={task.id} task={task} onEdit={() => onEditTask(task)} isBeingMoved={movingTaskIds.has(task.id)} />
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
 * Get MUI icon component by name
 */
function getIconComponent(iconName?: string): React.ReactNode {
  if (!iconName) return <MuiIcons.Folder style={{ fontSize: 16 }} />;
  const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
  return IconComponent ? <IconComponent style={{ fontSize: 16 }} /> : <MuiIcons.Folder style={{ fontSize: 16 }} />;
}

const STORAGE_KEY_VIEW_MODE = 'projectView:viewMode';

/**
 * Project View - Kanban board organized by projects
 */
export function ProjectView() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
    return saved === 'list' || saved === 'card' ? saved : 'list';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIEW_MODE, viewMode);
  }, [viewMode]);

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string | null>>(new Set());

  // Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createProjectId, setCreateProjectId] = useState<string | undefined>(undefined);

  // Optimistic project updates
  const [optimisticProjectChanges, setOptimisticProjectChanges] = useState<Map<string, string | null>>(new Map());
  const movingTaskIds = useMemo(() => new Set(optimisticProjectChanges.keys()), [optimisticProjectChanges]);

  const handleAddTask = useCallback((projectId: string | null) => {
    setCreateProjectId(projectId ?? undefined);
    setIsCreatingTask(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreatingTask(false);
    setCreateProjectId(undefined);
  }, []);

  // Fetch data
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: statusesData } = useStatuses();
  const { data: tagsData } = useTags();

  const allTasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);
  const allProjects = useMemo(() => (projectsData?.data ?? []).filter(p => !p.isDeleted).sort((a, b) => a.sortOrder - b.sortOrder), [projectsData?.data]);
  const allStatuses = useMemo(() => statusesData?.data ?? [], [statusesData?.data]);
  const tags = useMemo(() => tagsData?.data ?? [], [tagsData?.data]);

  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Group tasks by projectId
  const { tasksByProject, totalTasks } = useMemo(() => {
    let filtered = allTasks.filter((t) => !t.isDeleted && !t.parentTaskId);

    // Apply filters
    if (selectedStatus) {
      filtered = filtered.filter((t) => t.statusId === selectedStatus);
    }
    if (selectedPriority) {
      const priority = parseInt(selectedPriority, 10);
      filtered = filtered.filter((t) => t.priority === priority);
    }
    if (selectedTag) {
      filtered = filtered.filter((t) => t.tags?.some((tag) => tag.id === selectedTag));
    }

    const sorted = [...filtered].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Build groups - one for each project + "No Project"
    const byProject: Record<string, Task[]> = { 'no-project': [] };
    for (const project of allProjects) {
      byProject[project.id] = [];
    }

    for (const task of sorted) {
      const targetProjectId = optimisticProjectChanges.get(task.id) ?? task.projectId;
      const key = targetProjectId ?? 'no-project';
      if (byProject[key]) {
        byProject[key].push(task);
      } else {
        byProject['no-project'].push(task);
      }
    }

    return { tasksByProject: byProject, totalTasks: sorted.length };
  }, [allTasks, allProjects, selectedStatus, selectedPriority, selectedTag, optimisticProjectChanges]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = allTasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }, [allTasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Determine target project
    let targetProjectId: string | null = null;
    if (overId === 'no-project') {
      targetProjectId = null;
    } else if (allProjects.find((p) => p.id === overId)) {
      targetProjectId = overId;
    } else {
      // Dropped on a task - find its project
      for (const [projectId, tasks] of Object.entries(tasksByProject)) {
        if (tasks.some((t) => t.id === overId)) {
          targetProjectId = projectId === 'no-project' ? null : projectId;
          break;
        }
      }
    }

    const task = allTasks.find((t) => t.id === taskId);
    const currentProjectId = optimisticProjectChanges.has(taskId)
      ? optimisticProjectChanges.get(taskId)
      : task?.projectId ?? null;

    if (task && currentProjectId !== targetProjectId) {
      setOptimisticProjectChanges((prev) => new Map(prev).set(taskId, targetProjectId));

      updateTask.mutate(
        { id: taskId, projectId: targetProjectId ?? undefined },
        {
          onSettled: () => {
            setOptimisticProjectChanges((prev) => {
              const next = new Map(prev);
              next.delete(taskId);
              return next;
            });
          },
        }
      );
    }
  }, [allTasks, allProjects, tasksByProject, updateTask, optimisticProjectChanges]);

  const toggleCollapseProject = useCallback((projectId: string | null) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedTag('');
  }, []);

  const hasActiveFilters = selectedStatus || selectedPriority || selectedTag;

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <MuiIcons.Sync className="animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  // Build columns: Projects first, then "No Project"
  const columns: { id: string | null; project: Project | null }[] = [
    ...allProjects.map((p) => ({ id: p.id, project: p })),
    { id: null, project: null },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-3">
          <MuiIcons.Folder className="text-indigo-400" style={{ fontSize: 22 }} />
          <span className="font-condensed font-semibold text-lg text-slate-200">Project Board</span>
          <span className="text-sm text-slate-500">{totalTasks} tasks</span>
          <div className="flex-1" />
          <button
            onClick={() => handleAddTask(allProjects[0]?.id ?? null)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded transition-colors"
          >
            <MuiIcons.Add style={{ fontSize: 16 }} />
            Add Task
          </button>
        </div>
      </div>

      {/* View Options */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">VIEW</span>
          <div className="flex items-center bg-slate-800/50 rounded p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <MuiIcons.ViewList style={{ fontSize: 14 }} />
              List
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'card' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <MuiIcons.ViewAgenda style={{ fontSize: 14 }} />
              Card
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-3 py-1.5 border-b border-slate-700/30 bg-slate-800/20">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">FILTER</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50"
          >
            <option value="">All Statuses</option>
            {allStatuses.filter(s => !s.isBreakout).map((status) => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50"
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
            className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700/50"
            >
              <MuiIcons.Clear style={{ fontSize: 12 }} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="h-full flex">
            {columns.map(({ id, project }, index) => {
              const colId = id ?? 'no-project';
              const isCollapsed = collapsedProjects.has(id);
              const tasks = tasksByProject[colId] ?? [];

              return (
                <div
                  key={colId}
                  className={`h-full ${isCollapsed ? '' : 'flex-1 min-w-0'}`}
                  style={isCollapsed ? { width: 28 } : { minWidth: 150 }}
                >
                  <ProjectColumn
                    projectId={id}
                    title={project?.name ?? 'No Project'}
                    tasks={tasks}
                    icon={project ? getIconComponent(project.icon) : <MuiIcons.FolderOff style={{ fontSize: 16 }} />}
                    color={project?.color || project?.iconColor || '#6366f1'}
                    isFirst={index === 0}
                    isLast={index === columns.length - 1}
                    viewMode={viewMode}
                    isCollapsed={isCollapsed}
                    movingTaskIds={movingTaskIds}
                    onEditTask={setEditingTask}
                    onAddTask={handleAddTask}
                    onToggleCollapse={toggleCollapseProject}
                  />
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-slate-800 rounded px-2 py-1 shadow-lg border border-teal-500/50">
                <span className="text-sm text-white">{activeTask.title}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task edit modal */}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />}

      {/* Task create modal */}
      {isCreatingTask && <TaskModal defaultProjectId={createProjectId} onClose={handleCloseCreateModal} />}
    </div>
  );
}

export default ProjectView;
