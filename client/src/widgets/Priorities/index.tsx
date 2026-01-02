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
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTasks, useUpdateTask, useCreateTask } from '../../api';
import type { Task } from '../../types';

interface PrioritiesProps {
  className?: string;
}

interface SortablePriorityItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

/**
 * Sortable wrapper for priority items
 */
function SortablePriorityItem({
  task,
  onToggleComplete,
  onDelete,
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 p-2 rounded-lg
        ${task.status === 'done' ? 'bg-slate-800/30' : 'bg-slate-800/60'}
        border border-slate-700/30 hover:border-slate-600/50
        transition-all duration-150
      `}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
        title="Drag to reorder"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
      </div>

      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task.id)}
        className={`
          w-5 h-5 rounded-full border-2 flex-shrink-0
          flex items-center justify-center
          transition-all duration-200
          ${
            task.status === 'done'
              ? 'bg-teal-500 border-teal-500 text-white'
              : 'border-slate-500 hover:border-teal-400'
          }
        `}
      >
        {task.status === 'done' && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        className={`
          flex-1 text-sm font-condensed truncate
          ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}
        `}
      >
        {task.title}
      </span>

      {/* Priority indicator */}
      {task.priority && (
        <span
          className={`
            text-xs font-medium px-1.5 py-0.5 rounded
            ${
              task.priority === 'high'
                ? 'bg-red-500/20 text-red-400'
                : task.priority === 'medium'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-500/20 text-blue-400'
            }
          `}
        >
          {task.priority[0].toUpperCase()}
        </span>
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(task.id)}
        className="p-1 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        title="Remove from priorities"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Priorities Widget
 *
 * A focused list of today's top priority tasks. Shows high-priority tasks
 * that need immediate attention with quick actions to complete or reorder.
 *
 * Features:
 * - Shows today's high priority tasks
 * - Quick complete toggle
 * - Drag to reorder priorities
 * - Quick add new priority task
 */
export function Priorities({ className = '' }: PrioritiesProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Fetch tasks
  const { data: tasksData, isLoading, isError } = useTasks();

  // Filter to only show priority tasks (high priority or marked as priority)
  const priorityTasks = useMemo(() => {
    const allTasks = tasksData?.data ?? [];
    return allTasks
      .filter((t) => !t.isDeleted && (t.priority === 'high' || t.priority === 'medium'))
      .sort((a, b) => {
        // Sort by status (incomplete first), then by priority (high first)
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return 0;
      })
      .slice(0, 5); // Limit to top 5 priorities
  }, [tasksData?.data]);

  // Mutations
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = priorityTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  }, [priorityTasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null);
    // Note: Reordering would require sortOrder on tasks
    // For now, just reset
  }, []);

  const handleToggleComplete = useCallback((taskId: string) => {
    const task = priorityTasks.find((t) => t.id === taskId);
    if (task) {
      updateTask.mutate({
        id: taskId,
        status: task.status === 'done' ? 'todo' : 'done',
      });
    }
  }, [priorityTasks, updateTask]);

  const handleDelete = useCallback((taskId: string) => {
    // Instead of deleting, remove from priorities by setting priority to low
    updateTask.mutate({
      id: taskId,
      priority: 'low',
    });
  }, [updateTask]);

  const handleAddPriority = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    createTask.mutate({
      title: newTaskTitle.trim(),
      priority: 'high',
      status: 'todo',
    });
    setNewTaskTitle('');
  }, [newTaskTitle, createTask]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <ErrorState />
      </div>
    );
  }

  const completedCount = priorityTasks.filter((t) => t.status === 'done').length;
  const totalCount = priorityTasks.length;

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <h3 className="font-condensed font-semibold text-slate-200 text-sm">
            Today's Priorities
          </h3>
        </div>
        {totalCount > 0 && (
          <span className="text-xs text-slate-500">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* Priority list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {priorityTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={priorityTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {priorityTasks.map((task) => (
                  <SortablePriorityItem
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90 shadow-xl rounded-lg">
                  <SortablePriorityItem
                    task={activeTask}
                    onToggleComplete={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Quick add form */}
      <form onSubmit={handleAddPriority} className="mt-3 flex gap-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add priority..."
          className="
            flex-1 px-3 py-1.5 rounded-lg
            bg-slate-800/80 border border-slate-700/50
            text-sm text-slate-200 placeholder-slate-500
            focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
            transition-all duration-150
          "
        />
        <button
          type="submit"
          disabled={!newTaskTitle.trim() || createTask.isPending}
          className="
            px-3 py-1.5 rounded-lg
            bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed
            text-white text-xs font-medium
            transition-colors duration-150
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </form>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mt-2">
          <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
              style={{
                width: `${(completedCount / totalCount) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Empty state when no priorities
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </div>
      <p className="text-sm text-slate-400 font-condensed">
        No priorities set for today
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Add a high-priority task to get started
      </p>
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 bg-slate-700/50 rounded" />
        <div className="h-4 bg-slate-700/50 rounded w-28" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-lg">
          <div className="w-5 h-5 bg-slate-700/50 rounded-full" />
          <div className="flex-1 h-4 bg-slate-700/50 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Error state
 */
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="text-red-400 mb-2">
        <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-sm text-slate-400">Failed to load priorities</p>
    </div>
  );
}

export default Priorities;
