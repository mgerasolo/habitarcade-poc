import { memo, useMemo, useState, useCallback } from 'react';
import type { DateColumn, MatrixHabit } from './useHabitMatrix';
import { getHabitStatus } from './useHabitMatrix';
import { StatusCell } from './StatusCell';
import { HabitDetailModal } from './HabitDetailModal';

interface HabitRowProps {
  habit: MatrixHabit;
  dates: DateColumn[];
  habitNameWidth?: number;
  cellSize?: number;
  index?: number;
  /** Callback when habit name is clicked (opens detail modal) */
  onHabitClick?: (habit: MatrixHabit) => void;
}

/**
 * Calculate streak info at a specific date
 */
function calculateStreakAtDate(habit: MatrixHabit, dates: DateColumn[], targetIndex: number): number {
  let streak = 0;

  // Count backwards from target date
  for (let i = targetIndex; i >= 0; i--) {
    const status = getHabitStatus(habit, dates[i].date);
    if (status === 'complete' || status === 'extra') {
      streak++;
    } else if (status !== 'empty' && status !== 'na' && status !== 'exempt') {
      break;
    }
  }

  return streak;
}

/**
 * Check if habit is falling behind target (trending warning)
 * Returns true if recent completion rate is below 50%
 */
function checkTrending(habit: MatrixHabit, dates: DateColumn[]): boolean {
  // Look at last 7 days
  const recentDays = dates.slice(-7);
  let completed = 0;
  let eligible = 0;

  recentDays.forEach(dateCol => {
    const status = getHabitStatus(habit, dateCol.date);
    if (status !== 'empty' && status !== 'na' && status !== 'exempt') {
      eligible++;
      if (status === 'complete' || status === 'extra') {
        completed++;
      }
    }
  });

  // Trending if less than 50% completion in eligible days
  return eligible >= 3 && (completed / eligible) < 0.5;
}

/**
 * Individual habit row in the matrix
 * Displays habit name/icon and status cells for each date
 * Click on habit name opens detail modal (Issue #5)
 */
