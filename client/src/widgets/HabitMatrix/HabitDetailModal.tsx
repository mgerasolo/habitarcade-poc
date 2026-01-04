import { useEffect, useMemo } from 'react';
import { format, startOfMonth, eachDayOfInterval, subDays, parseISO, isAfter, isBefore } from 'date-fns';
import { useUIStore } from '../../stores';
import type { Habit, HabitEntry, HabitStatus } from '../../types';
import * as MuiIcons from '@mui/icons-material';
import { ContributionGraph } from './ContributionGraph';

/**
 * Calculate current and best streak for a habit
 * Now iterates through CONSECUTIVE DAYS (not just entries) to properly detect gaps
 *
 * @param entries - The habit entries
 * @param createdAt - The habit creation date (optional, to limit streak range)
 */
function calculateStreaks(
  entries: HabitEntry[],
  createdAt?: string
): { current: number; best: number } {
  if (!entries || entries.length === 0) return { current: 0, best: 0 };

  // Create a map for quick lookup
  const entryMap = new Map<string, HabitStatus>();
  entries.forEach(entry => {
    entryMap.set(entry.date, entry.status);
  });

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Determine the start date for streak calculation
  // Use creation date if available, otherwise use earliest entry
  let startDate: Date;
  if (createdAt) {
    startDate = parseISO(createdAt);
  } else {
    const sortedDates = [...entries]
      .map(e => parseISO(e.date))
      .sort((a, b) => a.getTime() - b.getTime());
    startDate = sortedDates[0] || today;
  }

  // Don't look at dates before the habit was created or after today
  if (isAfter(startDate, today)) {
    return { current: 0, best: 0 };
  }

  // Generate all days from start to today
  const allDays = eachDayOfInterval({ start: startDate, end: today });

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Calculate best streak by iterating through CONSECUTIVE DAYS
  for (const day of allDays) {
    const dateStr = format(day, 'yyyy-MM-dd');
    const status = entryMap.get(dateStr);

    if (status === 'complete' || status === 'extra') {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else if (status === 'na' || status === 'exempt') {
      // Don't break streak for na/exempt
    } else {
      // No entry, empty, missed, partial, pink - streak broken
      tempStreak = 0;
    }
  }

  // Calculate current streak by going backwards from today
  let currentDate = todayStr;
  while (true) {
    const status = entryMap.get(currentDate);
    const currentDateObj = parseISO(currentDate);

    // Stop if we've gone before the habit creation date
    if (createdAt && isBefore(currentDateObj, parseISO(createdAt))) {
      break;
    }

    if (status === 'complete' || status === 'extra') {
      currentStreak++;
    } else if (status === 'na' || status === 'exempt') {
      // Don't break streak for na/exempt
    } else if (currentDate === todayStr && (!status || status === 'empty')) {
      // Allow empty today (user might not have logged yet)
    } else {
      // No entry or negative status - streak broken
      break;
    }

    // Move to previous day
    const prevDate = subDays(currentDateObj, 1);
    currentDate = format(prevDate, 'yyyy-MM-dd');

    // Safety limit
    if (currentStreak > 1000) break;
  }

  return { current: currentStreak, best: bestStreak };
}

/**
 * Calculate completion percentage for a date range
 *
 * Scoring rules:
 * - Only count "completed days" (past days, not including today unless filled)
 * - Today is only included if user has filled in a value (not 'empty')
 * - N/A and Exempt are excluded from the denominator
 */
function calculateCompletionForRange(
  entries: HabitEntry[],
  startDate: Date,
  endDate: Date
): number {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const rangeDates = eachDayOfInterval({ start: startDate, end: endDate });

  const entryMap = new Map<string, HabitStatus>();
  (entries || []).forEach(entry => {
    entryMap.set(entry.date, entry.status);
  });

  let completed = 0;
  let partial = 0;
  let exempt = 0;
  let na = 0;
  let countedCells = 0;

  for (const date of rangeDates) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const status = entryMap.get(dateStr) || 'empty';
    const isToday = dateStr === todayStr;
    const hasEntry = status !== 'empty';

    // Only count this cell if:
    // 1. It's a past day (not today), OR
    // 2. It's today AND user has filled in a value (not empty)
    const shouldCount = !isToday || hasEntry;

    if (!shouldCount) continue;

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
    }
  }

  const excluded = exempt + na;
  const effectiveTotal = countedCells - excluded;

  if (effectiveTotal <= 0) return 0;

  return Math.round(((completed + partial * 0.5) / effectiveTotal) * 100);
}

/**
 * Calculate all completion stats
 * Only counts days from the habit's creation date onwards
 */
