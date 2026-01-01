import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as MuiIcons from '@mui/icons-material';
import {
  useTasks,
  useUpdateTask,
  useCompleteTask,
  useUncompleteTask,
  useProjects,
} from '../../api';
import type { Task, Project } from '../../types';

// Default number of items shown in collapsed view
const DEFAULT_VISIBLE_COUNT = 3;

// Priority badge colors
const PRIORITY_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  2: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
  3: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
};

// Priority labels
const PRIORITY_LABELS: Record<number, string> = {
  1: 'P1',
  2: 'P2',
  3: 'P3',
};

interface SortablePriorityItemProps {
  task: Task;
  project?: Project;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

function SortablePriorityItem({
  task,
  project,
  onToggleComplete,
  onDelete,
  onClick,
}: SortablePriorityItemProps) {
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
    transition,
  };

  const isComplete = task.status === 'complete';
  const priorityColors = PRIORITY_COLORS[task.priority || 3] || PRIORITY_COLORS[3];
  const priorityLabel = PRIORITY_LABELS[task.priority || 3] || 'P3';
  const projectColor = project?.color || project?.iconColor || '#6366f1';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-2 px-3 py-2.5 rounded-lg
        transition-all duration-150
        ${isDragging
          ? 'opacity-90 shadow-lg shadow-teal-500/20 scale-[1.02] z-50 bg-slate-700'
          : 'bg-slate-700/50 hover:bg-slate-700/70'
        }
        ${isComplete ? 'opacity-60' : ''}
      `}
      data-testid="priority-item"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
        data-testid="priority-drag-handle"
      >
        <MuiIcons.DragIndicator style={{ fontSize: 18 }} />
      </div>

      {/* Priority badge */}
      <div
        className={`
          flex-shrink-0 w-7 h-5 flex items-center justify-center
          rounded text-[10px] font-bold border
          ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}
        `}
        data-testid="priority-badge"
      >
        {priorityLabel}
      </div>

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task.id);
        }}
        className={`
          flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200
          flex items-center justify-center
          ${isComplete
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-500 hover:border-teal-400 hover:bg-teal-500/10'
          }
        `}
        data-testid="priority-checkbox"
        aria-label={isComplete ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {isComplete && (
          <MuiIcons.Check style={{ fontSize: 14 }} />
        )}
      </button>

      {/* Task title - clickable to navigate */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onClick?.(task)}
      >
        <span
          className={`
            text-sm font-medium font-condensed line-clamp-1
            ${isComplete ? 'text-slate-500 line-through' : 'text-slate-200'}
          `}
          data-testid="priority-title"
        >
          {task.title}
        </span>
      </div>

      {/* Project badge */}
      {project && (
        <span
          className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium max-w-[70px]"
          style={{
            backgroundColor: `${projectColor}20`,
            color: projectColor,
          }}
          data-testid="priority-project"
        >
          {project.icon && (
            <span className="text-[10px]">{project.icon}</span>
          )}
          <span className="truncate">{project.name}</span>
        </span>
      )}

      {/* Delete button - visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className={`
          flex-shrink-0 p-1 rounded transition-all duration-150
          opacity-0 group-hover:opacity-100
          text-slate-500 hover:text-red-400 hover:bg-red-500/10
        `}
        title="Remove from priorities"
        data-testid="priority-delete"
        aria-label="Remove from priorities"
      >
        <MuiIcons.Close style={{ fontSize: 14 }} />
      </button>
    </div>
  );
}

// Overlay item for drag preview
function DragOverlayItem({ task, project }: { task: Task; project?: Project }) {
  const priorityColors = PRIORITY_COLORS[task.priority || 3] || PRIORITY_COLORS[3];
  const priorityLabel = PRIORITY_LABELS[task.priority || 3] || 'P3';
  const projectColor = project?.color || project?.iconColor || '#6366f1';
  const isComplete = task.status === 'complete';

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2.5 rounded-lg
        bg-slate-700 shadow-xl shadow-teal-500/30 scale-[1.02]
        ${isComplete ? 'opacity-60' : ''}
      `}
    >
      <MuiIcons.DragIndicator style={{ fontSize: 18 }} className="text-slate-400" />

      <div
        className={`
          flex-shrink-0 w-7 h-5 flex items-center justify-center
          rounded text-[10px] font-bold border
          ${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}
        `}
      >
        {priorityLabel}
      </div>

      <div
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center
          ${isComplete
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-slate-500'
          }
        `}
      >
        {isComplete && <MuiIcons.Check style={{ fontSize: 14 }} />}
      </div>

      <span
        className={`
          flex-1 text-sm font-medium font-condensed line-clamp-1
          ${isComplete ? 'text-slate-500 line-through' : 'text-slate-200'}
        `}
      >
        {task.title}
      </span>

      {project && (
        <span
          className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
          style={{
            backgroundColor: `${projectColor}20`,
            color: projectColor,
          }}
        >
          {project.name}
        </span>
      )}
    </div>
  );
}

export function PrioritiesList() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Fetch all tasks with priorities
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: projectsData } = useProjects();

  // Build projects map for quick lookup
  const projectsMap = useMemo(() => {
    const map = new Map<string, Project>();
    (projectsData?.data ?? []).forEach((p) => map.set(p.id, p));
    return map;
  }, [projectsData?.data]);

  // Get tasks with priority > 0, sorted by priority then sortOrder
  const priorityTasks = useMemo(() => {
    const tasks = tasksData?.data ?? [];
    return tasks
      .filter((t) => !t.isDeleted && t.priority && t.priority > 0)
      .sort((a, b) => {
        // Sort by priority first (lower number = higher priority)
        const priorityDiff = (a.priority || 99) - (b.priority || 99);
        if (priorityDiff !== 0) return priorityDiff;
        // Then by sortOrder
        return a.sortOrder - b.sortOrder;
      });
  }, [tasksData?.data]);

  // Separate completed and pending tasks
  const pendingTasks = useMemo(
    () => priorityTasks.filter((t) => t.status !== 'complete'),
    [priorityTasks]
  );
  const completedTasks = useMemo(
    () => priorityTasks.filter((t) => t.status === 'complete'),
    [priorityTasks]
  );

  // Combine: pending first, then completed
  const sortedTasks = useMemo(
    () => [...pendingTasks, ...completedTasks],
    [pendingTasks, completedTasks]
  );

  // Visible tasks based on expand state
  const visibleTasks = isExpanded
    ? sortedTasks
    : sortedTasks.slice(0, DEFAULT_VISIBLE_COUNT);

  const hiddenCount = sortedTasks.length - DEFAULT_VISIBLE_COUNT;

  // Mutations
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  // deleteTask not currently used - keeping priority removal via updateTask instead

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = sortedTasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [sortedTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || active.id === over.id) return;

      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id);
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Update priority for the moved task based on its new position
        const movedTask = sortedTasks[oldIndex];
        const targetTask = sortedTasks[newIndex];

        if (movedTask && targetTask) {
          // Assign the priority of the target position
          updateTask.mutate({
            id: movedTask.id,
            priority: targetTask.priority,
            sortOrder: newIndex,
          });
        }
      }
    },
    [sortedTasks, updateTask]
  );

  const handleToggleComplete = useCallback(
    (taskId: string) => {
      const task = sortedTasks.find((t) => t.id === taskId);
      if (task) {
        if (task.status === 'complete') {
          uncompleteTask.mutate(taskId);
        } else {
          completeTask.mutate(taskId);
        }
      }
    },
    [sortedTasks, completeTask, uncompleteTask]
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      // Remove priority instead of deleting the task
      updateTask.mutate({
        id: taskId,
        priority: 0,
      });
    },
    [updateTask]
  );

  const handleTaskClick = useCallback((task: Task) => {
    // TODO: Navigate to task detail or open task modal
    console.log('Task clicked:', task);
  }, []);

  // Loading state
  if (tasksLoading) {
    return (
      <div className="space-y-3" data-testid="priorities-loading">
        <p className="text-sm text-slate-400">
          View and manage your top priorities.
        </p>
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-700/30 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (sortedTasks.length === 0) {
    return (
      <div className="space-y-4" data-testid="priorities-empty">
        <p className="text-sm text-slate-400">
          View and manage your top priorities.
        </p>
        <div className="p-6 bg-slate-700/30 rounded-lg border border-slate-600/50 text-center">
          <MuiIcons.Flag style={{ fontSize: 32 }} className="text-slate-500 mb-2" />
          <p className="text-sm text-slate-500 font-medium">No priorities yet</p>
          <p className="text-xs text-slate-600 mt-1">
            Set priority on tasks to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="priorities-list">
      <p className="text-sm text-slate-400">
        Drag to reorder. Click checkbox to complete.
      </p>

      {/* Priority list with drag and drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2" data-testid="priorities-items">
            {visibleTasks.map((task) => (
              <SortablePriorityItem
                key={task.id}
                task={task}
                project={task.projectId ? projectsMap.get(task.projectId) : undefined}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
                onClick={handleTaskClick}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeTask ? (
            <DragOverlayItem
              task={activeTask}
              project={activeTask.projectId ? projectsMap.get(activeTask.projectId) : undefined}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Show more/less button */}
      {sortedTasks.length > DEFAULT_VISIBLE_COUNT && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="
            w-full py-2 text-sm text-slate-400 hover:text-teal-400
            flex items-center justify-center gap-1
            transition-colors duration-150
            border-t border-slate-700/50 mt-2 pt-3
          "
          data-testid="priorities-toggle"
        >
          {isExpanded ? (
            <>
              <MuiIcons.ExpandLess style={{ fontSize: 18 }} />
              Show less
            </>
          ) : (
            <>
              <MuiIcons.ExpandMore style={{ fontSize: 18 }} />
              Show more ({hiddenCount})
            </>
          )}
        </button>
      )}

      {/* Summary stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/50">
        <span>
          {pendingTasks.length} pending
          {completedTasks.length > 0 && ` / ${completedTasks.length} complete`}
        </span>
        <div className="flex gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-500"></span>
            {priorityTasks.filter((t) => t.priority === 1).length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-orange-500"></span>
            {priorityTasks.filter((t) => t.priority === 2).length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-yellow-500"></span>
            {priorityTasks.filter((t) => t.priority === 3).length}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PrioritiesList;
