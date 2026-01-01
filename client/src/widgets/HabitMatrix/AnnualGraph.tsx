import { useMemo, useState, useCallback } from 'react';
import { format, startOfWeek, eachDayOfInterval, getMonth, startOfYear, endOfYear, isToday as checkIsToday } from 'date-fns';

import type { MatrixHabit } from './useHabitMatrix';

interface AnnualGraphProps {
  /** Habits to display in the annual graph */
  habits: MatrixHabit[];
  /** Currently selected year */
  year?: number;
  /** Callback when a cell is clicked */
  onCellClick?: (date: string, stats: DayStats) => void;
  /** Optional class name */
  className?: string;
}

interface DayStats {
  date: string;
  total: number;
  complete: number;
  missed: number;
  partial: number;
  extra: number;
  completionRate: number;
}

// Month labels for the top of the graph
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Day labels for the left side
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/**
 * Get color intensity based on completion rate (GitHub-style)
 * Uses a 5-level intensity scale like GitHub contributions
 */
function getIntensityColor(completionRate: number, total: number): string {
  if (total === 0) return '#1e293b'; // No data - slate-800
  if (completionRate === 0) return '#450a0a'; // 0% - dark red
  if (completionRate < 25) return '#7f1d1d'; // 1-24% - red
  if (completionRate < 50) return '#854d0e'; // 25-49% - amber
  if (completionRate < 75) return '#365314'; // 50-74% - light green
  if (completionRate < 100) return '#166534'; // 75-99% - green
  return '#047857'; // 100% - bright green (extra/complete all)
}

/**
 * AnnualGraph - GitHub-style annual contribution graph for habits
 *
 * Shows a year overview with each day as a colored cell based on
 * habit completion rate. Similar to GitHub's contribution graph.
 */
