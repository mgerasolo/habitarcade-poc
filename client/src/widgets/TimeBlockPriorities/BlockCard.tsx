import { useState, useCallback } from 'react';
import { Timer } from './Timer';
import { PriorityList } from './PriorityList';
import { useTimerStore } from '../../stores';
import type { TimeBlock, Habit } from '../../types';

interface BlockCardProps {
  block: TimeBlock;
  linkedHabit?: Habit;
  onEdit: (block: TimeBlock) => void;
  onDelete: (blockId: string) => void;
}

export function BlockCard({
  block,
  linkedHabit,
  onEdit,
  onDelete,
}: BlockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeBlockId = useTimerStore((state) => state.activeBlockId);

  const isActiveTimer = activeBlockId === block.id;
  const priorityCount = block.priorities?.length ?? 0;
  const completedCount = block.priorities?.filter((p) => p.completedAt).length ?? 0;

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(block);
  }, [block, onEdit]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this time block?')) {
      onDelete(block.id);
    }
  }, [block.id, onDelete]);

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        ${isActiveTimer
          ? 'bg-gradient-to-br from-slate-800/90 to-teal-900/30 border-2 border-teal-500/50 shadow-lg shadow-teal-500/20'
          : 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50'
        }
      `}
    >
      {/* Card header - clickable to expand */}
      <div
        onClick={handleToggleExpand}
        className="flex items-center gap-4 p-4 cursor-pointer"
      >
        {/* Timer section */}
        <div className="flex-shrink-0">
          <Timer
            blockId={block.id}
            durationMinutes={block.durationMinutes}
            linkedHabitId={block.linkedHabitId}
          />
        </div>

        {/* Block info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-white font-condensed truncate">
                {block.name}
              </h3>

              {/* Linked habit badge */}
              {linkedHabit && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-400">Linked to:</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-medium">
                    {linkedHabit.icon && (
                      <span className="text-xs">{linkedHabit.icon}</span>
                    )}
                    {linkedHabit.name}
                  </span>
                </div>
              )}

              {/* Priority summary */}
              {priorityCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>{completedCount}/{priorityCount} priorities</span>
                  </div>

                  {/* Mini progress bar */}
                  <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${priorityCount > 0 ? (completedCount / priorityCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Edit button */}
              <button
                onClick={handleEditClick}
                className="
                  p-2 rounded-lg
                  text-slate-400 hover:text-white hover:bg-slate-700/50
                  transition-colors duration-150
                "
                title="Edit time block"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Delete button */}
              <button
                onClick={handleDeleteClick}
                className="
                  p-2 rounded-lg
                  text-slate-400 hover:text-red-400 hover:bg-red-500/10
                  transition-colors duration-150
                "
                title="Delete time block"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Expand/collapse indicator */}
              <button
                className={`
                  p-2 rounded-lg
                  text-slate-400 hover:text-white hover:bg-slate-700/50
                  transition-all duration-200
                  ${isExpanded ? 'rotate-180' : ''}
                `}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable priority list */}
      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 pb-4 border-t border-slate-700/50">
          <PriorityList blockId={block.id} isExpanded={isExpanded} />
        </div>
      </div>

      {/* Active timer glow effect */}
      {isActiveTimer && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/30 to-transparent" />
        </div>
      )}
    </div>
  );
}

export default BlockCard;
