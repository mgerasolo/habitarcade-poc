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
  size?: number;
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
}: StatusCellProps) {
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
  }, [habitId, date, updateEntry]);

  // Handle click - cycle status
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Clear hover timer on click
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!showTooltip) {
      cycleStatus();
    }
  }, [showTooltip, cycleStatus]);

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
    // If this is the hovered cell itself, show status color with slight emphasis
    if (isHovered) {
      return STATUS_COLORS[status];
    }
    // If in highlighted row or column, overlay yellow tint
    if (isHighlightedRow || isHighlightedColumn) {
      if (status === 'empty') {
        return 'rgba(250, 204, 21, 0.15)'; // Yellow tint on empty
      }
      // For colored cells, we'll use a box-shadow instead
      return STATUS_COLORS[status];
    }
    return STATUS_COLORS[status];
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
        `}
        style={{
          width: size,
          height: size,
          backgroundColor: getBackgroundColor(),
          boxShadow: getBoxShadow(),
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        aria-label={`${date}: ${status}. Click to cycle, hover or right-click for more options.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cycleStatus();
          }
        }}
      >
        {/* Day number - show only when empty */}
        {status === 'empty' && (
          <span
            style={{
              fontFamily: '"Arial Narrow", Arial, sans-serif',
              fontSize: size > 20 ? '11px' : '9px',
              color: 'rgba(0, 0, 0, 0.4)',
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {dayOfMonth}
          </span>
        )}
      </div>

      {/* Status picker tooltip */}
      {showTooltip && (
        <StatusTooltip
          currentStatus={status}
          onSelect={handleStatusSelect}
          onClose={handleCloseTooltip}
          position={tooltipPosition}
        />
      )}
    </div>
  );
}

export default StatusCell;
