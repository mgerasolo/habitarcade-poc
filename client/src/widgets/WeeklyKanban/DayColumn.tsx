import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { format, isWeekend } from 'date-fns';
import { TaskCard } from './TaskCard';
import { QuickAdd } from './QuickAdd';
import type { Task } from '../../types';

interface DayColumnProps {
  date: Date;
  tasks: Task[];
  isToday: boolean;
  onEditTask: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
}

export function DayColumn({
  date,
  tasks,
  isToday,
  onEditTask,
  onToggleComplete,
}: DayColumnProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayName = format(date, 'EEE');
  const dayNum = format(date, 'd');
  const weekend = isWeekend(date);

  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  const completedCount = tasks.filter((t) => t.status === 'complete').length;
  const totalCount = tasks.length;

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col rounded-lg overflow-hidden transition-all duration-200
        ${isToday
          ? 'bg-gradient-to-b from-teal-900/50 to-slate-800/90 ring-2 ring-teal-500/50 shadow-lg shadow-teal-500/10'
          : weekend
            ? 'bg-slate-800/40'
            : 'bg-slate-800/60'
        }
        ${isOver ? 'ring-2 ring-teal-400 bg-teal-900/30' : ''}
      `}
    >
      {/* Column header */}
      <div
        className={`
          px-2 py-2 text-center border-b flex-shrink-0
          ${isToday
            ? 'border-teal-600/50 bg-teal-800/30'
            : 'border-slate-700/50'
          }
        `}
      >
        <div
          className={`
            text-xs font-semibold uppercase tracking-wider font-condensed
            ${isToday ? 'text-teal-300' : weekend ? 'text-slate-500' : 'text-slate-400'}
          `}
        >
          {dayName}
        </div>
        <div
          className={`
            text-lg font-bold font-condensed
            ${isToday
              ? 'text-teal-100'
              : weekend
                ? 'text-slate-400'
                : 'text-slate-200'
            }
          `}
        >
          {dayNum}
        </div>
        {totalCount > 0 && (
          <div
            className={`
              text-xs font-condensed
              ${completedCount === totalCount
                ? 'text-emerald-400'
                : 'text-slate-500'
              }
            `}
          >
            {completedCount}/{totalCount}
          </div>
        )}
      </div>

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto min-h-0 p-1.5 space-y-1.5">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onToggleComplete={() => onToggleComplete(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="text-center py-4 text-slate-600 text-xs">
            No tasks
          </div>
        )}
      </div>

      {/* Quick add */}
      <div className="flex-shrink-0 p-1.5 border-t border-slate-700/30">
        <QuickAdd plannedDate={dateStr} />
      </div>
    </div>
  );
}

export default DayColumn;
