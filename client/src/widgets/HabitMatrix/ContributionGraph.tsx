import { useMemo, useState, useCallback } from 'react';
import { format, eachDayOfInterval, getDay, subYears, startOfMonth } from 'date-fns';
import { STATUS_COLORS, type HabitStatus, type HabitEntry } from '../../types';

// Day of week labels
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Completion level colors (GitHub-style green gradient)
const COMPLETION_COLORS = {
  empty: '#1e293b',      // slate-800 for no data
  level0: '#1e293b',     // slate-800 for 0%
  level1: '#064e3b',     // emerald-900 for 1-25%
  level2: '#059669',     // emerald-600 for 26-50%
  level3: '#10b981',     // emerald-500 for 51-75%
  level4: '#34d399',     // emerald-400 for 76-100%
};

// Status labels for tooltip
const STATUS_LABELS: Record<HabitStatus, string> = {
  empty: 'No entry',
  complete: 'Complete',
  missed: 'Missed',
  partial: 'Partial',
  na: 'N/A',
  exempt: 'Exempt',
  extra: 'Extra',
  pink: 'Pink',
};

interface ContributionGraphProps {
  /** Filter entries by habit ID (if not provided, shows all habits) */
  habitId?: string;
  /** Habit entries to display */
  entries: HabitEntry[];
  /** Custom class name */
  className?: string;
  /** Cell size in pixels (default: 12) */
  cellSize?: number;
  /** Gap between cells in pixels (default: 2) */
  cellGap?: number;
}

interface DayData {
  date: Date;
  dateStr: string;
  status: HabitStatus | null;
  completionPercentage: number;
  totalEntries: number;
  completedEntries: number;
}

interface TooltipData {
  x: number;
  y: number;
  day: DayData;
}

/**
 * Get completion level color based on percentage
 */
function getCompletionColor(percentage: number): string {
  if (percentage === 0) return COMPLETION_COLORS.level0;
  if (percentage <= 25) return COMPLETION_COLORS.level1;
  if (percentage <= 50) return COMPLETION_COLORS.level2;
  if (percentage <= 75) return COMPLETION_COLORS.level3;
  return COMPLETION_COLORS.level4;
}

/**
 * ContributionGraph - GitHub-style yearly contribution heatmap
 *
 * Shows 12 months of habit completion data as a grid where:
 * - Rows represent days of the week (Sunday to Saturday)
 * - Columns represent weeks
 * - Cell color intensity shows completion level
 * - Hover shows date and status details
 */
