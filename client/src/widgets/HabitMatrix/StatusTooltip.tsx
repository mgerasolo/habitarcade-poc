import { useEffect, useRef } from 'react';
import { STATUS_COLORS, type HabitStatus } from '../../types';

// Ordered statuses for the dropdown list with priority indicators
const TOOLTIP_STATUSES: { status: HabitStatus; icon: string }[] = [
  { status: 'complete', icon: '✓' },
  { status: 'extra', icon: '★' },
  { status: 'partial', icon: '◐' },
  { status: 'trending', icon: '↗' },
  { status: 'missed', icon: '✗' },
  { status: 'exempt', icon: '∅' },
  { status: 'na', icon: '—' },
  { status: 'pink', icon: '●' },
  { status: 'empty', icon: '○' },
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
        bg-slate-900 rounded-lg shadow-xl
        border border-slate-600 py-1
        min-w-[140px] animate-in fade-in zoom-in-95 duration-150
      `}
      role="listbox"
      aria-label="Select habit status"
    >
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-slate-700">
        <span className="text-xs font-medium text-slate-400">Habit status</span>
      </div>

      {/* Status list */}
      <div className="py-1">
        {TOOLTIP_STATUSES.map(({ status, icon }) => {
          const isSelected = status === currentStatus;
          return (
            <button
              key={status}
              onClick={() => onSelect(status)}
              className={`
                w-full flex items-center gap-2 px-3 py-1.5
                transition-colors duration-100 cursor-pointer
                hover:bg-slate-700/60
                ${isSelected ? 'bg-slate-700/40' : ''}
              `}
              role="option"
              aria-selected={isSelected}
            >
              {/* Priority indicator icon with color */}
              <span
                className="text-sm w-4 flex-shrink-0 text-center"
                style={{ color: STATUS_COLORS[status] }}
              >
                {icon}
              </span>
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              {/* Label */}
              <span className={`text-sm flex-1 text-left ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                {STATUS_LABELS[status]}
              </span>
              {/* Check mark for selected */}
              {isSelected && (
                <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default StatusTooltip;
