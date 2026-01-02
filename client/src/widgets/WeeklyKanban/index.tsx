import { useState, useMemo, useCallback } from 'react';
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
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  isToday,
  isSameWeek,
} from 'date-fns';
import { useTasks, useUpdateTask, useMoveTaskToDate } from '../../api';
import { DayColumn } from './DayColumn';
import { TaskCard, type TaskViewMode } from './TaskCard';
import { TaskModal } from './TaskModal';
import type { Task } from '../../types';

export function WeeklyKanban() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>('detailed');

  // Memoize week calculations
  const weekEnd = useMemo(
    () => endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
    [currentWeekStart]
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: currentWeekStart, end: weekEnd }),
    [currentWeekStart, weekEnd]
  );

  // Fetch all tasks and filter client-side for the week
  const { data: tasksData, isLoading } = useTasks();
  const allTasks = useMemo(() => tasksData?.data ?? [], [tasksData?.data]);
  const moveTask = useMoveTaskToDate();
  const updateTask = useUpdateTask();

  // Configure drag sensors with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group tasks by date for the current week
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    // Initialize each day with empty array
    for (const day of days) {
      grouped.set(format(day, 'yyyy-MM-dd'), []);
    }

    // Group tasks by their planned date
    for (const task of allTasks) {
      if (task.plannedDate && !task.isDeleted) {
        const taskDate = new Date(task.plannedDate);
        if (isSameWeek(taskDate, currentWeekStart, { weekStartsOn: 0 })) {
          const existing = grouped.get(task.plannedDate) || [];
          grouped.set(task.plannedDate, [...existing, task]);
        }
      }
    }

    // Sort tasks by sortOrder within each day
    for (const [dateStr, dayTasks] of grouped) {
      grouped.set(
        dateStr,
        [...dayTasks].sort((a, b) => a.sortOrder - b.sortOrder)
      );
    }

    return grouped;
  }, [allTasks, days, currentWeekStart]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = allTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  }, [allTasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a day column (format: yyyy-MM-dd)
    const isDateColumn = /^\d{4}-\d{2}-\d{2}$/.test(overId);

    if (isDateColumn) {
      const task = allTasks.find((t) => t.id === taskId);
      if (task && task.plannedDate !== overId) {
        moveTask.mutate({
          taskId,
          date: overId,
        });
      }
    }
  }, [allTasks, moveTask]);

  const handleToggleComplete = useCallback((task: Task) => {
    updateTask.mutate({
      id: task.id,
      status: task.status === 'complete' ? 'pending' : 'complete',
      completedAt: task.status === 'complete' ? undefined : new Date().toISOString(),
    });
  }, [updateTask]);

  const goToToday = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  }, []);

  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 0 });

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-lg p-4 h-full flex flex-col">
      {/* Compact title bar with week navigation */}
      <div className="flex items-center gap-3 mb-2 flex-shrink-0">
        {/* Title with week range */}
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white font-condensed">Weekly Tasks</h2>
          <span className="text-slate-500">·</span>
          <span className="text-xs text-slate-400 font-condensed">
            {format(currentWeekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </span>
        </div>

        {/* Extending line */}
        <div className="flex-1 h-px bg-slate-700/50" />

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 bg-slate-700/50 rounded-md p-0.5">
          <button
            onClick={() => setTaskViewMode('compact')}
            className={`
              p-1 rounded transition-all duration-150
              ${taskViewMode === 'compact'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
              }
            `}
            title="Compact list view"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setTaskViewMode('detailed')}
            className={`
              p-1 rounded transition-all duration-150
              ${taskViewMode === 'detailed'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
              }
            `}
            title="Detailed card view"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>

        {/* Week navigation controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            title="Previous week"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {!isCurrentWeek && (
            <button
              onClick={goToToday}
              className="px-2 py-0.5 text-[10px] font-medium bg-teal-600/80 hover:bg-teal-500 text-white rounded transition-colors"
              title="Go to current week"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            title="Next week"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day columns */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-400">Loading tasks...</div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-7 gap-2 flex-1 min-h-0">
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              return (
                <DayColumn
                  key={dateStr}
                  date={day}
                  tasks={tasksByDate.get(dateStr) || []}
                  isToday={isToday(day)}
                  onEditTask={setEditingTask}
                  onToggleComplete={handleToggleComplete}
                  viewMode={taskViewMode}
                />
              );
            })}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onToggleComplete={() => {}}
                isDragging
                viewMode={taskViewMode}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task edit modal */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}

export default WeeklyKanban;
