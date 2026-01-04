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
import { useTasks, useUpdateTask, useProjects, useTags, useStatuses, useCategories } from '../../api';
import { TaskModal } from '../../widgets/WeeklyKanban/TaskModal';
import type { Task, Category, Project } from '../../types';

// View modes: list (compact), card (enhanced)
type ViewMode = 'list' | 'card';

interface CategoryColumnProps {
  categoryId: string | null;
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
  onAddTask: (categoryId: string | null) => void;
  onToggleCollapse: (categoryId: string | null) => void;
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
      {task.project && (
        <span className="text-[10px] px-1 rounded flex-shrink-0 bg-indigo-500/20 text-indigo-400">
          {task.project.name}
        </span>
      )}
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

        {(task.project || task.plannedDate || (task.priority && task.priority <= 3) || (task.tags && task.tags.length > 0)) && (
          <div className="flex items-center gap-1.5 mt-1 ml-5 flex-wrap">
            {task.project && (
              <span className="text-[10px] px-1 rounded bg-indigo-500/20 text-indigo-400">
                {task.project.name}
              </span>
            )}
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
 * Droppable category column
 */
function CategoryColumn({
  categoryId,
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
}: CategoryColumnProps) {
  const droppableId = categoryId ?? 'no-category';
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const [isHovered, setIsHovered] = useState(false);

  // Collapsed column
  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        onClick={() => onToggleCollapse(categoryId)}
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
      className={`flex flex-col min-h-0 h-full transition-all duration-150 ${!isLast ? 'border-r border-slate-600/40' : ''} ${isOver ? 'bg-amber-800/25 ring-2 ring-inset ring-amber-500/40' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center gap-2 px-2 py-1.5 flex-shrink-0 border-b group transition-colors duration-150 ${isOver ? 'bg-amber-700/30 border-amber-500/50' : 'border-slate-600/30'}`}>
        <span style={{ color }} className="opacity-80">{icon}</span>
        <span className="font-condensed font-medium text-sm text-slate-300 truncate">{title}</span>
        <span className="text-xs text-slate-500">{tasks.length}</span>
        <div className={`ml-auto flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(categoryId); }}
            className="p-0.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-orange-400 transition-colors"
            title={`Hide ${title} column`}
          >
            <MuiIcons.VisibilityOff style={{ fontSize: 14 }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddTask(categoryId); }}
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
  if (!iconName) return <MuiIcons.Category style={{ fontSize: 16 }} />;
  const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
  return IconComponent ? <IconComponent style={{ fontSize: 16 }} /> : <MuiIcons.Category style={{ fontSize: 16 }} />;
}

const STORAGE_KEY_VIEW_MODE = 'categoryView:viewMode';

/**
 * Category View - Kanban board organized by categories (via project associations)
 *
 * Tasks are grouped by their project's category. Tasks without a project
 * or with a project that has no category are shown in "Uncategorized".
 */
export function CategoryView() {
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
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string | null>>(new Set());

  // Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createProjectId, setCreateProjectId] = useState<string | undefined>(undefined);

  // Optimistic updates - track which tasks are being moved
  const [movingTaskIds, setMovingTaskIds] = useState<Set<string>>(new Set());

  const handleAddTask = useCallback((categoryId: string | null) => {
    // Find a project in this category to use as default
    // (We'll set the project ID when creating the task)
    setCreateProjectId(undefined); // Will let user choose
    setIsCreatingTask(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreatingTask(false);
    setCreateProjectId(undefined);
  }, []);

  // Fetch data
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: statusesData } = useStatuses();
  const { data: tagsData } = useTags();

  const allTasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);
  const allCategories = useMemo(() => (categoriesData?.data ?? []).filter(c => !c.isDeleted).sort((a, b) => a.sortOrder - b.sortOrder), [categoriesData?.data]);
  const allProjects = useMemo(() => (projectsData?.data ?? []).filter(p => !p.isDeleted), [projectsData?.data]);
  const allStatuses = useMemo(() => statusesData?.data ?? [], [statusesData?.data]);
  const tags = useMemo(() => tagsData?.data ?? [], [tagsData?.data]);

  // Build a map of projectId -> categoryId for quick lookup
  const projectCategoryMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const project of allProjects) {
      map.set(project.id, project.categoryId ?? null);
    }
    return map;
  }, [allProjects]);

  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Group tasks by category (via their project's category)
  const { tasksByCategory, totalTasks } = useMemo(() => {
    let filtered = allTasks.filter((t) => !t.isDeleted && !t.parentTaskId);

    // Apply filters
    if (selectedStatus) {
      filtered = filtered.filter((t) => t.statusId === selectedStatus);
    }
    if (selectedPriority) {
      const priority = parseInt(selectedPriority, 10);
      filtered = filtered.filter((t) => t.priority === priority);
    }
    if (selectedProject) {
      filtered = filtered.filter((t) => t.projectId === selectedProject);
    }
    if (selectedTag) {
      filtered = filtered.filter((t) => t.tags?.some((tag) => tag.id === selectedTag));
    }

    const sorted = [...filtered].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Build groups - one for each category + "Uncategorized"
    const byCategory: Record<string, Task[]> = { 'no-category': [] };
    for (const category of allCategories) {
      byCategory[category.id] = [];
    }

    for (const task of sorted) {
      // Get category from task's project
      const projectCategoryId = task.projectId ? projectCategoryMap.get(task.projectId) : null;
      const key = projectCategoryId ?? 'no-category';
      if (byCategory[key]) {
        byCategory[key].push(task);
      } else {
        byCategory['no-category'].push(task);
      }
    }

    return { tasksByCategory: byCategory, totalTasks: sorted.length };
  }, [allTasks, allCategories, selectedStatus, selectedPriority, selectedProject, selectedTag, projectCategoryMap]);

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

    // Determine target category
    let targetCategoryId: string | null = null;
    if (overId === 'no-category') {
      targetCategoryId = null;
    } else if (allCategories.find((c) => c.id === overId)) {
      targetCategoryId = overId;
    } else {
      // Dropped on a task - find its category
      for (const [categoryId, tasks] of Object.entries(tasksByCategory)) {
        if (tasks.some((t) => t.id === overId)) {
          targetCategoryId = categoryId === 'no-category' ? null : categoryId;
          break;
        }
      }
    }

    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;

    // Get current category from task's project
    const currentCategoryId = task.projectId ? projectCategoryMap.get(task.projectId) : null;

    if (currentCategoryId !== targetCategoryId) {
      // Find a project in the target category to assign
      const targetProject = targetCategoryId
        ? allProjects.find(p => p.categoryId === targetCategoryId)
        : null;

      if (targetProject || targetCategoryId === null) {
        setMovingTaskIds(prev => new Set(prev).add(taskId));

        updateTask.mutate(
          { id: taskId, projectId: targetProject?.id ?? undefined },
          {
            onSettled: () => {
              setMovingTaskIds(prev => {
                const next = new Set(prev);
                next.delete(taskId);
                return next;
              });
            },
          }
        );
      }
    }
  }, [allTasks, allCategories, allProjects, tasksByCategory, updateTask, projectCategoryMap]);

  const toggleCollapseCategory = useCallback((categoryId: string | null) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedProject('');
    setSelectedTag('');
  }, []);

  const hasActiveFilters = selectedStatus || selectedPriority || selectedProject || selectedTag;

  if (tasksLoading || categoriesLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <MuiIcons.Sync className="animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  // Build columns: Categories first, then "Uncategorized"
  const columns: { id: string | null; category: Category | null }[] = [
    ...allCategories.map((c) => ({ id: c.id, category: c })),
    { id: null, category: null },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-3">
          <MuiIcons.Category className="text-amber-400" style={{ fontSize: 22 }} />
          <span className="font-condensed font-semibold text-lg text-slate-200">Category Board</span>
          <span className="text-sm text-slate-500">{totalTasks} tasks</span>
          <div className="flex-1" />
          <button
            onClick={() => handleAddTask(allCategories[0]?.id ?? null)}
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
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-800/50 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 focus:ring-1 focus:ring-teal-500/50"
          >
            <option value="">All Projects</option>
            {allProjects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
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
            {columns.map(({ id, category }, index) => {
              const colId = id ?? 'no-category';
              const isCollapsed = collapsedCategories.has(id);
              const tasks = tasksByCategory[colId] ?? [];

              return (
                <div
                  key={colId}
                  className={`h-full ${isCollapsed ? '' : 'flex-1 min-w-0'}`}
                  style={isCollapsed ? { width: 28 } : { minWidth: 150 }}
                >
                  <CategoryColumn
                    categoryId={id}
                    title={category?.name ?? 'Uncategorized'}
                    tasks={tasks}
                    icon={category ? getIconComponent(category.icon) : <MuiIcons.HelpOutline style={{ fontSize: 16 }} />}
                    color={category?.iconColor || '#f59e0b'}
                    isFirst={index === 0}
                    isLast={index === columns.length - 1}
                    viewMode={viewMode}
                    isCollapsed={isCollapsed}
                    movingTaskIds={movingTaskIds}
                    onEditTask={setEditingTask}
                    onAddTask={handleAddTask}
                    onToggleCollapse={toggleCollapseCategory}
                  />
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="bg-slate-800 rounded px-2 py-1 shadow-lg border border-amber-500/50">
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

export default CategoryView;