export function ContributionGraph({
  habitId,
  entries,
  className = '',
  cellSize = 12,
  cellGap = 2,
}: ContributionGraphProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Calculate date range (past 12 months from today)
  const dateRange = useMemo(() => {
    const today = new Date();
    const oneYearAgo = subYears(today, 1);
    return {
      start: startOfMonth(oneYearAgo),
      end: today,
    };
  }, []);

  // Generate all days in the range
  const allDays = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Create a map of date -> entries for quick lookup
  const entriesByDate = useMemo(() => {
    const map = new Map<string, HabitEntry[]>();

    const filteredEntries = habitId
      ? entries.filter(e => e.habitId === habitId)
      : entries;

    for (const entry of filteredEntries) {
      const dateKey = entry.date; // Already in YYYY-MM-DD format
      const existing = map.get(dateKey) || [];
      existing.push(entry);
      map.set(dateKey, existing);
    }

    return map;
  }, [entries, habitId]);

  // Process days with entry data
  const daysData = useMemo((): DayData[] => {
    return allDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entriesByDate.get(dateStr) || [];

      // Calculate completion for this day
      const totalEntries = dayEntries.length;
      const completedEntries = dayEntries.filter(e =>
        e.status === 'complete' || e.status === 'extra'
      ).length;

      // For single habit, use its status; for multiple, use completion percentage
      let status: HabitStatus | null = null;
      let completionPercentage = 0;

      if (totalEntries > 0) {
        if (habitId && dayEntries.length === 1) {
          status = dayEntries[0].status;
        }
        completionPercentage = (completedEntries / totalEntries) * 100;
      }

      return {
        date,
        dateStr,
        status,
        completionPercentage,
        totalEntries,
        completedEntries,
      };
    });
  }, [allDays, entriesByDate, habitId]);

  // Organize days into weeks (columns)
  const weeks = useMemo(() => {
    const result: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Pad the first week with empty cells if needed
    if (daysData.length > 0) {
      const firstDayOfWeek = getDay(daysData[0].date);
      for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push({
          date: new Date(0),
          dateStr: '',
          status: null,
          completionPercentage: 0,
          totalEntries: 0,
          completedEntries: 0,
        });
      }
    }

    for (const day of daysData) {
      currentWeek.push(day);
      if (getDay(day.date) === 6) { // Saturday - end of week
        result.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add remaining days
    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [daysData]);

  // Generate month labels with positions
  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      // Find the first valid day in the week
      const validDay = week.find(d => d.dateStr);
      if (validDay) {
        const month = validDay.date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            label: format(validDay.date, 'MMM'),
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks]);

  // Handle cell hover
  const handleCellMouseEnter = useCallback((e: React.MouseEvent, day: DayData) => {
    if (!day.dateStr) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top,
      day,
    });
  }, []);

  const handleCellMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Calculate dimensions
  const dayLabelWidth = 20;
  const monthLabelHeight = 16;

  return (
    <div className={`relative ${className}`}>
      {/* Month labels */}
      <div
        className="flex text-[10px] text-slate-400 font-condensed mb-1"
        style={{ paddingLeft: dayLabelWidth + 4 }}
      >
        {monthLabels.map(({ label, weekIndex }) => (
          <span
            key={`${label}-${weekIndex}`}
            className="absolute"
            style={{
              left: dayLabelWidth + 4 + weekIndex * (cellSize + cellGap),
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Main grid container */}
      <div className="flex" style={{ marginTop: monthLabelHeight }}>
        {/* Day of week labels */}
        <div
          className="flex flex-col text-[10px] text-slate-400 font-condensed pr-1"
          style={{ width: dayLabelWidth }}
        >
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end"
              style={{ height: cellSize + cellGap }}
            >
              {/* Only show S, M, W, F for cleaner look */}
              {i % 2 === 0 && <span>{label}</span>}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div className="flex" style={{ gap: cellGap }}>
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="flex flex-col"
              style={{ gap: cellGap }}
            >
              {week.map((day, dayIndex) => {
                const isEmptyCell = !day.dateStr;

                // Determine cell color
                let backgroundColor: string;
                if (isEmptyCell) {
                  backgroundColor = 'transparent';
                } else if (day.status && habitId) {
                  // Single habit mode - use status color
                  backgroundColor = STATUS_COLORS[day.status];
                } else if (day.totalEntries > 0) {
                  // Multiple habits - use completion gradient
                  backgroundColor = getCompletionColor(day.completionPercentage);
                } else {
                  // No entries
                  backgroundColor = COMPLETION_COLORS.empty;
                }

                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      rounded-sm transition-all duration-75
                      ${!isEmptyCell ? 'cursor-pointer hover:ring-2 hover:ring-teal-400/50' : ''}
                    `}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor,
                    }}
                    onMouseEnter={(e) => handleCellMouseEnter(e, day)}
                    onMouseLeave={handleCellMouseLeave}
                    title={isEmptyCell ? undefined : format(day.date, 'MMM d, yyyy')}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-slate-400 font-condensed">
        <span>Less</span>
        {[
          COMPLETION_COLORS.level0,
          COMPLETION_COLORS.level1,
          COMPLETION_COLORS.level2,
          COMPLETION_COLORS.level3,
          COMPLETION_COLORS.level4,
        ].map((color, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: color,
            }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <ContributionTooltip
          x={tooltip.x}
          y={tooltip.y}
          day={tooltip.day}
          habitId={habitId}
        />
      )}
    </div>
  );
}

/**
 * Tooltip component for contribution cells
 */
function ContributionTooltip({
  x,
  y,
  day,
  habitId,
}: {
  x: number;
  y: number;
  day: DayData;
  habitId?: string;
}) {
  const formattedDate = format(day.date, 'EEEE, MMMM d, yyyy');

  // Build status text
  let statusText: string;
  if (habitId && day.status) {
    statusText = STATUS_LABELS[day.status];
  } else if (day.totalEntries > 0) {
    statusText = `${day.completedEntries}/${day.totalEntries} completed (${Math.round(day.completionPercentage)}%)`;
  } else {
    statusText = 'No entries';
  }

  return (
    <div
      className="
        fixed z-50 pointer-events-none
        bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-xl
        border border-slate-700/50 px-3 py-2
        animate-in fade-in zoom-in-95 duration-150
        text-xs
      "
      style={{
        left: x,
        top: y - 8,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {/* Arrow */}
      <div
        className="
          absolute left-1/2 -translate-x-1/2 bottom-[-6px]
          w-3 h-3 bg-slate-900/95 border-slate-700/50
          transform rotate-45 border-r border-b
        "
      />

      <div className="text-slate-200 font-medium mb-0.5">{formattedDate}</div>
      <div className="text-slate-400">{statusText}</div>
    </div>
  );
}

export default ContributionGraph;
