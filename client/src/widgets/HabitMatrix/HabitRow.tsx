import { memo, useMemo } from 'react';
import type { DateColumn, MatrixHabit } from './useHabitMatrix';
import { getHabitStatus } from './useHabitMatrix';
import { StatusCell } from './StatusCell';

interface HabitRowProps {
  habit: MatrixHabit;
  dates: DateColumn[];
  habitNameWidth?: number;
  cellSize?: number;
  index?: number;
}

/**
 * Individual habit row in the matrix
 * Displays habit name/icon and status cells for each date
 */
export const HabitRow = memo(function HabitRow({
  habit,
  dates,
  habitNameWidth = 120,
  cellSize,
  index = 0,
}: HabitRowProps) {
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

  return (
    <div className={`flex items-center gap-0.5 py-0.5 group hover:bg-slate-700/20 rounded transition-colors duration-150 ${index % 2 === 1 ? 'bg-slate-800/30' : 'bg-transparent'}`}>
      {/* Habit name and icon */}
      <div
        style={{ width: habitNameWidth }}
        className="flex-shrink-0 flex items-center gap-1.5 pr-2 min-w-0"
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
          className="font-condensed text-xs truncate text-slate-200 group-hover:text-slate-100 transition-colors duration-150"
          title={habit.name}
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
      </div>

      {/* Status cells for each date */}
      <div className="flex gap-0.5">
        {dates.map((dateCol) => {
          const status = getHabitStatus(habit, dateCol.date);
          return (
            <StatusCell
              key={dateCol.date}
              habitId={habit.id}
              date={dateCol.date}
              status={status}
              isToday={dateCol.isToday}
              isWeekend={dateCol.isWeekend}
              size={cellSize}
            />
          );
        })}
      </div>
    </div>
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
}: HabitRowProps) {
  return (
    <div className={`flex items-center gap-1 py-1 ${index % 2 === 1 ? 'bg-slate-800/30' : 'bg-transparent'}`}>
      {/* Habit name */}
      <div
        style={{ width: habitNameWidth }}
        className="flex-shrink-0 flex items-center gap-1 pr-1 min-w-0"
      >
        {habit.icon && (
          <span className="text-sm" style={{ color: habit.iconColor || '#94a3b8' }}>
            <i className={habit.icon} />
          </span>
        )}
        <span className="font-condensed text-xs text-slate-200 truncate" title={habit.name}>
          {habit.name}
        </span>
      </div>

      {/* Status cells - larger for touch */}
      <div className="flex gap-1">
        {dates.map((dateCol) => {
          const status = getHabitStatus(habit, dateCol.date);
          return (
            <StatusCell
              key={dateCol.date}
              habitId={habit.id}
              date={dateCol.date}
              status={status}
              isToday={dateCol.isToday}
              isWeekend={dateCol.isWeekend}
              size={cellSize || 20}
            />
          );
        })}
      </div>
    </div>
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
