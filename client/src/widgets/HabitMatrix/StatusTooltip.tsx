import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { STATUS_COLORS, type HabitStatus } from '../../types';

// Ordered statuses for the dropdown list (priority order like task priority selector)
const TOOLTIP_STATUSES: { status: HabitStatus; label: string; description: string }[] = [
  { status: 'complete', label: 'Done', description: 'Completed successfully' },
  { status: 'missed', label: 'Missed', description: 'Failed to complete' },
  { status: 'partial', label: 'Partial', description: 'Partially completed' },
  { status: 'exempt', label: 'Exempt', description: 'Excused from this day' },
  { status: 'na', label: 'N/A', description: 'Not applicable' },
  { status: 'extra', label: 'Extra', description: 'Bonus completion' },
  { status: 'pink', label: 'Likely Missed', description: 'Probably missed but not confirmed' },
  { status: 'empty', label: 'Clear', description: 'Remove status' },
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
  // Uses viewport-relative coordinates for position: fixed
  useLayoutEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const tooltipHeight = 420; // Approximate tooltip height (larger with descriptions)

      // Calculate left position (centered on anchor) - viewport relative
      let left = rect.left + rect.width / 2;

      // Calculate top position based on above/below - viewport relative
      let top: number;
      if (position === 'above') {
        top = rect.top - tooltipHeight - 8;
      } else {
        top = rect.bottom + 8;
      }

      // Keep tooltip within viewport horizontally
      const tooltipWidth = 200; // Wider for shadcn-style design
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

    // Use setTimeout to avoid immediate close from the same click that opened it
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

  // Don't render until we have calculated coordinates (prevents flying in from 0,0)
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
        bg-slate-950 rounded-lg shadow-2xl
        border border-slate-700/50
        min-w-[180px] overflow-hidden
        animate-in fade-in duration-150
      "
      data-testid="status-tooltip"
      role="listbox"
      aria-label="Select habit status"
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-800/80 bg-slate-900/50">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
      </div>

      {/* Status list - shadcn priority selector style */}
      <div className="py-1">
        {TOOLTIP_STATUSES.map(({ status, label, description }) => {
          const isSelected = status === currentStatus;
          const statusColor = STATUS_COLORS[status];

          return (
            <button
              key={status}
              onClick={() => onSelect(status)}
              className={`
                w-full flex items-center gap-3 px-3 py-2
                transition-all duration-150 cursor-pointer
                hover:bg-slate-800/80
                ${isSelected ? 'bg-slate-800/60' : ''}
                group relative
              `}
              role="option"
              aria-selected={isSelected}
            >
              {/* Colored indicator bar on left side */}
              <div
                className="w-1 h-8 rounded-full flex-shrink-0 transition-all duration-150 group-hover:h-9"
                style={{ backgroundColor: statusColor }}
              />

              {/* Color dot indicator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-slate-700/50"
                style={{ backgroundColor: statusColor }}
              />

              {/* Label and description */}
              <div className="flex-1 text-left min-w-0">
                <span className={`
                  block text-sm leading-tight
                  ${isSelected ? 'text-white font-semibold' : 'text-slate-200 font-medium'}
                `}>
                  {label}
                </span>
                <span className="block text-xs text-slate-500 truncate mt-0.5">
                  {description}
                </span>
              </div>

              {/* Check mark for selected */}
              {isSelected && (
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/30">
        <span className="text-xs text-slate-500">Click to select or Esc to close</span>
      </div>
    </div>
  );

  // Render via portal to escape all parent overflow constraints
  return createPortal(tooltipContent, document.body);
}

export default StatusTooltip;
