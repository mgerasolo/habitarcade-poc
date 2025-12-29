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
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import type { Task } from '../../types';

export function WeeklyKanban() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
      {/* Header with week navigation */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
            title="Previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white"
            title="Next week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <h2 className="text-lg font-semibold text-white font-condensed">
          {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h2>

        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
            >
              Today
            </button>
          )}
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
