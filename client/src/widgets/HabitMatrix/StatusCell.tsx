import { useState, useRef, useCallback, useEffect } from 'react';
import { COMMON_STATUSES, STATUS_COLORS, type HabitStatus } from '../../types';
import { useUpdateHabitEntry } from '../../api';
import { StatusTooltip } from './StatusTooltip';
import { LongPressTooltip } from './LongPressTooltip';
import { useHabitMatrixContext } from './HabitMatrixContext';

interface StatusCellProps {
  habitId: string;
  habitName?: string;
  date: string;
  dayOfMonth: string;
  dateIndex: number;
  status: HabitStatus;
  isToday: boolean;
  isWeekend?: boolean;
  size?: number;
  /** Count value for count-based habits */
  count?: number;
  /** Goal count for count-based habits */
  goalCount?: number;
  /** Notes for this entry */
  notes?: string;
  /** Current streak count at this date */
  streakCount?: number;
  /** Whether this is a count-based habit */
  isCountBased?: boolean;
  /** Trend warning - true if falling behind */
  isTrending?: boolean;
}

// Long press duration in milliseconds
const LONG_PRESS_DURATION = 500;

/**
 * Get dynamic status color based on count progress (Issue #12)
 * For count-based habits, shows gradient from red to green based on completion
 */
function getCountBasedColor(
  status: HabitStatus,
  count?: number,
  goalCount?: number,
  isCountBased?: boolean
): string {
  // Only apply to count-based habits that aren't fully categorized
  if (!isCountBased || count === undefined || goalCount === undefined || goalCount === 0) {
    return STATUS_COLORS[status];
  }

  const progress = count / goalCount;

  // If marked as complete/extra, use standard colors
  if (status === 'complete' || status === 'extra') {
    return STATUS_COLORS[status];
  }

  // For partial or empty states, show progress-based color
  if (status === 'partial' || status === 'empty') {
    if (progress >= 1) return STATUS_COLORS.extra;    // Over goal - dark green
    if (progress >= 0.75) return STATUS_COLORS.complete; // 75%+ - green
    if (progress >= 0.5) return '#84cc16';             // 50-74% - lime
    if (progress >= 0.25) return '#eab308';            // 25-49% - yellow
    if (progress > 0) return '#f97316';                 // 1-24% - orange
    return STATUS_COLORS[status];                       // 0% - original color
  }

  return STATUS_COLORS[status];
}

/**
 * Individual status cell in the Habit Matrix
 *
 * Features:
 * - Shows day of month number when empty (Arial Narrow, 40% black)
 * - Click: Cycles through common statuses (green -> red -> blue -> white)
 * - Right-click: Opens full status picker tooltip
 * - Long-press: Shows detailed status tooltip with more info
 * - Crosshair highlight on hover (row/column)
 * - Count-based color gradients for progress tracking
 * - Extra status (dark green) for exceeding goals
 * - Trending warning indicator
 */
