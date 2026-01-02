import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';

export type TaskViewMode = 'compact' | 'detailed';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onToggleComplete: () => void;
  isDragging?: boolean;
  viewMode?: TaskViewMode;
}

export function TaskCard({
  task,
  onEdit,
  onToggleComplete,
  isDragging = false,
  viewMode = 'detailed',
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isComplete = task.status === 'complete';
  const projectColor = task.project?.color || task.project?.iconColor || '#6366f1';

  const handleClick = (e: React.MouseEvent) => {
    // Only toggle if clicking the card body, not the checkbox
    if ((e.target as HTMLElement).closest('[data-checkbox]')) {
      return;
    }
    onToggleComplete();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit();
  };

  // Compact view - minimal single line
  if (viewMode === 'compact') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`
          group relative flex items-center gap-2 px-2 py-1 rounded cursor-grab active:cursor-grabbing
          transition-all duration-150
          ${isDragging || isSortableDragging
            ? 'opacity-90 shadow-lg shadow-teal-500/20 scale-102 z-50 bg-slate-600/80'
            : ''
          }
          ${isComplete
            ? 'bg-slate-700/20'
            : 'bg-slate-700/40 hover:bg-slate-700/60'
          }
        `}
      >
        {/* Priority dot */}
        {task.priority && task.priority > 0 && (
          <div
            className={`
              flex-shrink-0 w-1.5 h-1.5 rounded-full
              ${task.priority >= 3
                ? 'bg-red-500'
                : task.priority === 2
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }
            `}
          />
        )}

        {/* Checkbox */}
        <button
          data-checkbox
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`
            flex-shrink-0 w-3.5 h-3.5 rounded border transition-all duration-200
            flex items-center justify-center
            ${isComplete
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-500 hover:border-teal-400'
            }
          `}
        >
          {isComplete && (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Title */}
        <span
          className={`
            flex-1 text-[11px] font-medium truncate font-condensed
            ${isComplete
              ? 'text-slate-500 line-through'
              : 'text-slate-200'
            }
          `}
        >
          {task.title}
        </span>

        {/* Project indicator (color dot only) */}
        {task.project && (
          <div
            className="flex-shrink-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: projectColor }}
            title={task.project.name}
          />
        )}

        {/* Edit on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-white transition-opacity"
          title="Edit task"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    );
  }

  // Detailed view (default) - full card with all info
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        group relative rounded-md cursor-grab active:cursor-grabbing
        transition-all duration-150
        ${isDragging || isSortableDragging
          ? 'opacity-90 shadow-xl shadow-teal-500/20 scale-105 z-50'
          : ''
        }
        ${isComplete
          ? 'bg-slate-700/30'
          : 'bg-gradient-to-br from-slate-700/70 to-slate-700/50 hover:from-slate-600/70 hover:to-slate-600/50'
        }
        ${!isDragging && !isSortableDragging
          ? 'hover:shadow-md hover:shadow-slate-900/50 hover:-translate-y-0.5'
          : ''
        }
      `}
    >
      {/* Priority indicator */}
      {task.priority && task.priority > 0 && (
        <div
          className={`
            absolute left-0 top-0 bottom-0 w-1 rounded-l-md
            ${task.priority >= 3
              ? 'bg-red-500'
              : task.priority === 2
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }
          `}
        />
      )}

      <div className="px-2 py-1.5">
        {/* Task content row */}
        <div className="flex items-start gap-1.5">
          {/* Checkbox */}
          <button
            data-checkbox
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            className={`
              flex-shrink-0 w-4 h-4 mt-0.5 rounded border-2 transition-all duration-200
              flex items-center justify-center
              ${isComplete
                ? 'bg-emerald-500 border-emerald-500 text-white'
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

          {/* Title */}
          <span
            className={`
              flex-1 text-xs font-medium leading-tight font-condensed line-clamp-2
              ${isComplete
                ? 'text-slate-500 line-through'
                : 'text-slate-100'
              }
            `}
          >
            {task.title}
          </span>
        </div>

        {/* Description preview in detailed mode */}
        {task.description && (
          <p className="mt-1 ml-5 text-[10px] text-slate-400 line-clamp-2 leading-tight">
            {task.description}
          </p>
        )}

        {/* Project badge */}
        {task.project && (
          <div className="mt-1 flex items-center gap-1 ml-5">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                backgroundColor: `${projectColor}20`,
                color: projectColor,
              }}
            >
              {task.project.icon && (
                <span className="text-[10px]">{task.project.icon}</span>
              )}
              <span className="truncate max-w-[60px]">{task.project.name}</span>
            </span>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-0.5 ml-5">
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="px-1 py-0.5 rounded text-[9px] font-medium"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : '#6b728020',
                  color: tag.color || '#9ca3af',
                }}
              >
                {tag.name}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[9px] text-slate-500">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Edit button on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={`
          absolute top-1 right-1 p-1 rounded
          opacity-0 group-hover:opacity-100 transition-opacity
          bg-slate-600/80 hover:bg-slate-500 text-slate-300 hover:text-white
        `}
        title="Edit task"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </button>
    </div>
  );
}

export default TaskCard;
