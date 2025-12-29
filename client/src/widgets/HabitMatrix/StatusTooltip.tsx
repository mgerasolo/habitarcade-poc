import { useEffect, useRef } from 'react';
import { HABIT_STATUSES, STATUS_COLORS, type HabitStatus } from '../../types';

// Status labels for display
const STATUS_LABELS: Record<HabitStatus, string> = {
  empty: 'Empty',
  complete: 'Complete',
  missed: 'Missed',
  partial: 'Partial',
  na: 'N/A',
  exempt: 'Exempt',
  extra: 'Extra',
  trending: 'Trending',
  pink: 'Pink',
};

// Status descriptions for tooltips
const STATUS_DESCRIPTIONS: Record<HabitStatus, string> = {
  empty: 'No status set',
  complete: 'Habit completed',
  missed: 'Habit missed',
  partial: 'Partially completed',
  na: 'Not applicable',
  exempt: 'Exempt from tracking',
  extra: 'Bonus/extra completion',
  trending: 'Building momentum',
  pink: 'Special marker',
};

interface StatusTooltipProps {
  currentStatus: HabitStatus;
  onSelect: (status: HabitStatus) => void;
  onClose: () => void;
  position?: 'above' | 'below';
}

export function StatusTooltip({
  currentStatus,
  onSelect,
  onClose,
  position = 'below',
}: StatusTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on click outside
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

  const positionClasses = position === 'above'
    ? 'bottom-full mb-2'
    : 'top-full mt-2';

  return (
    <div
      ref={tooltipRef}
      className={`
        absolute ${positionClasses} left-1/2 -translate-x-1/2 z-50
        bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-xl
        border border-slate-700/50 p-2
        min-w-[180px] animate-in fade-in zoom-in-95 duration-150
      `}
      role="listbox"
      aria-label="Select habit status"
    >
      {/* Arrow indicator */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 w-3 h-3
          bg-slate-900/95 border-slate-700/50 transform rotate-45
          ${position === 'above' ? 'bottom-[-6px] border-r border-b' : 'top-[-6px] border-l border-t'}
        `}
      />

      {/* Status grid */}
      <div className="grid grid-cols-3 gap-1">
        {HABIT_STATUSES.map((status) => {
          const isSelected = status === currentStatus;
          return (
            <button
              key={status}
              onClick={() => onSelect(status)}
              className={`
                group flex flex-col items-center gap-1 p-2 rounded-md
                transition-all duration-150 cursor-pointer
                hover:bg-slate-700/50
                ${isSelected ? 'ring-2 ring-teal-400/50 bg-slate-700/30' : ''}
              `}
              role="option"
              aria-selected={isSelected}
              title={STATUS_DESCRIPTIONS[status]}
            >
              {/* Color swatch */}
              <div
                className={`
                  w-5 h-5 rounded-sm shadow-sm
                  transition-transform duration-150
                  group-hover:scale-110
                  ${isSelected ? 'ring-2 ring-white/30' : ''}
                `}
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              {/* Label */}
              <span className="text-[10px] font-condensed text-slate-300 leading-tight">
                {STATUS_LABELS[status]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clear option */}
      <div className="mt-2 pt-2 border-t border-slate-700/50">
        <button
          onClick={() => onSelect('empty')}
          className="
            w-full text-xs text-slate-400 hover:text-slate-200
            py-1 px-2 rounded hover:bg-slate-700/30
            transition-colors duration-150
          "
        >
          Clear Status
        </button>
      </div>
    </div>
  );
}

export default StatusTooltip;
