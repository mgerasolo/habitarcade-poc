import { useState, useRef } from 'react';
import type { ParkingLotItem } from '../../types';

interface CapturedItemProps {
  item: ParkingLotItem;
  onDelete: () => void;
  onConvertToTask: (plannedDate?: string) => void;
  isDeleting?: boolean;
  isConverting?: boolean;
}

/**
 * CapturedItem - Individual parking lot item display
 *
 * Features:
 * - Display captured content
 * - Delete button (X) - soft delete, no confirmation
 * - Draggable for scheduling (drag to calendar)
 * - Convert to task option
 * - Timestamp display
 */
export function CapturedItem({
  item,
  onDelete,
  onConvertToTask,
  isDeleting = false,
  isConverting = false,
}: CapturedItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const isLoading = isDeleting || isConverting;

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle drag start for scheduling
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'parking-lot-item',
      id: item.id,
      content: item.content,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Quick convert to task for today
  const handleQuickConvert = () => {
    const today = new Date().toISOString().split('T')[0];
    onConvertToTask(today);
  };

  return (
    <div
      ref={itemRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        group relative
        px-3 py-2.5
        bg-slate-700/30 hover:bg-slate-700/50
        border border-slate-600/30 hover:border-slate-600/50
        rounded-lg
        cursor-grab active:cursor-grabbing
        transition-all duration-150
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Drag indicator */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
        <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex items-start gap-2 ml-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 break-words line-clamp-3">
            {item.content}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>

        {/* Action buttons */}
        <div
          className={`
            flex items-center gap-1 flex-shrink-0
            transition-opacity duration-150
            ${showActions || isLoading ? 'opacity-100' : 'opacity-0'}
          `}
        >
          {/* Convert to task button */}
          <button
            onClick={handleQuickConvert}
            disabled={isLoading}
            title="Convert to task for today"
            className="
              p-1.5 rounded
              text-slate-400 hover:text-teal-400
              hover:bg-teal-500/10
              transition-colors duration-150
              disabled:opacity-50
            "
          >
            {isConverting ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            )}
          </button>

          {/* Delete button */}
          <button
            onClick={onDelete}
            disabled={isLoading}
            title="Delete item"
            className="
              p-1.5 rounded
              text-slate-400 hover:text-red-400
              hover:bg-red-500/10
              transition-colors duration-150
              disabled:opacity-50
            "
          >
            {isDeleting ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Drag hint overlay */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-teal-500/10 rounded-lg border-2 border-dashed border-teal-500/50">
          <span className="text-xs text-teal-400 font-medium">
            Drop on calendar to schedule
          </span>
        </div>
      )}
    </div>
  );
}

export default CapturedItem;
