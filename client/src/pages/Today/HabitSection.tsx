import * as MuiIcons from '@mui/icons-material';
import type { Habit, HabitStatus } from '../../types';
import { STATUS_COLORS } from '../../types';

interface HabitSectionProps {
  habits: Habit[];
  getHabitTodayStatus: (habit: Habit) => HabitStatus;
  onHabitToggle: (habit: Habit) => void;
  isLoading: boolean;
  onAddHabit: () => void;
}

/**
 * Section displaying today's habits with completion status
 */
export function HabitSection({
  habits,
  getHabitTodayStatus,
  onHabitToggle,
  isLoading,
  onAddHabit,
}: HabitSectionProps) {
  // Calculate completion stats
  const completedCount = habits.filter(h => getHabitTodayStatus(h) === 'complete').length;
  const totalCount = habits.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Section Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MuiIcons.CheckCircle className="text-teal-400" style={{ fontSize: 22 }} />
          <h2 className="font-condensed font-semibold text-white">Today's Habits</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {completedCount}/{totalCount}
          </span>
          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center text-slate-400">
            <MuiIcons.Sync className="animate-spin" style={{ fontSize: 24 }} />
            <p className="mt-2 text-sm">Loading habits...</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <MuiIcons.SentimentSatisfied style={{ fontSize: 32 }} />
            <p className="mt-2 text-sm">No habits yet</p>
            <button
              onClick={onAddHabit}
              className="mt-3 px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
            >
              Create your first habit
            </button>
          </div>
        ) : (
          habits.map((habit) => {
            const status = getHabitTodayStatus(habit);
            const isComplete = status === 'complete';

            return (
              <button
                key={habit.id}
                onClick={() => onHabitToggle(habit)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-150
                  ${isComplete
                    ? 'bg-teal-500/20 border border-teal-500/30'
                    : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                  }
                `}
              >
                {/* Status indicator */}
                <div
                  className={`
                    w-6 h-6 rounded-lg flex items-center justify-center
                    transition-all duration-150
                    ${isComplete ? 'bg-teal-500' : 'bg-slate-600'}
                  `}
                  style={!isComplete && status !== 'empty' ? {
                    backgroundColor: STATUS_COLORS[status]
                  } : undefined}
                >
                  {isComplete ? (
                    <MuiIcons.Check style={{ fontSize: 16, color: 'white' }} />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                  )}
                </div>

                {/* Habit name */}
                <span className={`
                  flex-1 text-left text-sm
                  ${isComplete ? 'text-teal-200 line-through' : 'text-white'}
                `}>
                  {habit.name}
                </span>

                {/* Habit icon if exists */}
                {habit.icon && (
                  <span
                    className="text-lg"
                    style={{ color: habit.iconColor || '#94a3b8' }}
                  >
                    {habit.icon}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Add Habit Button */}
      {habits.length > 0 && (
        <div className="px-3 pb-3">
          <button
            onClick={onAddHabit}
            className="
              w-full flex items-center justify-center gap-2
              py-2 rounded-xl
              text-slate-400 hover:text-teal-400
              bg-slate-700/20 hover:bg-slate-700/40
              transition-colors text-sm
            "
          >
            <MuiIcons.Add style={{ fontSize: 18 }} />
            <span>Add Habit</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default HabitSection;
