import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { STATUS_COLORS, type HabitStatus } from '../../types';

interface LongPressTooltipProps {
  /** Current status of the cell */
  status: HabitStatus;
  /** Date string (YYYY-MM-DD) */
  date: string;
  /** Habit name */
  habitName: string;
  /** Notes for this entry (if any) */
  notes?: string;
  /** Count value for count-based habits */
  count?: number;
  /** Goal count for count-based habits */
  goalCount?: number;
  /** Streak count at this date */
  streakCount?: number;
  /** Position relative to the cell */
  position: 'above' | 'below';
  /** Callback to close the tooltip */
  onClose: () => void;
  /** Callback when a status is selected */
  onStatusSelect: (status: HabitStatus) => void;
}

// Status labels for display
const STATUS_LABELS: Record<HabitStatus, string> = {
  empty: 'Not Set',
  complete: 'Complete',
  missed: 'Missed',
  partial: 'Partial',
  na: 'N/A',
  exempt: 'Exempt',
  extra: 'Extra',
  trending: 'At Risk',
  pink: 'Pink',
};

// Status descriptions
const STATUS_DESCRIPTIONS: Record<HabitStatus, string> = {
  empty: 'No status recorded',
  complete: 'Habit completed successfully',
  missed: 'Habit not completed',
  partial: 'Partially completed',
  na: 'Not applicable for this day',
  exempt: 'Exempt (holiday, sick, etc.)',
  extra: 'Exceeded the goal!',
  trending: 'Falling behind on target',
  pink: 'Custom marker',
};

/**
 * LongPressTooltip - Detailed status tooltip shown on long-press
 *
 * Shows:
 * - Current status with full description
 * - Date information
 * - Entry notes (if any)
 * - Count progress (for count-based habits)
 * - Quick status selection buttons
 */
export function LongPressTooltip({
  status,
  date,
  habitName,
  notes,
  count,
  goalCount,
  streakCount,
  position,
  onClose,
  onStatusSelect,
}: LongPressTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on click outside or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
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

  // Format date nicely
  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

  // Position classes
  const positionClasses = position === 'above'
    ? 'bottom-full mb-2'
    : 'top-full mt-2';

  // Calculate count progress percentage
  const countProgress = count !== undefined && goalCount !== undefined && goalCount > 0
    ? Math.min(100, Math.round((count / goalCount) * 100))
    : null;

  return (
    <div
      ref={tooltipRef}
      className={`
        absolute ${positionClasses} left-1/2 -translate-x-1/2 z-50
        bg-slate-900/95 backdrop-blur-sm rounded-xl shadow-2xl
        border border-slate-700/50
        w-64 animate-in fade-in zoom-in-95 duration-150
      `}
      role="dialog"
      aria-label="Habit status details"
    >
      {/* Arrow indicator */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 w-3 h-3
          bg-slate-900/95 border-slate-700/50 transform rotate-45
          ${position === 'above' ? 'bottom-[-6px] border-r border-b' : 'top-[-6px] border-l border-t'}
        `}
      />

      {/* Header with habit name and date */}
      <div className="px-3 py-2 border-b border-slate-700/50">
        <div className="font-condensed font-semibold text-slate-100 text-sm truncate">
          {habitName}
        </div>
        <div className="text-[11px] text-slate-400 font-condensed">
          {formattedDate}
        </div>
      </div>

      {/* Current status display */}
      <div className="px-3 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {/* Status color indicator */}
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0"
            style={{ backgroundColor: STATUS_COLORS[status] }}
          />

          <div className="flex-1 min-w-0">
            <div className="font-condensed font-medium text-slate-100 text-sm">
              {STATUS_LABELS[status]}
            </div>
            <div className="text-[11px] text-slate-400 font-condensed">
              {STATUS_DESCRIPTIONS[status]}
            </div>
          </div>
        </div>

        {/* Count progress (for count-based habits) */}
        {countProgress !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-condensed mb-1">
              <span className="text-slate-400">Progress</span>
              <span className="text-slate-200">{count} / {goalCount}</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${countProgress}%`,
                  backgroundColor: countProgress >= 100 ? STATUS_COLORS.extra : STATUS_COLORS.complete,
                }}
              />
            </div>
          </div>
        )}

        {/* Streak info */}
        {streakCount !== undefined && streakCount > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-condensed">
            <span className="text-amber-400">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" />
              </svg>
            </span>
            <span className="text-slate-300">{streakCount} day streak</span>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="mt-2 text-[11px] text-slate-400 font-condensed italic">
            "{notes}"
          </div>
        )}
      </div>

      {/* Quick status selection */}
      <div className="p-2">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-condensed mb-2 px-1">
          Quick Set
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(['complete', 'missed', 'partial', 'empty', 'extra', 'exempt', 'na', 'trending'] as HabitStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusSelect(s)}
              className={`
                group flex flex-col items-center gap-1 p-1.5 rounded-md
                transition-all duration-150
                hover:bg-slate-700/50
                ${status === s ? 'ring-2 ring-teal-400/50 bg-slate-700/30' : ''}
              `}
              title={STATUS_LABELS[s]}
            >
              <div
                className={`
                  w-5 h-5 rounded-sm
                  transition-transform duration-150
                  group-hover:scale-110
                  ${status === s ? 'ring-1 ring-white/30' : ''}
                `}
                style={{ backgroundColor: STATUS_COLORS[s] }}
              />
              <span className="text-[8px] font-condensed text-slate-400 leading-none truncate w-full text-center">
                {STATUS_LABELS[s].slice(0, 6)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LongPressTooltip;
