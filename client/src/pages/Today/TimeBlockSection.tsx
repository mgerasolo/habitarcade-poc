import * as MuiIcons from '@mui/icons-material';
import type { TimeBlock } from '../../types';

interface TimeBlockSectionProps {
  timeBlocks: TimeBlock[];
  isLoading: boolean;
  onAddTimeBlock: () => void;
}

/**
 * Section displaying today's time blocks schedule
 */
export function TimeBlockSection({
  timeBlocks,
  isLoading,
  onAddTimeBlock,
}: TimeBlockSectionProps) {
  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calculate total duration
  const totalMinutes = timeBlocks.reduce((sum, tb) => sum + tb.durationMinutes, 0);

  // Get priorities completion status
  const getPriorityStatus = (block: TimeBlock) => {
    if (!block.priorities || block.priorities.length === 0) return { completed: 0, total: 0 };
    const completed = block.priorities.filter(p => p.completedAt).length;
    return { completed, total: block.priorities.length };
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Section Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MuiIcons.Schedule className="text-purple-400" style={{ fontSize: 22 }} />
          <h2 className="font-condensed font-semibold text-white">Time Blocks</h2>
        </div>
        {timeBlocks.length > 0 && (
          <span className="text-sm text-slate-400">
            {formatDuration(totalMinutes)} total
          </span>
        )}
      </div>

      {/* Time Blocks List */}
      <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center text-slate-400">
            <MuiIcons.Sync className="animate-spin" style={{ fontSize: 24 }} />
            <p className="mt-2 text-sm">Loading time blocks...</p>
          </div>
        ) : timeBlocks.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <MuiIcons.AccessTime style={{ fontSize: 32 }} />
            <p className="mt-2 text-sm">No time blocks set up</p>
            <button
              onClick={onAddTimeBlock}
              className="mt-3 px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Create time block
            </button>
          </div>
        ) : (
          timeBlocks.map((block) => {
            const { completed, total } = getPriorityStatus(block);
            const hasWork = total > 0;
            const allDone = hasWork && completed === total;

            return (
              <div
                key={block.id}
                className={`
                  p-3 rounded-xl border transition-all
                  ${allDone
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-slate-700/30 border-slate-600/30'
                  }
                `}
              >
                {/* Block header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      ${allDone ? 'bg-purple-500' : 'bg-slate-600'}
                    `}>
                      <MuiIcons.Timer style={{ fontSize: 18, color: 'white' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{block.name}</h3>
                      <span className="text-xs text-slate-400">
                        {formatDuration(block.durationMinutes)}
                      </span>
                    </div>
                  </div>

                  {hasWork && (
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${allDone
                        ? 'bg-purple-500/30 text-purple-300'
                        : 'bg-slate-600 text-slate-300'
                      }
                    `}>
                      {completed}/{total}
                    </span>
                  )}
                </div>

                {/* Priorities preview */}
                {block.priorities && block.priorities.length > 0 && (
                  <div className="space-y-1 mt-2 pl-10">
                    {block.priorities.slice(0, 3).map((priority) => (
                      <div
                        key={priority.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div className={`
                          w-3 h-3 rounded flex items-center justify-center
                          ${priority.completedAt ? 'bg-purple-500' : 'bg-slate-600'}
                        `}>
                          {priority.completedAt && (
                            <MuiIcons.Check style={{ fontSize: 10, color: 'white' }} />
                          )}
                        </div>
                        <span className={`
                          ${priority.completedAt
                            ? 'text-slate-500 line-through'
                            : 'text-slate-300'
                          }
                        `}>
                          {priority.title}
                        </span>
                      </div>
                    ))}
                    {block.priorities.length > 3 && (
                      <span className="text-xs text-slate-500 pl-5">
                        +{block.priorities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Linked habit indicator */}
                {block.linkedHabit && (
                  <div className="flex items-center gap-1 mt-2 pl-10 text-xs text-teal-400">
                    <MuiIcons.Link style={{ fontSize: 12 }} />
                    <span>{block.linkedHabit.name}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Time Block Button */}
      {timeBlocks.length > 0 && (
        <div className="px-3 pb-3">
          <button
            onClick={onAddTimeBlock}
            className="
              w-full flex items-center justify-center gap-2
              py-2 rounded-xl
              text-slate-400 hover:text-purple-400
              bg-slate-700/20 hover:bg-slate-700/40
              transition-colors text-sm
            "
          >
            <MuiIcons.Add style={{ fontSize: 18 }} />
            <span>Add Time Block</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default TimeBlockSection;
