import { useState } from 'react';
import { useUIStore } from '../../stores';
import type { ParkingLotItem } from '../../types';

interface CapturedItemProps {
  item: ParkingLotItem;
  onDelete: () => void;
  onConvertToTask: (plannedDate?: string, projectId?: string) => void;
  onContextMenu: (e: React.MouseEvent, itemId: string) => void;
  isDeleting?: boolean;
  isConverting?: boolean;
}

/**
 * CapturedItem - Simple 1-line todo item with checkbox
 *
 * Features:
 * - Single line checkbox todo
 * - Hover action buttons: delete, edit, details (far right)
 * - Right-click opens project selection menu
 * - Convert to task on checkbox click
 */
export function CapturedItem({
  item,
  onDelete,
  onConvertToTask,
  onContextMenu,
  isDeleting = false,
  isConverting = false,
}: CapturedItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { openModal } = useUIStore();

  const isLoading = isDeleting || isConverting;

  // Quick convert to task for today
  const handleCheckboxClick = () => {
    const today = new Date().toISOString().split('T')[0];
    onConvertToTask(today);
  };

  const handleEdit = () => {
    openModal('parking-lot-item', { item, mode: 'edit' });
  };

  const handleDetails = () => {
    openModal('parking-lot-item', { item, mode: 'details' });
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, item.id);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleRightClick}
      className={`
        group flex items-center gap-2 px-2 py-1.5
        hover:bg-slate-700/30 rounded
        transition-colors duration-100
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckboxClick}
        disabled={isLoading}
        className="flex-shrink-0 w-4 h-4 rounded border border-slate-500 hover:border-teal-400
                   flex items-center justify-center transition-colors"
        title="Mark as done"
      >
        {isConverting && (
          <svg className="animate-spin w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </button>

      {/* Content - single line truncated */}
      <span className="flex-1 text-sm text-slate-200 truncate min-w-0">
        {item.content}
      </span>

      {/* Action buttons - appear on hover */}
      <div
        className={`
          flex items-center gap-0.5 flex-shrink-0
          transition-opacity duration-100
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {/* Details button */}
        <button
          onClick={handleDetails}
          disabled={isLoading}
          title="View details"
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-600/50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Edit button */}
        <button
          onClick={handleEdit}
          disabled={isLoading}
          title="Edit"
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-600/50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={onDelete}
          disabled={isLoading}
          title="Delete"
          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          {isDeleting ? (
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default CapturedItem;
