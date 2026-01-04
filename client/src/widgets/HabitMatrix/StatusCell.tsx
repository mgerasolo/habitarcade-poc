import { useState, useRef, useCallback } from 'react';
import { COMMON_STATUSES, STATUS_COLORS, type HabitStatus } from '../../types';
import { useUpdateHabitEntry } from '../../api';
import { StatusTooltip } from './StatusTooltip';
import { useHabitMatrixContext } from './HabitMatrixContext';

interface StatusCellProps {
  habitId: string;
  date: string;
  dayOfMonth: string;
  dateIndex: number;
  status: HabitStatus;
  isToday: boolean;
  isWeekend?: boolean;
  size?: number; // Cell width
  cellHeight?: number; // Cell height (optional, defaults to size for square cells)
  // Count-based habit support
  dailyTarget?: number;
  currentCount?: number;
  // Parent/child habit support
  isParentHabit?: boolean;
  siblingCompleted?: boolean; // True if a sibling is already marked complete
}

/**
 * Get progressive green color based on count/target ratio
 * Returns a green shade from light (#86efac) to dark (#047857) based on progress
 */
function getCountBasedColor(count: number, target: number): string {
  if (target <= 0 || count <= 0) return STATUS_COLORS.empty;

  const ratio = Math.min(count / target, 1); // Cap at 1 (100%)

  // Color stops: 0% = light green, 100% = dark green
  // We'll interpolate between these colors
  if (ratio >= 1) return '#047857'; // Full complete - emerald-700
  if (ratio >= 0.75) return '#059669'; // 75%+ - emerald-600
  if (ratio >= 0.5) return '#10b981'; // 50%+ - emerald-500
  if (ratio >= 0.25) return '#34d399'; // 25%+ - emerald-400
  return '#6ee7b7'; // <25% - emerald-300
}

/**
 * Individual status cell in the Habit Matrix
 * - Shows day of month number when empty (Arial Narrow, 40% black)
 * - Click: Cycles through common statuses (green -> red -> blue -> white)
 * - Hover 1s or Right-click: Opens full status picker tooltip
 * - Crosshair highlight on hover (row/column)
 */
