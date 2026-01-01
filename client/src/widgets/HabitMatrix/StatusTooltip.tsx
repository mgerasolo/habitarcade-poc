import { useEffect, useRef } from 'react';
import { STATUS_COLORS, type HabitStatus } from '../../types';

// Core statuses for the tooltip (2x3 grid layout)
const TOOLTIP_STATUSES: HabitStatus[] = [
  'empty', 'complete', 'missed',
  'partial', 'na', 'exempt',
];

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

      {/* Status grid - 2 rows x 3 columns */}
      <div className="grid grid-cols-3 gap-1">
        {TOOLTIP_STATUSES.map((status) => {
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
              title={STATUS_LABELS[status]}
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
    </div>
  );
}

export default StatusTooltip;
