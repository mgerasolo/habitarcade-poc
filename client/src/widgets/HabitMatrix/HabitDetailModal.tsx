import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { STATUS_COLORS, type HabitStatus } from '../../types';
import type { MatrixHabit } from './useHabitMatrix';

interface HabitDetailModalProps {
  /** The habit to display details for */
  habit: MatrixHabit;
  /** Callback to close the modal */
  onClose: () => void;
}

interface MonthStats {
  month: string;
  total: number;
  complete: number;
  missed: number;
  partial: number;
  completionRate: number;
}

/**
 * HabitDetailModal - Shows detailed information about a habit
 *
 * Features:
 * - Habit name, icon, and category
 * - Streak information (current and best)
 * - Monthly mini-graph showing completion history
 * - Statistics breakdown (completion rate, total entries, etc.)
 */
export function HabitDetailModal({ habit, onClose }: HabitDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  // Close on click outside or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Calculate streak information
  const streakInfo = useMemo(() => {
    const today = new Date();
    const sortedDates = Array.from(habit.entriesByDate.entries())
      .filter(([date]) => new Date(date) <= today)
      .sort((a, b) => b[0].localeCompare(a[0])); // Most recent first

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    sortedDates.forEach(([dateStr, entry]) => {
      const date = new Date(dateStr);
      const status = entry.status;

      // Check for streak-contributing statuses
      if (status === 'complete' || status === 'extra') {
        // Check if consecutive (or first)
        if (!lastDate || (lastDate.getTime() - date.getTime()) <= 86400000 * 2) {
          tempStreak++;
          if (currentStreak === 0 || currentStreak === tempStreak - 1) {
            currentStreak = tempStreak;
          }
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
        lastDate = date;
      } else if (status !== 'empty' && status !== 'na' && status !== 'exempt') {
        // Streak broken by missed or partial
        tempStreak = 0;
        lastDate = null;
      }
      // empty, na, exempt don't affect streak
    });

    return { currentStreak, maxStreak };
  }, [habit.entriesByDate]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    let total = 0;
    let complete = 0;
    let missed = 0;
    let partial = 0;
    let extra = 0;

    habit.entriesByDate.forEach((entry) => {
      const status = entry.status;
      if (status !== 'empty' && status !== 'na' && status !== 'exempt') {
        total++;
        if (status === 'complete') complete++;
        else if (status === 'extra') { complete++; extra++; }
        else if (status === 'missed') missed++;
        else if (status === 'partial') partial++;
      }
    });

    const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

    return { total, complete, missed, partial, extra, completionRate };
  }, [habit.entriesByDate]);

  // Generate month calendar data
  const monthCalendar = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = habit.entriesByDate.get(dateStr);
      return {
        date: day,
        dateStr,
        status: entry?.status || 'empty' as HabitStatus,
        dayOfMonth: format(day, 'd'),
        dayOfWeek: day.getDay(),
      };
    });
  }, [habit.entriesByDate, selectedMonth]);

  // Calculate month statistics
  const monthStats = useMemo((): MonthStats => {
    let total = 0;
    let complete = 0;
    let missed = 0;
    let partial = 0;

    monthCalendar.forEach(({ status }) => {
      if (status !== 'empty' && status !== 'na' && status !== 'exempt') {
        total++;
        if (status === 'complete' || status === 'extra') complete++;
        else if (status === 'missed') missed++;
        else if (status === 'partial') partial++;
      }
    });

    return {
      month: format(selectedMonth, 'MMMM yyyy'),
      total,
      complete,
      missed,
      partial,
      completionRate: total > 0 ? Math.round((complete / total) * 100) : 0,
    };
  }, [monthCalendar, selectedMonth]);

  // Navigate months
  const goToPrevMonth = useCallback(() => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // Get first day offset for calendar grid
  const firstDayOffset = monthCalendar[0]?.dayOfWeek || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="
          bg-slate-800/95 rounded-xl shadow-2xl
          border border-slate-700/50
          max-w-md w-full mx-4
          animate-in zoom-in-95 duration-200
          max-h-[90vh] overflow-y-auto
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            {/* Habit icon */}
            {habit.icon && (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${habit.iconColor || '#6b7280'}20` }}
              >
                <i className={habit.icon} style={{ color: habit.iconColor || '#6b7280' }} />
              </div>
            )}

            <div>
              <h2 className="font-condensed text-lg font-semibold text-slate-100">
                {habit.name}
              </h2>
              {habit.category && (
                <p className="text-xs text-slate-400 font-condensed">
                  {habit.category.name}
                </p>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="
              p-1.5 rounded-lg
              text-slate-400 hover:text-slate-200
              hover:bg-slate-700/50
              transition-colors duration-150
            "
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Streak badges */}
        <div className="flex gap-4 p-4 border-b border-slate-700/50">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-amber-400 font-condensed">
              {streakInfo.currentStreak}
            </div>
            <div className="text-xs text-slate-400 font-condensed">Current Streak</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-emerald-400 font-condensed">
              {streakInfo.maxStreak}
            </div>
            <div className="text-xs text-slate-400 font-condensed">Best Streak</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-blue-400 font-condensed">
              {overallStats.completionRate}%
            </div>
            <div className="text-xs text-slate-400 font-condensed">Completion</div>
          </div>
        </div>

        {/* Monthly calendar */}
        <div className="p-4 border-b border-slate-700/50">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goToPrevMonth}
              className="p-1 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-slate-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-condensed font-medium text-slate-200">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-1 hover:bg-slate-700/50 rounded transition-colors text-slate-400 hover:text-slate-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div
                key={i}
                className="text-center text-[10px] text-slate-500 font-condensed py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {monthCalendar.map(({ date, dateStr, status, dayOfMonth }) => {
              const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
              return (
                <div
                  key={dateStr}
                  className={`
                    aspect-square rounded-md flex items-center justify-center
                    text-[11px] font-condensed
                    ${isToday ? 'ring-2 ring-teal-400' : ''}
                    ${status === 'empty' ? 'text-slate-500' : 'text-white/90'}
                  `}
                  style={{
                    backgroundColor: STATUS_COLORS[status],
                  }}
                  title={`${format(date, 'MMM d')}: ${status}`}
                >
                  {dayOfMonth}
                </div>
              );
            })}
          </div>

          {/* Month stats */}
          <div className="flex justify-center gap-6 mt-3 text-xs font-condensed text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: STATUS_COLORS.complete }} />
              {monthStats.complete} complete
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: STATUS_COLORS.missed }} />
              {monthStats.missed} missed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: STATUS_COLORS.partial }} />
              {monthStats.partial} partial
            </span>
          </div>
        </div>

        {/* Overall statistics */}
        <div className="p-4">
          <h3 className="font-condensed text-sm font-semibold text-slate-300 mb-3">
            All-Time Statistics
          </h3>
          <div className="space-y-2">
            <StatRow
              label="Total tracked days"
              value={overallStats.total}
            />
            <StatRow
              label="Completed"
              value={overallStats.complete}
              color="text-emerald-400"
            />
            <StatRow
              label="Missed"
              value={overallStats.missed}
              color="text-red-400"
            />
            <StatRow
              label="Partial"
              value={overallStats.partial}
              color="text-blue-400"
            />
            {overallStats.extra > 0 && (
              <StatRow
                label="Extra effort"
                value={overallStats.extra}
                color="text-teal-400"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for stat rows
function StatRow({
  label,
  value,
  color = 'text-slate-200',
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm font-condensed">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}

export default HabitDetailModal;
