import { useEffect, useMemo } from 'react';
import { format, startOfMonth, eachDayOfInterval } from 'date-fns';
import { useUIStore } from '../../stores';
import type { Habit, HabitEntry, HabitStatus } from '../../types';
import * as MuiIcons from '@mui/icons-material';

/**
 * Calculate current streak for a habit
 */
function calculateCurrentStreak(entries: HabitEntry[]): number {
  if (!entries || entries.length === 0) return 0;

  // Sort entries by date descending (most recent first)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  let currentDate = today;

  // Create a map for quick lookup
  const entryMap = new Map<string, HabitStatus>();
  sortedEntries.forEach(entry => {
    entryMap.set(entry.date, entry.status);
  });

  // Count consecutive complete/extra days
  while (true) {
    const status = entryMap.get(currentDate);

    if (status === 'complete' || status === 'extra') {
      streak++;
    } else if (status === 'na' || status === 'exempt' || status === 'empty') {
      // These don't break the streak but also don't count
      // For 'empty' on today, allow it (user might not have logged yet)
      if (currentDate === today && status === 'empty') {
        // Check yesterday instead
      } else if (status !== 'na' && status !== 'exempt') {
        break;
      }
    } else {
      // missed, partial, pink - streak broken
      break;
    }

    // Move to previous day
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    currentDate = format(prevDate, 'yyyy-MM-dd');

    // Safety limit
    if (streak > 1000) break;
  }

  return streak;
}

/**
 * Calculate this month's completion percentage
 *
 * Scoring rules:
 * - Only count "completed days" (past days, not including today unless filled)
 * - Today is only included if user has filled in a value (not 'empty')
 * - N/A and Exempt are excluded from the denominator
 */
function calculateMonthCompletion(entries: HabitEntry[]): number {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const monthStart = startOfMonth(today);
  const monthDates = eachDayOfInterval({ start: monthStart, end: today });

  const entryMap = new Map<string, HabitStatus>();
  (entries || []).forEach(entry => {
    entryMap.set(entry.date, entry.status);
  });

  let completed = 0;
  let partial = 0;
  let exempt = 0;
  let na = 0;
  let countedCells = 0;

  for (const date of monthDates) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const status = entryMap.get(dateStr) || 'empty';
    const isToday = dateStr === todayStr;
    const hasEntry = status !== 'empty';

    // Only count this cell if:
    // 1. It's a past day (not today), OR
    // 2. It's today AND user has filled in a value (not empty)
    const shouldCount = !isToday || hasEntry;

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
    }
  }

  const excluded = exempt + na;
  const effectiveTotal = countedCells - excluded;

  if (effectiveTotal <= 0) return 0;

  return Math.round(((completed + partial * 0.5) / effectiveTotal) * 100);
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

    const currentStreak = calculateCurrentStreak(habit.entries || []);
    const monthCompletion = calculateMonthCompletion(habit.entries || []);
    const createdAt = habit.createdAt ? new Date(habit.createdAt) : null;

    return {
      currentStreak,
      monthCompletion,
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
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden">
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
        <div className="p-6 space-y-4">
          {/* Creation Date */}
          <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <MuiIcons.CalendarMonth style={{ color: '#94a3b8', fontSize: 20 }} />
              </div>
              <span className="text-slate-400">Created</span>
            </div>
            <span className="text-white font-medium">
              {stats?.createdAt
                ? format(stats.createdAt, 'MMM d, yyyy')
                : 'Unknown'}
            </span>
          </div>

          {/* Current Streak */}
          <div className="flex items-center justify-between py-3 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <MuiIcons.LocalFireDepartment style={{ color: '#f59e0b', fontSize: 20 }} />
              </div>
              <span className="text-slate-400">Current Streak</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-400">
                {stats?.currentStreak || 0}
              </span>
              <span className="text-slate-500 text-sm">days</span>
            </div>
          </div>

          {/* This Month Completion */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <MuiIcons.TrendingUp style={{ color: '#94a3b8', fontSize: 20 }} />
              </div>
              <span className="text-slate-400">This Month</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getScoreColor(stats?.monthCompletion || 0)}`}>
                {stats?.monthCompletion || 0}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (stats?.monthCompletion || 0) >= 80
                    ? 'bg-emerald-500'
                    : (stats?.monthCompletion || 0) >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${stats?.monthCompletion || 0}%` }}
              />
            </div>
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
