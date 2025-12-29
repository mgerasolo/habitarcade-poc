import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TimeBlockPriority } from '../../types';

interface PriorityItemProps {
  priority: TimeBlockPriority;
  onToggleComplete: (priorityId: string) => void;
  onDelete: (priorityId: string) => void;
  isDragging?: boolean;
}

export function PriorityItem({
  priority,
  onToggleComplete,
  onDelete,
  isDragging: externalDragging = false,
}: PriorityItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priority.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isComplete = !!priority.completedAt;
  const draggingState = isDragging || externalDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-lg
        transition-all duration-150
        ${draggingState
          ? 'opacity-90 shadow-lg shadow-teal-500/20 scale-105 z-50 bg-slate-700'
          : 'bg-slate-700/50 hover:bg-slate-700/70'
        }
        ${isComplete ? 'opacity-60' : ''}
      `}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </svg>
      </div>

      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(priority.id)}
        className={`
          flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200
          flex items-center justify-center
          ${isComplete
            ? 'bg-teal-500 border-teal-500 text-white'
            : 'border-slate-500 hover:border-teal-400 hover:bg-teal-500/10'
          }
        `}
      >
        {isComplete && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Priority title */}
      <span
        className={`
          flex-1 text-sm font-medium font-condensed
          ${isComplete
            ? 'text-slate-500 line-through'
            : 'text-slate-200'
          }
        `}
      >
        {priority.title}
      </span>

      {/* Delete button - visible on hover */}
      <button
        onClick={() => onDelete(priority.id)}
        className={`
          flex-shrink-0 p-1 rounded transition-all duration-150
          opacity-0 group-hover:opacity-100
          text-slate-500 hover:text-red-400 hover:bg-red-500/10
        `}
        title="Delete priority"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default PriorityItem;