export function AnnualGraph({
  habits,
  year = new Date().getFullYear(),
  onCellClick,
  className = '',
}: AnnualGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<DayStats | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Generate all days for the year, organized by week
  const { weeks, monthPositions } = useMemo(() => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Start from the Sunday of the week containing Jan 1
    const calendarStart = startOfWeek(yearStart, { weekStartsOn: 0 });

    // Get all days from calendar start to year end
    const allDays = eachDayOfInterval({ start: calendarStart, end: yearEnd });

    // Organize into weeks (columns)
    const weeksList: Date[][] = [];
    let currentWeek: Date[] = [];

    allDays.forEach((day, index) => {
      currentWeek.push(day);
      if ((index + 1) % 7 === 0) {
        weeksList.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add remaining days if any
    if (currentWeek.length > 0) {
      weeksList.push(currentWeek);
    }

    // Calculate month label positions (first week where month appears)
    const monthPos: { month: number; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeksList.forEach((week, weekIndex) => {
      week.forEach(day => {
        const month = getMonth(day);
        if (month !== lastMonth && day.getFullYear() === year) {
          monthPos.push({ month, weekIndex });
          lastMonth = month;
        }
      });
    });

    return { weeks: weeksList, monthPositions: monthPos };
  }, [year]);

  // Calculate stats for each day
  const dayStats = useMemo(() => {
    const statsMap = new Map<string, DayStats>();

    weeks.flat().forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      let total = 0;
      let complete = 0;
      let missed = 0;
      let partial = 0;
      let extra = 0;

      habits.forEach(habit => {
        const entry = habit.entriesByDate.get(dateStr);
        if (entry) {
          const status = entry.status;
          // Count only non-neutral statuses
          if (status !== 'empty' && status !== 'na' && status !== 'exempt') {
            total++;
            if (status === 'complete') complete++;
            else if (status === 'extra') { complete++; extra++; }
            else if (status === 'missed') missed++;
            else if (status === 'partial') partial++;
          }
        }
      });

      const completionRate = total > 0 ? Math.round((complete / total) * 100) : 0;

      statsMap.set(dateStr, {
        date: dateStr,
        total,
        complete,
        missed,
        partial,
        extra,
        completionRate,
      });
    });

    return statsMap;
  }, [weeks, habits]);

  // Handle cell hover
  const handleCellHover = useCallback((
    day: Date,
    event: React.MouseEvent
  ) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const stats = dayStats.get(dateStr);
    if (stats) {
      setHoveredDay(stats);
      setTooltipPosition({
        x: event.clientX,
        y: event.clientY,
      });
    }
  }, [dayStats]);

  // Handle cell click
  const handleCellClick = useCallback((day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const stats = dayStats.get(dateStr);
    if (stats && onCellClick) {
      onCellClick(dateStr, stats);
    }
  }, [dayStats, onCellClick]);

  // Calculate summary stats
  const yearSummary = useMemo(() => {
    let totalCompletions = 0;
    let perfectDays = 0;
    let activeDays = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Iterate through days in reverse (most recent first)
    const today = new Date();
    const sortedDates = Array.from(dayStats.entries())
      .filter(([dateStr]) => new Date(dateStr) <= today)
      .sort((a, b) => b[0].localeCompare(a[0]));

    sortedDates.forEach(([, stats]) => {
      if (stats.total > 0) {
        activeDays++;
        totalCompletions += stats.complete;
        if (stats.completionRate === 100) {
          perfectDays++;
          tempStreak++;
          if (currentStreak === 0) currentStreak = tempStreak;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else if (stats.completionRate >= 75) {
          // Partial completion maintains streak but doesn't increment perfect days
          tempStreak++;
          if (currentStreak === 0) currentStreak = tempStreak;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
    });

    return { totalCompletions, perfectDays, activeDays, currentStreak, maxStreak };
  }, [dayStats]);

  const cellSize = 10;
  const cellGap = 2;

  return (
    <div className={`bg-slate-800/50 rounded-lg p-4 ${className}`}>
      {/* Header with year and summary */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-condensed text-sm font-semibold text-slate-200">
          {year} Contributions
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-400 font-condensed">
          <span title="Total habit completions">
            {yearSummary.totalCompletions} completions
          </span>
          <span title="Days with 100% completion">
            {yearSummary.perfectDays} perfect days
          </span>
          <span title="Current streak">
            {yearSummary.currentStreak} day streak
          </span>
        </div>
      </div>

      {/* Graph container */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: weeks.length * (cellSize + cellGap) + 40 }}>
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthPositions.map(({ month, weekIndex }) => (
              <span
                key={`${month}-${weekIndex}`}
                className="text-[10px] text-slate-500 font-condensed absolute"
                style={{ marginLeft: weekIndex * (cellSize + cellGap) }}
              >
                {MONTH_LABELS[month]}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5 mt-4">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAY_LABELS.map((label, index) => (
                <span
                  key={index}
                  className="text-[9px] text-slate-500 font-condensed h-[10px] flex items-center"
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((day, dayIndex) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const stats = dayStats.get(dateStr);
                  const isInYear = day.getFullYear() === year;
                  const isToday = checkIsToday(day);

                  return (
                    <div
                      key={dayIndex}
                      className={`
                        rounded-[2px] cursor-pointer
                        transition-all duration-100
                        ${isToday ? 'ring-1 ring-teal-400' : ''}
                        ${!isInYear ? 'opacity-20' : 'hover:ring-1 hover:ring-white/50'}
                      `}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isInYear && stats
                          ? getIntensityColor(stats.completionRate, stats.total)
                          : '#1e293b',
                      }}
                      onMouseEnter={(e) => isInYear && handleCellHover(day, e)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => isInYear && handleCellClick(day)}
                      title={isInYear ? format(day, 'MMM d, yyyy') : ''}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-[10px] text-slate-500 font-condensed">Less</span>
        {[
          { rate: 0, total: 0 },
          { rate: 0, total: 1 },
          { rate: 30, total: 1 },
          { rate: 60, total: 1 },
          { rate: 85, total: 1 },
          { rate: 100, total: 1 },
        ].map((level, index) => (
          <div
            key={index}
            className="w-[10px] h-[10px] rounded-[2px]"
            style={{ backgroundColor: getIntensityColor(level.rate, level.total) }}
          />
        ))}
        <span className="text-[10px] text-slate-500 font-condensed">More</span>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="
            fixed z-50 pointer-events-none
            bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-xl
            border border-slate-700/50 px-3 py-2
            text-xs font-condensed
          "
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
          }}
        >
          <div className="font-medium text-slate-100 mb-1">
            {format(new Date(hoveredDay.date), 'EEEE, MMMM d, yyyy')}
          </div>
          {hoveredDay.total > 0 ? (
            <div className="space-y-0.5 text-slate-400">
              <div className="flex justify-between gap-4">
                <span>Completion:</span>
                <span className={`font-medium ${
                  hoveredDay.completionRate >= 100 ? 'text-emerald-400' :
                  hoveredDay.completionRate >= 75 ? 'text-green-400' :
                  hoveredDay.completionRate >= 50 ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {hoveredDay.completionRate}%
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Completed:</span>
                <span className="text-emerald-400">{hoveredDay.complete}</span>
              </div>
              {hoveredDay.missed > 0 && (
                <div className="flex justify-between gap-4">
                  <span>Missed:</span>
                  <span className="text-red-400">{hoveredDay.missed}</span>
                </div>
              )}
              {hoveredDay.partial > 0 && (
                <div className="flex justify-between gap-4">
                  <span>Partial:</span>
                  <span className="text-blue-400">{hoveredDay.partial}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500">No data</div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnnualGraph;