export const HabitRow = memo(function HabitRow({
  habit,
  dates,
  habitNameWidth = 120,
  cellSize,
  index = 0,
  onHabitClick,
}: HabitRowProps) {
  // State for detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate streak info for visual indicator
  const streakInfo = useMemo(() => {
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Iterate from most recent to oldest
    for (let i = dates.length - 1; i >= 0; i--) {
      const status = getHabitStatus(habit, dates[i].date);
      if (status === 'complete' || status === 'extra') {
        if (i === dates.length - 1 || tempStreak > 0) {
          tempStreak++;
          currentStreak = tempStreak;
        }
        maxStreak = Math.max(maxStreak, tempStreak);
      } else if (status !== 'empty' && status !== 'na' && status !== 'exempt') {
        // Streak broken
        tempStreak = 0;
        if (currentStreak === 0) currentStreak = 0; // Reset current if not established
      }
      // empty, na, exempt don't break streak
    }

    return { currentStreak, maxStreak };
  }, [habit, dates]);

  // Check if habit is trending (falling behind)
  const isTrending = useMemo(() => checkTrending(habit, dates), [habit, dates]);

  // Handle habit name click
  const handleNameClick = useCallback(() => {
    if (onHabitClick) {
      onHabitClick(habit);
    } else {
      setShowDetailModal(true);
    }
  }, [habit, onHabitClick]);

  // Close detail modal
  const handleCloseModal = useCallback(() => {
    setShowDetailModal(false);
  }, []);

  return (
    <>
      <div
        className={`
          flex items-center gap-0.5 py-0.5 group
          hover:bg-slate-700/20 rounded
          transition-colors duration-150
          ${index % 2 === 1 ? 'bg-slate-800/30' : 'bg-transparent'}
        `}
        data-habit-id={habit.id}
      >
        {/* Habit name and icon - clickable to open modal */}
        <div
          style={{ width: habitNameWidth }}
          className="flex-shrink-0 flex items-center gap-1.5 pr-2 min-w-0 cursor-pointer"
          onClick={handleNameClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNameClick();
            }
          }}
        >
          {/* Icon */}
          {habit.icon && (
            <span
              className="flex-shrink-0 text-sm opacity-80 group-hover:opacity-100 transition-opacity"
              style={{ color: habit.iconColor || '#94a3b8' }}
            >
              <i className={habit.icon} />
            </span>
          )}

          {/* Habit name - consistent color for all habits */}
          <span
            className="
              font-condensed text-xs truncate text-slate-200
              group-hover:text-slate-100 group-hover:underline
              transition-colors duration-150
            "
            title={`${habit.name} - Click for details`}
          >
            {habit.name}
          </span>

          {/* Streak indicator */}
          {streakInfo.currentStreak >= 3 && (
            <span
              className="
                flex-shrink-0 text-[9px] font-bold px-1 py-0.5 rounded
                bg-gradient-to-r from-amber-500/20 to-orange-500/20
                text-amber-400 border border-amber-500/30
              "
              title={`${streakInfo.currentStreak} day streak!`}
            >
              {streakInfo.currentStreak}
            </span>
          )}

          {/* Trending warning badge */}
          {isTrending && (
            <span
              className="
                flex-shrink-0 text-[8px] font-bold px-1 py-0.5 rounded
                bg-orange-500/20 text-orange-400 border border-orange-500/30
                animate-pulse
              "
              title="Falling behind target"
            >
              !
            </span>
          )}
        </div>

        {/* Status cells for each date */}
        <div className="flex gap-0.5">
          {dates.map((dateCol, dateIndex) => {
            const status = getHabitStatus(habit, dateCol.date);
            const entry = habit.entriesByDate.get(dateCol.date);
            const streakAtDate = calculateStreakAtDate(habit, dates, dateIndex);
            const dayOfMonth = dateCol.date.split('-')[2].replace(/^0/, '');

            return (
              <StatusCell
                key={dateCol.date}
                habitId={habit.id}
                habitName={habit.name}
                date={dateCol.date}
                dayOfMonth={dayOfMonth}
                dateIndex={dateIndex}
                status={status}
                isToday={dateCol.isToday}
                isWeekend={dateCol.isWeekend}
                size={cellSize}
                notes={entry?.notes}
                streakCount={streakAtDate}
                isTrending={isTrending && dateCol.isToday}
              />
            );
          })}
        </div>
      </div>

      {/* Habit detail modal */}
      {showDetailModal && (
        <HabitDetailModal
          habit={habit}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});

/**
 * Compact habit row for mobile view
 * Shows condensed habit info and larger touch targets
 */
export const HabitRowCompact = memo(function HabitRowCompact({
  habit,
  dates,
  habitNameWidth = 80,
  cellSize,
  index = 0,
  onHabitClick,
}: HabitRowProps) {
  // State for detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Check if habit is trending (falling behind)
  const isTrending = useMemo(() => checkTrending(habit, dates), [habit, dates]);

  // Handle habit name click
  const handleNameClick = useCallback(() => {
    if (onHabitClick) {
      onHabitClick(habit);
    } else {
      setShowDetailModal(true);
    }
  }, [habit, onHabitClick]);

  // Close detail modal
  const handleCloseModal = useCallback(() => {
    setShowDetailModal(false);
  }, []);

  return (
    <>
      <div className={`flex items-center gap-1 py-1 ${index % 2 === 1 ? 'bg-slate-800/30' : 'bg-transparent'}`}>
        {/* Habit name - clickable */}
        <div
          style={{ width: habitNameWidth }}
          className="flex-shrink-0 flex items-center gap-1 pr-1 min-w-0 cursor-pointer"
          onClick={handleNameClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNameClick();
            }
          }}
        >
          {habit.icon && (
            <span className="text-sm" style={{ color: habit.iconColor || '#94a3b8' }}>
              <i className={habit.icon} />
            </span>
          )}
          <span
            className="font-condensed text-xs text-slate-200 truncate hover:underline"
            title={`${habit.name} - Tap for details`}
          >
            {habit.name}
          </span>
        </div>

        {/* Status cells - larger for touch */}
        <div className="flex gap-1">
          {dates.map((dateCol, dateIndex) => {
            const status = getHabitStatus(habit, dateCol.date);
            const entry = habit.entriesByDate.get(dateCol.date);
            const streakAtDate = calculateStreakAtDate(habit, dates, dateIndex);
            const dayOfMonth = dateCol.date.split('-')[2].replace(/^0/, '');

            return (
              <StatusCell
                key={dateCol.date}
                habitId={habit.id}
                habitName={habit.name}
                date={dateCol.date}
                dayOfMonth={dayOfMonth}
                dateIndex={dateIndex}
                status={status}
                isToday={dateCol.isToday}
                isWeekend={dateCol.isWeekend}
                size={cellSize || 20}
                notes={entry?.notes}
                streakCount={streakAtDate}
                isTrending={isTrending && dateCol.isToday}
              />
            );
          })}
        </div>
      </div>

      {/* Habit detail modal */}
      {showDetailModal && (
        <HabitDetailModal
          habit={habit}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
});

/**
 * Skeleton loading row
 */
export function HabitRowSkeleton({ daysCount = 31 }: { daysCount?: number }) {
  return (
    <div className="flex items-center gap-0.5 py-0.5 animate-pulse">
      {/* Name skeleton */}
      <div className="w-[120px] flex-shrink-0 pr-2">
        <div className="h-3 bg-slate-700/50 rounded w-3/4" />
      </div>
      {/* Cell skeletons */}
      <div className="flex gap-0.5">
        {Array.from({ length: daysCount }).map((_, i) => (
          <div key={i} className="w-4 h-4 bg-slate-700/30 rounded-sm" />
        ))}
      </div>
    </div>
  );
}

export default HabitRow;
