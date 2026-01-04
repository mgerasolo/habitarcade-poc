import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { STATUS_COLORS, type HabitStatus } from '../../types';

// Compact status options with short labels - arranged for 4-column grid
const COMPACT_STATUSES: { status: HabitStatus; label: string }[] = [
  { status: 'complete', label: 'Done' },
  { status: 'partial', label: 'Partial' },
  { status: 'missed', label: 'Missed' },
  { status: 'extra', label: 'Extra' },
  { status: 'exempt', label: 'Exempt' },
  { status: 'na', label: 'N/A' },
  { status: 'pink', label: 'Pink' },
  { status: 'empty', label: 'Clear' },
];

interface StatusTooltipProps {
  currentStatus: HabitStatus;
  onSelect: (status: HabitStatus) => void;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  position?: 'above' | 'below';
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}

export function StatusTooltip({
  currentStatus,
  onSelect,
  onClose,
  onMouseEnter,
  onMouseLeave,
  position = 'below',
  anchorRef,
}: StatusTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Calculate position based on anchor element
  useLayoutEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const tooltipHeight = 90; // Compact tooltip is much shorter
      const tooltipWidth = 180;

      // Calculate left position (centered on anchor)
      let left = rect.left + rect.width / 2;

      // Calculate top position based on above/below
      let top: number;
      if (position === 'above') {
        top = rect.top - tooltipHeight - 8;
      } else {
        top = rect.bottom + 8;
      }

      // Keep tooltip within viewport horizontally
      if (left - tooltipWidth / 2 < 10) {
        left = tooltipWidth / 2 + 10;
      } else if (left + tooltipWidth / 2 > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth / 2 - 10;
      }

      // Keep tooltip within viewport vertically
      if (top < 10) {
        top = 10;
      } else if (top + tooltipHeight > window.innerHeight - 10) {
        top = window.innerHeight - tooltipHeight - 10;
      }

      setCoords({ top, left });
    }
  }, [anchorRef, position]);

  // Close on click outside and Escape key
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

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!coords) {
    return null;
  }

  const tooltipContent = (
    <div
      ref={tooltipRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-50%)',
        zIndex: 2147483647,
      }}
      className="
        bg-slate-900 rounded-lg shadow-2xl
        border border-slate-700/50
        p-1.5 overflow-hidden
        animate-in fade-in duration-100
      "
      data-testid="status-tooltip"
      role="listbox"
      aria-label="Select habit status"
    >
      {/* Compact 4-column grid of status options (#77) */}
      <div
        className="grid grid-cols-4 gap-0.5"
        data-testid="status-options-grid"
      >
        {COMPACT_STATUSES.map(({ status, label }) => {
          const isSelected = status === currentStatus;
          const statusColor = STATUS_COLORS[status];

          return (
            <button
              key={status}
              onClick={() => onSelect(status)}
              className={`
                flex flex-col items-center gap-0.5 p-1.5 rounded
                transition-all duration-100 cursor-pointer
                hover:bg-slate-700/60
                ${isSelected ? 'bg-slate-700/80 ring-1 ring-teal-400/50' : ''}
              `}
              role="option"
              aria-selected={isSelected}
              aria-label={label}
              title={label}
            >
              {/* Color square */}
              <div
                className={`
                  w-5 h-5 rounded-sm flex-shrink-0
                  ${status === 'empty' ? 'border border-slate-500' : ''}
                  ${isSelected ? 'ring-2 ring-teal-400' : ''}
                `}
                style={{ backgroundColor: statusColor }}
                data-testid="status-color-square"
              />

              {/* Short label */}
              <span className={`
                text-[9px] font-medium leading-tight text-center
                ${isSelected ? 'text-teal-300' : 'text-slate-400'}
              `}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return createPortal(tooltipContent, document.body);
}

export default StatusTooltip;
