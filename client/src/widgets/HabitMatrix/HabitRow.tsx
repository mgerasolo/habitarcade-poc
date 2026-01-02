import { memo, useMemo, useCallback } from 'react';
import type { DateColumn, MatrixHabit } from './useHabitMatrix';
import { getHabitStatus, getEffectiveHabitStatus, getBestChildStatus } from './useHabitMatrix';
import { StatusCell } from './StatusCell';
import { useUIStore } from '../../stores';
import { useSettings } from '../../api';
import type { HabitStatus } from '../../types';

/**
 * Get color class based on completion percentage
 * Green >=80%, Yellow >=50%, Red <50%
 */
function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-400';
  if (percentage >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Calculate completion percentage for a single habit across given dates
 * Formula: (complete + extra + partial*0.5) / (countedCells - na - exempt) * 100
 *
 * Scoring rules:
 * - Only count "completed days" (past days that have elapsed)
 * - Today is only included if user has filled in a value (not 'empty')
 * - Future days are completely excluded
 * - N/A and Exempt are excluded from the denominator
 */
function calculateHabitCompletion(habit: MatrixHabit, dates: DateColumn[]): number {
  let completed = 0;
  let partial = 0;
  let exempt = 0;
  let na = 0;
  let countedCells = 0;

  // Find "today" column to determine which days are past/future
  const todayIndex = dates.findIndex(d => d.isToday);

  for (let i = 0; i < dates.length; i++) {
    const dateCol = dates[i];
    const status = getHabitStatus(habit, dateCol.date);
    const hasEntry = status !== 'empty';

    // Skip future days entirely (days after today)
    if (todayIndex >= 0 && i > todayIndex) {
      continue;
    }

    // Only count this cell if:
    // 1. It's a past day (not today), OR
    // 2. It's today AND user has filled in a value (not empty)
    const shouldCount = !dateCol.isToday || hasEntry;

    if (!shouldCount) {
      continue;
    }

    countedCells++;

    switch (status) {
      case 'complete':
      case 'extra':
        completed++;
        break;
      case 'partial':
        partial++;
        break;
      case 'exempt':
        exempt++;
        break;
      case 'na':
        na++;
        break;
      // 'empty', 'missed', 'pink' count as incomplete (not excluded)
    }
  }

  const excluded = exempt + na;
  const effectiveTotal = countedCells - excluded;

  if (effectiveTotal <= 0) return 0;

  return Math.round(((completed + partial * 0.5) / effectiveTotal) * 100);
}

interface HabitRowProps {
  habit: MatrixHabit;
  dates: DateColumn[];
  habitNameWidth?: number;
  cellSize?: number;
  index?: number;
  /** Compact vertical mode - tighter row spacing */
  compactVertical?: boolean;
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
  compactVertical = false,
}: HabitRowProps) {
  const { openModal } = useUIStore();
  const { data: settingsResponse } = useSettings();
  const autoMarkPink = settingsResponse?.data?.autoMarkPink ?? false;

  // Handler to open habit detail modal
  const handleHabitClick = useCallback(() => {
    openModal('habit-detail', habit);
  }, [openModal, habit]);

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

  // Calculate completion percentage for this habit
  const completionPercent = useMemo(
    () => calculateHabitCompletion(habit, dates),
    [habit, dates]
  );

  return (
    <div className={`flex items-center gap-0.5 group hover:bg-slate-700/20 rounded transition-colors duration-150 ${compactVertical ? 'py-px' : 'py-0.5'} ${index % 2 === 1 ? 'bg-slate-800/30' : 'bg-transparent'}`}>
      {/* Habit name and icon */}
      <div
        style={{ width: habitNameWidth }}
        className={`flex-shrink-0 flex items-center min-w-0 ${compactVertical ? 'gap-1 pr-1' : 'gap-1.5 pr-2'}`}
      >
        {/* Icon - hidden in compactVertical to save space */}
        {habit.icon && !compactVertical && (
          <span
            className="flex-shrink-0 text-sm opacity-80 group-hover:opacity-100 transition-opacity"
            style={{ color: habit.iconColor || '#94a3b8' }}
          >
            <i className={habit.icon} />
          </span>
        )}

        {/* Habit name - clickable to open detail modal */}
        <button
          onClick={handleHabitClick}
          className={`font-condensed truncate text-slate-200 group-hover:text-teal-400 transition-colors duration-150 hover:underline cursor-pointer text-left ${compactVertical ? 'text-[11px]' : 'text-xs'}`}
          title={`${habit.name} - Click for details`}
        >
          {habit.name}
        </button>

        {/* Streak indicator - hidden in compactVertical */}
        {!compactVertical && streakInfo.currentStreak >= 3 && (
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

      {/* Status cells for each date - flex-1 to fill available width (#47) */}
      <div className="flex gap-0.5 flex-1">
        {dates.map((dateCol, index) => {
          // Determine if this is a parent habit (has children)
          const isParentHabit = !!(habit.children && habit.children.length > 0);

          // For parent habits, use computed status from children
          // For regular habits, use getEffectiveHabitStatus
          let status: HabitStatus;
          if (isParentHabit && habit.computedStatusByDate) {
            status = habit.computedStatusByDate.get(dateCol.date) || 'empty';
          } else {
            status = getEffectiveHabitStatus(habit, dateCol.date, dateCol.isToday, autoMarkPink);
          }

          // Extract day of month from date string (YYYY-MM-DD format)
          const dayOfMonth = dateCol.date.split('-')[2].replace(/^0/, '');
          // Get count for count-based habits
          const entry = habit.entriesByDate.get(dateCol.date);
          const currentCount = entry?.count ?? 0;
          // Get sibling completed status for child habits
          const siblingCompleted = habit.siblingCompletedByDate?.get(dateCol.date) ?? false;

          return (
            <StatusCell
              key={dateCol.date}
              habitId={habit.id}
              date={dateCol.date}
              dayOfMonth={dayOfMonth}
              dateIndex={index}
              status={status}
              isToday={dateCol.isToday}
              isWeekend={dateCol.isWeekend}
              size={cellSize}
              dailyTarget={habit.dailyTarget}
              currentCount={currentCount}
              isParentHabit={isParentHabit}
              siblingCompleted={siblingCompleted}
            />
          );
        })}
      </div>

      {/* Completion percentage - hidden in compactVertical to save space */}
      {!compactVertical && (
        <div
          className={`
            flex-shrink-0 w-10 text-right text-xs font-condensed font-medium
            ${getScoreColor(completionPercent)}
          `}
          title={`${completionPercent}% completion this period`}
        >
          {completionPercent}%
        </div>
      )}
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
  const { openModal } = useUIStore();
  const { data: settingsResponse } = useSettings();
  const autoMarkPink = settingsResponse?.data?.autoMarkPink ?? false;

  // Handler to open habit detail modal
  const handleHabitClick = useCallback(() => {
    openModal('habit-detail', habit);
  }, [openModal, habit]);

  // Calculate completion percentage for this habit
  const completionPercent = useMemo(
    () => calculateHabitCompletion(habit, dates),
    [habit, dates]
  );

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
        <button
          onClick={handleHabitClick}
          className="font-condensed text-xs text-slate-200 truncate hover:text-teal-400 hover:underline cursor-pointer text-left"
          title={`${habit.name} - Click for details`}
        >
          {habit.name}
        </button>
      </div>

      {/* Status cells - larger for touch, flex-1 to fill width (#47) */}
      <div className="flex gap-1 flex-1">
        {dates.map((dateCol, index) => {
          // Determine if this is a parent habit (has children)
          const isParentHabit = !!(habit.children && habit.children.length > 0);

          // For parent habits, use computed status from children
          // For regular habits, use getEffectiveHabitStatus
          let status: HabitStatus;
          if (isParentHabit && habit.computedStatusByDate) {
            status = habit.computedStatusByDate.get(dateCol.date) || 'empty';
          } else {
            status = getEffectiveHabitStatus(habit, dateCol.date, dateCol.isToday, autoMarkPink);
          }

          const dayOfMonth = dateCol.date.split('-')[2].replace(/^0/, '');
          // Get count for count-based habits
          const entry = habit.entriesByDate.get(dateCol.date);
          const currentCount = entry?.count ?? 0;
          // Get sibling completed status for child habits
          const siblingCompleted = habit.siblingCompletedByDate?.get(dateCol.date) ?? false;

          return (
            <StatusCell
              key={dateCol.date}
              habitId={habit.id}
              date={dateCol.date}
              dayOfMonth={dayOfMonth}
              dateIndex={index}
              status={status}
              isToday={dateCol.isToday}
              isWeekend={dateCol.isWeekend}
              size={cellSize || 20}
              dailyTarget={habit.dailyTarget}
              currentCount={currentCount}
              isParentHabit={isParentHabit}
              siblingCompleted={siblingCompleted}
            />
          );
        })}
      </div>

      {/* Completion percentage */}
      <div
        className={`
          flex-shrink-0 w-10 text-right text-xs font-condensed font-medium
          ${getScoreColor(completionPercent)}
        `}
        title={`${completionPercent}% completion this period`}
      >
        {completionPercent}%
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