export function StatusCell({
  habitId,
  habitName = 'Habit',
  date,
  dayOfMonth,
  dateIndex,
  status,
  isToday,
  isWeekend = false,
  size = 16,
  count,
  goalCount,
  notes,
  streakCount,
  isCountBased = false,
  isTrending = false,
}: StatusCellProps) {
  // State
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLongPressTooltip, setShowLongPressTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'above' | 'below'>('below');

  // Refs
  const cellRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressActiveRef = useRef(false);

  // Context for crosshair highlighting
  const { hoveredCell, setHoveredCell } = useHabitMatrixContext();

  // API mutation
  const updateEntry = useUpdateHabitEntry();

  // Check if this cell is in the highlighted row/column
  const isHighlightedRow = hoveredCell?.habitId === habitId;
  const isHighlightedColumn = hoveredCell?.dateIndex === dateIndex;
  const isHovered = isHighlightedRow && isHighlightedColumn;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Compute tooltip position based on available space
  const computeTooltipPosition = useCallback((): 'above' | 'below' => {
    if (!cellRef.current) return 'below';
    const rect = cellRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    return spaceBelow < 250 ? 'above' : 'below';
  }, []);

  // Cycle through common statuses (green -> red -> blue -> white)
  const cycleStatus = useCallback(() => {
    const currentIndex = COMMON_STATUSES.indexOf(status);
    // If status is not in common statuses, start at complete (green)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % COMMON_STATUSES.length;
    const nextStatus = COMMON_STATUSES[nextIndex];
    updateEntry.mutate({ habitId, date, status: nextStatus });
  }, [habitId, date, status, updateEntry]);

  // Handle direct status selection from tooltip
  const handleStatusSelect = useCallback((newStatus: HabitStatus) => {
    updateEntry.mutate({ habitId, date, status: newStatus });
    setShowTooltip(false);
    setShowLongPressTooltip(false);
  }, [habitId, date, updateEntry]);

  // Handle click - cycle status (only if not a long press)
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Don't cycle if a tooltip is open or if it was a long press
    if (!showTooltip && !showLongPressTooltip && !isLongPressActiveRef.current) {
      cycleStatus();
    }
    isLongPressActiveRef.current = false;
  }, [showTooltip, showLongPressTooltip, cycleStatus]);

  // Handle right-click - show quick tooltip
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setTooltipPosition(computeTooltipPosition());
    setShowTooltip(true);
    setShowLongPressTooltip(false);
  }, [computeTooltipPosition]);

  // Long press handlers
  const handlePointerDown = useCallback(() => {
    // Start long press timer
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setTooltipPosition(computeTooltipPosition());
      setShowLongPressTooltip(true);
      setShowTooltip(false);
    }, LONG_PRESS_DURATION);
  }, [computeTooltipPosition]);

  const handlePointerUp = useCallback(() => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    // Clear long press timer on leave
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isLongPressActiveRef.current = false;
  }, []);

  // Mouse enter - set hovered cell for crosshair
  const handleMouseEnter = useCallback(() => {
    setHoveredCell({ habitId, dateIndex });
  }, [habitId, dateIndex, setHoveredCell]);

  // Mouse leave - clear hover (but not if tooltip is open)
  const handleMouseLeave = useCallback(() => {
    if (!showTooltip && !showLongPressTooltip) {
      setHoveredCell(null);
    }
    handlePointerLeave();
  }, [showTooltip, showLongPressTooltip, setHoveredCell, handlePointerLeave]);

  // Close tooltip handler
  const handleCloseTooltip = useCallback(() => {
    setShowTooltip(false);
    setShowLongPressTooltip(false);
    setHoveredCell(null);
  }, [setHoveredCell]);

  // Get the display color (with count-based gradient support)
  const displayColor = getCountBasedColor(status, count, goalCount, isCountBased);

  // Determine background color with crosshair highlight
  const getBackgroundColor = () => {
    // If this is the hovered cell itself, show status color with slight emphasis
    if (isHovered) {
      return displayColor;
    }
    // If in highlighted row or column, overlay yellow tint
    if (isHighlightedRow || isHighlightedColumn) {
      if (status === 'empty') {
        return 'rgba(250, 204, 21, 0.15)'; // Yellow tint on empty
      }
      // For colored cells, we'll use a box-shadow instead
      return displayColor;
    }
    return displayColor;
  };

  // Get box shadow for crosshair effect on colored cells
  const getBoxShadow = () => {
    const baseShadow = status !== 'empty'
      ? 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1)'
      : 'inset 0 0 0 1px rgba(0,0,0,0.08)';

    // Trending warning indicator - orange glow
    if (isTrending && status !== 'complete' && status !== 'extra') {
      const trendingShadow = '0 0 4px 1px rgba(249, 115, 22, 0.5)';
      if ((isHighlightedRow || isHighlightedColumn) && !isHovered) {
        return `${baseShadow}, ${trendingShadow}, inset 0 0 0 100px rgba(250, 204, 21, 0.2)`;
      }
      return `${baseShadow}, ${trendingShadow}`;
    }

    if ((isHighlightedRow || isHighlightedColumn) && !isHovered) {
      return `${baseShadow}, inset 0 0 0 100px rgba(250, 204, 21, 0.2)`;
    }
    return baseShadow;
  };

  // Determine if we should show count indicator
  const showCountIndicator = isCountBased && count !== undefined && count > 0 && status === 'empty';

  return (
    <div className="relative flex items-center justify-center">
      <div
        ref={cellRef}
        className={`
          rounded-sm cursor-pointer relative
          transition-all duration-75 ease-out
          flex items-center justify-center
          ${isHovered ? 'scale-110 shadow-lg z-20' : ''}
          ${isToday ? 'ring-2 ring-teal-400 ring-offset-1 ring-offset-slate-800' : ''}
          ${isWeekend && status === 'empty' ? 'opacity-70' : ''}
          ${updateEntry.isPending ? 'animate-pulse' : ''}
          ${isTrending && status !== 'complete' && status !== 'extra' ? 'animate-pulse' : ''}
        `}
        style={{
          width: size,
          height: size,
          backgroundColor: getBackgroundColor(),
          boxShadow: getBoxShadow(),
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerLeave}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        aria-label={`${date}: ${status}${count !== undefined ? ` (${count}/${goalCount || '?'})` : ''}. Click to cycle, long-press or right-click for more options.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cycleStatus();
          }
        }}
      >
        {/* Day number - show when empty or show count progress */}
        {status === 'empty' && (
          <span
            style={{
              fontFamily: '"Arial Narrow", Arial, sans-serif',
              fontSize: size > 20 ? '11px' : '9px',
              color: showCountIndicator ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.4)',
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {showCountIndicator ? count : dayOfMonth}
          </span>
        )}

        {/* Extra status indicator (dark green) - small badge for exceeding goal */}
        {status === 'extra' && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-300 border border-slate-800"
            title="Exceeded goal!"
          />
        )}

        {/* Trending warning indicator */}
        {isTrending && status !== 'complete' && status !== 'extra' && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400 border border-slate-800 animate-pulse"
            title="Falling behind target"
          />
        )}
      </div>

      {/* Quick status picker tooltip (right-click) */}
      {showTooltip && (
        <StatusTooltip
          currentStatus={status}
          onSelect={handleStatusSelect}
          onClose={handleCloseTooltip}
          position={tooltipPosition}
        />
      )}

      {/* Detailed long-press tooltip */}
      {showLongPressTooltip && (
        <LongPressTooltip
          status={status}
          date={date}
          habitName={habitName}
          notes={notes}
          count={count}
          goalCount={goalCount}
          streakCount={streakCount}
          position={tooltipPosition}
          onClose={handleCloseTooltip}
          onStatusSelect={handleStatusSelect}
        />
      )}
    </div>
  );
}

export default StatusCell;
