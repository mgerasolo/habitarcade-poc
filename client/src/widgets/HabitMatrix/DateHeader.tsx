import { memo } from 'react';
import type { DateColumn } from './useHabitMatrix';

interface DateHeaderProps {
  dates: DateColumn[];
  habitNameWidth?: number;
  showScoreHeader?: boolean;
  scoreWidth?: number;
}

/**
 * Date column headers for the Habit Matrix
 * Displays day of week and day of month for each date column
 * Highlights today's column with an arrow indicator and dims weekends
 */
export const DateHeader = memo(function DateHeader({
  dates,
  habitNameWidth = 120,
  showScoreHeader = true,
  scoreWidth = 40,
}: DateHeaderProps) {
  return (
    <div className="flex items-end gap-0.5 mb-1 sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10 py-1">
      {/* Spacer for habit name column */}
      <div style={{ width: habitNameWidth }} className="flex-shrink-0" />

      {/* Date columns */}
      <div className="flex gap-0.5">
        {dates.map((dateCol) => (
          <div
            key={dateCol.date}
            className={`
              w-4 flex flex-col items-center justify-end relative
              font-condensed text-[10px] leading-tight
              transition-colors duration-150
              ${dateCol.isToday
                ? 'text-teal-400 font-semibold'
                : dateCol.isWeekend
                  ? 'text-slate-500'
                  : 'text-slate-400'
              }
            `}
            title={dateCol.date}
          >
            {/* Today arrow indicator - shown above the column */}
            {dateCol.isToday && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <svg
                  width="8"
                  height="6"
                  viewBox="0 0 8 6"
                  fill="currentColor"
                  className="text-teal-400"
                >
                  <path d="M4 6L0 0h8L4 6z" />
                </svg>
              </div>
            )}
            {/* Day of week - only show first letter */}
            <span className="opacity-70">
              {dateCol.dayOfWeek.charAt(0)}
            </span>
            {/* Day of month */}
            <span>
              {dateCol.dayOfMonth}
            </span>
          </div>
        ))}
      </div>

      {/* Score header label */}
      {showScoreHeader && (
        <div
          style={{ width: scoreWidth }}
          className="flex-shrink-0 flex items-center justify-end pl-2"
        >
          <span className="font-condensed text-[9px] text-slate-500 uppercase tracking-wide">
            Score
          </span>
        </div>
      )}
    </div>
  );
});

/**
 * Compact date header for mobile view
 * Shows only the day number with today arrow indicator
 */
export const DateHeaderCompact = memo(function DateHeaderCompact({
  dates,
  habitNameWidth = 80,
  showScoreHeader = true,
  scoreWidth = 35,
}: DateHeaderProps) {
  return (
    <div className="flex items-end gap-1 mb-1 sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10 py-1 pt-3">
      {/* Spacer for habit name column */}
      <div style={{ width: habitNameWidth }} className="flex-shrink-0" />

      {/* Date columns */}
      <div className="flex gap-1">
        {dates.map((dateCol) => (
          <div
            key={dateCol.date}
            className={`
              w-5 h-5 flex items-center justify-center relative
              font-condensed text-xs rounded
              ${dateCol.isToday
                ? 'bg-teal-500/20 text-teal-400 font-bold'
                : dateCol.isWeekend
                  ? 'text-slate-500'
                  : 'text-slate-400'
              }
            `}
            title={`${dateCol.dayOfWeek}, ${dateCol.date}`}
          >
            {/* Today arrow indicator */}
            {dateCol.isToday && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <svg
                  width="8"
                  height="6"
                  viewBox="0 0 8 6"
                  fill="currentColor"
                  className="text-teal-400"
                >
                  <path d="M4 6L0 0h8L4 6z" />
                </svg>
              </div>
            )}
            {dateCol.dayOfMonth}
          </div>
        ))}
      </div>

      {/* Score header label */}
      {showScoreHeader && (
        <div
          style={{ width: scoreWidth }}
          className="flex-shrink-0 flex items-center justify-end pl-1"
        >
          <span className="font-condensed text-[8px] text-slate-500 uppercase tracking-wide">
            %
          </span>
        </div>
      )}
    </div>
  );
});

/**
 * Week labels for month view
 * Shows week numbers or month labels at appropriate intervals
 */
export const WeekMarkers = memo(function WeekMarkers({
  dates,
  habitNameWidth = 120,
}: DateHeaderProps) {
  // Find first Monday of each week for markers
  const weekStarts = dates.filter(
    (d, i) => i === 0 || d.dayOfWeek === 'Mon'
  );

  return (
    <div className="flex gap-0.5 mb-0.5" style={{ paddingLeft: habitNameWidth }}>
      {weekStarts.map((weekStart, index) => {
        // Calculate width based on days until next week start
        const startIndex = dates.findIndex(d => d.date === weekStart.date);
        const endIndex = weekStarts[index + 1]
          ? dates.findIndex(d => d.date === weekStarts[index + 1].date)
          : dates.length;
        const daysInWeek = endIndex - startIndex;
        // Width = (cell width + gap) * days - gap
        const width = (16 + 2) * daysInWeek - 2;

        return (
          <div
            key={weekStart.date}
            style={{ width }}
            className="text-[9px] text-slate-500 font-condensed truncate"
          >
            {/* Show month name if this is the first day of a month */}
            {weekStart.dayOfMonth === '1' ? (
              <span className="text-slate-400">
                {new Date(weekStart.date).toLocaleDateString('en-US', { month: 'short' })}
              </span>
            ) : (
              `W${Math.ceil(parseInt(weekStart.dayOfMonth) / 7)}`
            )}
          </div>
        );
      })}
    </div>
  );
});

export default DateHeader;
