import * as MuiIcons from '@mui/icons-material';
import type { Task } from '../../types';

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  onTaskToggle: (task: Task) => void;
  isLoading: boolean;
  emptyMessage: string;
  icon: keyof typeof MuiIcons;
  variant?: 'default' | 'priority';
}

/**
 * Section displaying tasks with completion toggle
 */
export function TaskSection({
  title,
  tasks,
  onTaskToggle,
  isLoading,
  emptyMessage,
  icon,
  variant = 'default',
}: TaskSectionProps) {
  const IconComponent = MuiIcons[icon] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;

  // Sort tasks: pending first, then by priority, then by sortOrder
  const sortedTasks = [...tasks].sort((a, b) => {
    // Pending tasks first
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1;
    }
    // Then by priority (lower = higher priority)
    if (a.priority !== b.priority) {
      return (a.priority ?? 999) - (b.priority ?? 999);
    }
    // Then by sortOrder
    return a.sortOrder - b.sortOrder;
  });

  const completedCount = tasks.filter(t => t.status === 'complete').length;
  const isPriority = variant === 'priority';

  return (
    <div className={`
      bg-slate-800/50 rounded-2xl border overflow-hidden
      ${isPriority ? 'border-amber-500/30' : 'border-slate-700/50'}
    `}>
      {/* Section Header */}
      <div className={`
        px-4 py-3 border-b flex items-center justify-between
        ${isPriority ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700/50'}
      `}>
        <div className="flex items-center gap-3">
          <IconComponent
            className={isPriority ? 'text-amber-400' : 'text-blue-400'}
            style={{ fontSize: 22 }}
          />
          <h2 className="font-condensed font-semibold text-white">{title}</h2>
        </div>
        {tasks.length > 0 && (
          <span className="text-sm text-slate-400">
            {completedCount}/{tasks.length}
          </span>
        )}
      </div>

      {/* Tasks List */}
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="py-6 text-center text-slate-400">
            <MuiIcons.Sync className="animate-spin" style={{ fontSize: 24 }} />
            <p className="mt-2 text-sm">Loading tasks...</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            <MuiIcons.TaskAlt style={{ fontSize: 28 }} />
            <p className="mt-2 text-sm">{emptyMessage}</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isComplete = task.status === 'complete';

            return (
              <button
                key={task.id}
                onClick={() => onTaskToggle(task)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-150 text-left
                  ${isComplete
                    ? 'bg-slate-700/20 opacity-60'
                    : isPriority
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
                      : 'bg-slate-700/30 hover:bg-slate-700/50'
                  }
                `}
              >
                {/* Checkbox */}
                <div
                  className={`
                    w-5 h-5 rounded-md flex items-center justify-center
                    border-2 transition-all duration-150
                    ${isComplete
                      ? 'bg-teal-500 border-teal-500'
                      : 'border-slate-500 hover:border-teal-400'
                    }
                  `}
                >
                  {isComplete && (
                    <MuiIcons.Check style={{ fontSize: 14, color: 'white' }} />
                  )}
                </div>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <span className={`
                    text-sm block truncate
                    ${isComplete ? 'text-slate-400 line-through' : 'text-white'}
                  `}>
                    {task.title}
                  </span>
                  {task.project && (
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MuiIcons.Folder style={{ fontSize: 12 }} />
                      {task.project.name}
                    </span>
                  )}
                </div>

                {/* Priority badge */}
                {task.priority !== undefined && task.priority <= 2 && !isPriority && (
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${task.priority === 1
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-amber-500/20 text-amber-400'
                    }
                  `}>
                    P{task.priority}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TaskSection;
