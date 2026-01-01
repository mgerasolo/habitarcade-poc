import { useState, useRef, useCallback } from 'react';
import { COMMON_STATUSES, STATUS_COLORS, type HabitStatus } from '../../types';
import { useUpdateHabitEntry } from '../../api';
import { StatusTooltip } from './StatusTooltip';

interface StatusCellProps {
  habitId: string;
  date: string;
  status: HabitStatus;
  isToday: boolean;
  isWeekend?: boolean;
  size?: number;
}

/**
 * Individual status cell in the Habit Matrix
 * - Click: Cycles through common statuses (empty -> complete -> missed)
 * - Long press (300ms): Opens full status picker tooltip
 * - Hover (500ms delay): Also opens tooltip for desktop users
 */
export function StatusCell({
  habitId,
  date,
  status,
  isToday,
  isWeekend = false,
  size = 16,
}: StatusCellProps) {
  // State
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'above' | 'below'>('below');

  // Refs
  const cellRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  // API mutation
  const updateEntry = useUpdateHabitEntry();

  // Compute tooltip position based on available space
  const computeTooltipPosition = useCallback((): 'above' | 'below' => {
    if (!cellRef.current) return 'below';
    const rect = cellRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    return spaceBelow < 250 ? 'above' : 'below';
  }, []);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  // Cycle through common statuses (empty -> complete -> missed -> empty)
  const cycleStatus = useCallback(() => {
    const currentIndex = COMMON_STATUSES.indexOf(status);
    // If status is not in common statuses, start at complete
    const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % COMMON_STATUSES.length;
    const nextStatus = COMMON_STATUSES[nextIndex];
    updateEntry.mutate({ habitId, date, status: nextStatus });
  }, [habitId, date, status, updateEntry]);

  // Handle direct status selection from tooltip
  const handleStatusSelect = useCallback((newStatus: HabitStatus) => {
    updateEntry.mutate({ habitId, date, status: newStatus });
    setShowTooltip(false);
  }, [habitId, date, updateEntry]);

  // Mouse/Touch down - start long press timer
  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setTooltipPosition(computeTooltipPosition());
      setShowTooltip(true);
    }, 300); // 300ms for long press
  }, [computeTooltipPosition]);

  // Mouse/Touch up - cycle status if not long press
  const handlePointerUp = useCallback(() => {
    clearTimers();
    if (!didLongPress.current && !showTooltip) {
      cycleStatus();
    }
  }, [clearTimers, showTooltip, cycleStatus]);

  // Mouse enter - start hover tooltip timer
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    // Show tooltip after 500ms hover
    hoverTimer.current = setTimeout(() => {
      setTooltipPosition(computeTooltipPosition());
      setShowTooltip(true);
    }, 500);
  }, [computeTooltipPosition]);

  // Mouse leave - cancel hover timer and potentially close tooltip
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    clearTimers();
    // Don't close tooltip if it was opened by long press
    // User must click outside to close
  }, [clearTimers]);

  // Close tooltip handler
  const handleCloseTooltip = useCallback(() => {
    setShowTooltip(false);
    didLongPress.current = false;
  }, []);

  // Dynamic styling based on status and state
  const cellClasses = `
    rounded-sm cursor-pointer
    transition-all duration-150 ease-out
    ${isHovered ? 'scale-110 shadow-md' : ''}
    ${isToday ? 'ring-2 ring-teal-400 ring-offset-1 ring-offset-slate-800' : ''}
    ${isWeekend && status === 'empty' ? 'opacity-60' : ''}
    ${updateEntry.isPending ? 'animate-pulse' : ''}
  `;

  return (
    <div className="relative flex items-center justify-center">
      <div
        ref={cellRef}
        className={cellClasses}
        style={{
          width: size,
          height: size,
          backgroundColor: STATUS_COLORS[status],
          // Add subtle inner shadow for depth
          boxShadow: status !== 'empty'
            ? 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1)'
            : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
        }}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handlePointerDown}
        onTouchEnd={(e) => {
          e.preventDefault(); // Prevent ghost clicks
          handlePointerUp();
        }}
        onTouchCancel={() => {
          clearTimers();
          didLongPress.current = false;
        }}
        role="button"
        tabIndex={0}
        aria-label={`${date}: ${status}. Click to cycle, hold for more options.`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cycleStatus();
          }
        }}
      />

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
