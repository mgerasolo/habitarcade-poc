import { useMemo } from 'react';
import { useHabits, useTasks, useTimeBlocks, useUpdateHabitEntry, useCompleteTask, useUncompleteTask, useCreateTask, useCreateHabit } from '../../api';
import { useUIStore } from '../../stores';
import type { Habit, Task, TimeBlock, HabitStatus } from '../../types';
import { TodayHeader } from './TodayHeader';
import { HabitSection } from './HabitSection';
import { TaskSection } from './TaskSection';
import { TimeBlockSection } from './TimeBlockSection';
import { QuickEntry } from './QuickEntry';

/**
 * Today Page - Consolidated view of everything for today
 *
 * Features:
 * - Today's habits with completion status
 * - Tasks due/scheduled for today
 * - Time blocks for today's schedule
 * - High priority items
 * - Quick entry for new tasks/habits
 */
export function Today() {
  const { data: habitsData, isLoading: habitsLoading } = useHabits();
  const { data: tasksData, isLoading: tasksLoading } = useTasks();
  const { data: timeBlocksData, isLoading: timeBlocksLoading } = useTimeBlocks();

  const updateHabitEntry = useUpdateHabitEntry();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();
  const createTask = useCreateTask();
  const createHabit = useCreateHabit();
  const { openModal } = useUIStore();

  // Get today's date in YYYY-MM-DD format
  const today = useMemo(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }, []);

  // Filter habits that are not deleted
  const habits = useMemo(() => {
    if (!habitsData?.data) return [];
    return habitsData.data.filter((h: Habit) => !h.isDeleted);
  }, [habitsData]);

  // Filter tasks for today
  const todaysTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    return tasksData.data.filter((t: Task) =>
      !t.isDeleted && t.plannedDate === today
    );
  }, [tasksData, today]);

  // Get high priority tasks (priority 1 or 2)
  const highPriorityTasks = useMemo(() => {
    if (!tasksData?.data) return [];
    return tasksData.data.filter((t: Task) =>
      !t.isDeleted &&
      t.status === 'pending' &&
      t.priority !== undefined &&
      t.priority <= 2
    );
  }, [tasksData]);

  // Filter active time blocks
  const timeBlocks = useMemo(() => {
    if (!timeBlocksData?.data) return [];
    return timeBlocksData.data.filter((tb: TimeBlock) => !tb.isDeleted);
  }, [timeBlocksData]);

  // Get today's habit entries status
  const getHabitTodayStatus = (habit: Habit): HabitStatus => {
    const todayEntry = habit.entries?.find(e => e.date === today);
    return todayEntry?.status || 'empty';
  };

  // Handle habit status toggle
  const handleHabitToggle = (habit: Habit) => {
    const currentStatus = getHabitTodayStatus(habit);
    const newStatus: HabitStatus = currentStatus === 'complete' ? 'empty' : 'complete';

    updateHabitEntry.mutate({
      habitId: habit.id,
      date: today,
      status: newStatus,
    });
  };

  // Handle task completion toggle
  const handleTaskToggle = (task: Task) => {
    if (task.status === 'complete') {
      uncompleteTask.mutate(task.id);
    } else {
      completeTask.mutate(task.id);
    }
  };

  // Handle quick add task
  const handleQuickAddTask = (title: string) => {
    createTask.mutate({
      title,
      plannedDate: today,
      status: 'pending',
      sortOrder: 0,
    });
  };

  // Handle quick add habit
  const handleQuickAddHabit = (name: string) => {
    createHabit.mutate({
      name,
      sortOrder: habits.length,
    });
  };

  const isLoading = habitsLoading || tasksLoading || timeBlocksLoading;

  return (
    <div className="min-h-screen" data-testid="today-page">
      {/* Header */}
      <TodayHeader date={today} />

      {/* Main content grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Today's Habits Section */}
        <div className="space-y-4" data-testid="today-habits-section">
          <HabitSection
            habits={habits}
            getHabitTodayStatus={getHabitTodayStatus}
            onHabitToggle={handleHabitToggle}
            isLoading={isLoading}
            onAddHabit={() => openModal('habit-form')}
          />
        </div>

        {/* Today's Tasks Section */}
        <div className="space-y-4" data-testid="today-tasks-section">
          <TaskSection
            title="Today's Tasks"
            tasks={todaysTasks}
            onTaskToggle={handleTaskToggle}
            isLoading={isLoading}
            emptyMessage="No tasks scheduled for today"
            icon="Assignment"
          />

          {/* High Priority Tasks */}
          {highPriorityTasks.length > 0 && (
            <TaskSection
              title="High Priority"
              tasks={highPriorityTasks}
              onTaskToggle={handleTaskToggle}
              isLoading={isLoading}
              emptyMessage="No high priority tasks"
              icon="PriorityHigh"
              variant="priority"
            />
          )}
        </div>

        {/* Time Blocks Section */}
        <div className="space-y-4" data-testid="today-timeblocks-section">
          <TimeBlockSection
            timeBlocks={timeBlocks}
            isLoading={isLoading}
            onAddTimeBlock={() => openModal('time-block-form')}
          />
        </div>
      </div>

      {/* Quick Entry Footer */}
      <QuickEntry
        onAddTask={handleQuickAddTask}
        onAddHabit={handleQuickAddHabit}
        isCreating={createTask.isPending || createHabit.isPending}
      />
    </div>
  );
}

export default Today;