export function StatusCell({
  habitId,
  date,
  dayOfMonth,
  dateIndex,
  status,
  isToday,
  isWeekend = false,
  size = 16,
  cellHeight,
  dailyTarget,
  currentCount = 0,
  isParentHabit = false,
  siblingCompleted = false,
}: StatusCellProps) {
  // Use cellHeight if provided, otherwise fall back to size for square cells
  const height = cellHeight ?? size;
  // State
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'above' | 'below'>('below');

  // Refs
  const cellRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Context for crosshair highlighting
  const { hoveredCell, setHoveredCell } = useHabitMatrixContext();

  // API mutation
  const updateEntry = useUpdateHabitEntry();

  // Determine if this is a count-based habit
  const isCountBased = !!dailyTarget && dailyTarget > 0;

  // Check if this cell is in the highlighted row/column
  const isHighlightedRow = hoveredCell?.habitId === habitId;
  const isHighlightedColumn = hoveredCell?.dateIndex === dateIndex;
  const isHovered = isHighlightedRow && isHighlightedColumn;

  // Compute tooltip position based on available space
  const computeTooltipPosition = useCallback((): 'above' | 'below' => {
    if (!cellRef.current) return 'below';
    const rect = cellRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    return spaceBelow < 200 ? 'above' : 'below';
  }, []);

  // Cycle through common statuses (green -> red -> blue -> white)
  // OR increment count for count-based habits
  const cycleStatus = useCallback(() => {
    if (isCountBased) {
      // For count-based habits, increment count (reset after reaching target + 1)
      const nextCount = currentCount >= (dailyTarget || 1) ? 0 : currentCount + 1;
      // Determine status based on count
      const nextStatus: HabitStatus = nextCount === 0
        ? 'empty'
        : nextCount >= (dailyTarget || 1)
          ? 'complete'
          : 'partial';
      updateEntry.mutate({ habitId, date, status: nextStatus, count: nextCount });
    } else {
      // Standard habit - cycle through statuses
      const currentIndex = COMMON_STATUSES.indexOf(status);
      // If status is not in common statuses, start at complete (green)
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % COMMON_STATUSES.length;
      const nextStatus = COMMON_STATUSES[nextIndex];
      updateEntry.mutate({ habitId, date, status: nextStatus });
    }
  }, [habitId, date, status, updateEntry, isCountBased, currentCount, dailyTarget]);

  // Handle direct status selection from tooltip
  const handleStatusSelect = useCallback((newStatus: HabitStatus) => {
    updateEntry.mutate({ habitId, date, status: newStatus });
    setShowTooltip(false);
  }, [habitId, date, updateEntry]);

  // Handle click - cycle status (disabled for parent habits)
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Parent habits are read-only (computed from children)
    if (isParentHabit) return;
    // Clear hover timer on click
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!showTooltip) {
      cycleStatus();
    }
  }, [showTooltip, cycleStatus, isParentHabit]);

  // Handle right-click - show tooltip
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setTooltipPosition(computeTooltipPosition());
    setShowTooltip(true);
  }, [computeTooltipPosition]);

  // Mouse enter - set hovered cell for crosshair and start hover timer
  const handleMouseEnter = useCallback(() => {
    setHoveredCell({ habitId, dateIndex });
    // Start 1-second timer to show tooltip
    hoverTimerRef.current = setTimeout(() => {
      setTooltipPosition(computeTooltipPosition());
      setShowTooltip(true);
    }, 1000);
  }, [habitId, dateIndex, setHoveredCell, computeTooltipPosition]);

  // Mouse leave - clear hover timer and close tooltip
  const handleMouseLeave = useCallback(() => {
    // Clear hover timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!showTooltip) {
      setHoveredCell(null);
    }
  }, [showTooltip, setHoveredCell]);

  // Close tooltip handler
  const handleCloseTooltip = useCallback(() => {
    setShowTooltip(false);
    setHoveredCell(null);
  }, [setHoveredCell]);

  // Determine background color with crosshair highlight
  const getBackgroundColor = () => {
    // For count-based habits, use progressive green based on count/target
    const baseColor = isCountBased && currentCount > 0
      ? getCountBasedColor(currentCount, dailyTarget || 1)
      : STATUS_COLORS[status];

    // If this is the hovered cell itself, show status color with slight emphasis
    if (isHovered) {
      return baseColor;
    }
    // If in highlighted row or column, overlay yellow tint
    if (isHighlightedRow || isHighlightedColumn) {
      if (status === 'empty' && (!isCountBased || currentCount === 0)) {
        return 'rgba(250, 204, 21, 0.15)'; // Yellow tint on empty
      }
      // For colored cells, we'll use a box-shadow instead
      return baseColor;
    }
    return baseColor;
  };

  // Get opacity for sibling grayed out state
  const getOpacity = () => {
    if (siblingCompleted) return 0.4; // Gray out siblings when one is complete
    return 1;
  };

  // Get box shadow for crosshair effect on colored cells
  const getBoxShadow = () => {
    const baseShadow = status !== 'empty'
      ? 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1)'
      : 'inset 0 0 0 1px rgba(0,0,0,0.08)';

    if ((isHighlightedRow || isHighlightedColumn) && !isHovered) {
      return `${baseShadow}, inset 0 0 0 100px rgba(250, 204, 21, 0.2)`;
    }
    return baseShadow;
  };

  return (
    <div className="relative flex-1 flex items-center justify-center min-w-0">
      <div
        ref={cellRef}
        className={`
          rounded-sm relative
          transition-all duration-75 ease-out
          flex items-center justify-center
          ${isParentHabit ? 'cursor-default' : 'cursor-pointer'}
          ${isHovered ? 'scale-110 shadow-lg z-20' : ''}
          ${isToday ? 'ring-2 ring-teal-400 ring-offset-1 ring-offset-slate-800' : ''}
          ${updateEntry.isPending ? 'animate-pulse' : ''}
        `}
        style={{
          width: '100%',
          maxWidth: 32, // Cap cell width for readability
          height: height,
          backgroundColor: getBackgroundColor(),
          boxShadow: getBoxShadow(),
          opacity: getOpacity(),
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        aria-label={
          isCountBased
            ? `${date}: ${currentCount}/${dailyTarget}. Click to increment.`
            : `${date}: ${status}. Click to cycle, hover or right-click for more options.`
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cycleStatus();
          }
        }}
      >
        {/* Count-based habit: show count number (#44) */}
        {isCountBased && currentCount > 0 && (
          <span
            style={{
              fontFamily: '"Arial Narrow", Arial, sans-serif',
              fontSize: height > 20 ? '11px' : '9px',
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 700,
              lineHeight: 1,
              textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(0,0,0,0.3)',
              position: 'relative',
              zIndex: 20,
            }}
          >
            {currentCount}
          </span>
        )}
        {/* Day number - show always for non-count-based habits with appropriate contrast (#44) */}
        {(!isCountBased || currentCount === 0) && (
          <span
            style={{
              fontFamily: '"Arial Narrow", Arial, sans-serif',
              fontSize: height > 20 ? '11px' : '9px',
              color: status === 'empty' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.95)',
              fontWeight: status === 'empty' ? 600 : 700,
              lineHeight: 1,
              textShadow: status !== 'empty' ? '0 1px 2px rgba(0,0,0,0.5), 0 0 4px rgba(0,0,0,0.3)' : 'none',
              position: 'relative',
              zIndex: 20,
            }}
          >
            {dayOfMonth}
          </span>
        )}
      </div>

      {/* Status picker tooltip - rendered via portal */}
      {showTooltip && (
        <StatusTooltip
          currentStatus={status}
          onSelect={handleStatusSelect}
          onClose={handleCloseTooltip}
          position={tooltipPosition}
          anchorRef={cellRef}
        />
      )}
    </div>
  );
}

export default StatusCell;