function calculateCompletionStats(entries: HabitEntry[], createdAt?: string): {
  thisMonth: number;
  thisYear: number;
  allTime: number;
} {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  // For all-time, use creation date (do NOT expand to include entries before creation)
  // If no creation date, fall back to year start
  const allTimeStart = createdAt ? new Date(createdAt) : yearStart;

  return {
    thisMonth: calculateCompletionForRange(entries, monthStart, today),
    thisYear: calculateCompletionForRange(entries, yearStart, today),
    allTime: calculateCompletionForRange(entries, allTimeStart, today),
  };
}

/**
 * Get color class based on completion percentage
 */
function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-400';
  if (percentage >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * HabitDetailModal - Shows detailed stats for a habit
 */
export function HabitDetailModal() {
  const { closeModal, modalData, openModal, setSelectedHabit } = useUIStore();
  const habit = modalData as Habit | undefined;

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!habit) return null;

    const streaks = calculateStreaks(habit.entries || [], habit.createdAt);
    const completion = calculateCompletionStats(habit.entries || [], habit.createdAt);
    const createdAt = habit.createdAt ? new Date(habit.createdAt) : null;

    return {
      currentStreak: streaks.current,
      bestStreak: streaks.best,
      thisMonth: completion.thisMonth,
      thisYear: completion.thisYear,
      allTime: completion.allTime,
      createdAt,
    };
  }, [habit]);

  if (!habit) return null;

  const handleEdit = () => {
    closeModal();
    setSelectedHabit(habit);
    openModal('habit-form');
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Habit Icon */}
              <div
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center"
                style={{
                  background: habit.iconColor
                    ? `linear-gradient(135deg, ${habit.iconColor}, ${habit.iconColor}dd)`
                    : undefined,
                }}
              >
                {habit.icon ? (
                  <i className={habit.icon} style={{ fontSize: 24, color: 'white' }} />
                ) : (
                  <MuiIcons.CheckCircleOutline style={{ color: 'white', fontSize: 24 }} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{habit.name}</h2>
                {habit.category && (
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    {habit.category.icon && (
                      <i className={habit.category.icon} style={{ color: habit.category.iconColor || '#94a3b8', fontSize: 12 }} />
                    )}
                    {habit.category.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
            >
              <MuiIcons.Close style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>

        {/* Stats Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Creation Date */}
          <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <MuiIcons.CalendarMonth style={{ color: '#94a3b8', fontSize: 18 }} />
              </div>
              <span className="text-slate-400 text-sm">Created</span>
            </div>
            <span className="text-white font-medium text-sm">
              {stats?.createdAt
                ? format(stats.createdAt, 'MMM d, yyyy')
                : 'Unknown'}
            </span>
          </div>

          {/* Streaks Row */}
          <div className="flex gap-4 py-2 border-b border-slate-700/50">
            {/* Current Streak */}
            <div className="flex-1 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <MuiIcons.LocalFireDepartment style={{ color: '#f59e0b', fontSize: 18 }} />
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Current</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-amber-400">
                    {stats?.currentStreak || 0}
                  </span>
                  <span className="text-slate-500 text-xs">days</span>
                </div>
              </div>
            </div>

            {/* Best Streak */}
            <div className="flex-1 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <MuiIcons.EmojiEvents style={{ color: '#a855f7', fontSize: 18 }} />
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Best</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-purple-400">
                    {stats?.bestStreak || 0}
                  </span>
                  <span className="text-slate-500 text-xs">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Stats */}
          <div className="py-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <MuiIcons.TrendingUp style={{ color: '#94a3b8', fontSize: 16 }} />
              <span className="text-slate-400 text-sm font-medium">Completion Rate</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* This Month */}
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <span className="text-slate-500 text-xs block mb-1">This Month</span>
                <span className={`text-lg font-bold ${getScoreColor(stats?.thisMonth || 0)}`}>
                  {stats?.thisMonth || 0}%
                </span>
              </div>

              {/* This Year */}
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <span className="text-slate-500 text-xs block mb-1">This Year</span>
                <span className={`text-lg font-bold ${getScoreColor(stats?.thisYear || 0)}`}>
                  {stats?.thisYear || 0}%
                </span>
              </div>

              {/* All Time */}
              <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                <span className="text-slate-500 text-xs block mb-1">All Time</span>
                <span className={`text-lg font-bold ${getScoreColor(stats?.allTime || 0)}`}>
                  {stats?.allTime || 0}%
                </span>
              </div>
            </div>

            {/* Progress Bar for this month */}
            <div className="mt-3">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (stats?.thisMonth || 0) >= 80
                      ? 'bg-emerald-500'
                      : (stats?.thisMonth || 0) >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${stats?.thisMonth || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* GitHub-style Contribution Graph */}
          <div className="py-2">
            <ContributionGraph entries={habit.entries || []} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-between gap-3">
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={handleEdit}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors font-medium flex items-center gap-2"
          >
            <MuiIcons.Edit style={{ fontSize: 18 }} />
            Edit Habit
          </button>
        </div>
      </div>
    </div>
  );
}

export default HabitDetailModal;
