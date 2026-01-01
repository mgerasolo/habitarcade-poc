import { HabitMatrix } from '../../widgets/HabitMatrix';

/**
 * Habits Page - Full-width Habit Matrix display
 *
 * A clean, focused view for habit tracking that displays only
 * the HabitMatrix widget at full width.
 */
export function Habits() {
  return (
    <div className="h-full flex flex-col" data-testid="habits-page">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-slate-700/50">
        <h1 className="text-2xl font-condensed font-bold text-white">
          Habit Matrix
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Track your daily habits and build lasting streaks
        </p>
      </div>

      {/* Full-width Habit Matrix */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
          <HabitMatrix className="h-full" />
        </div>
      </div>
    </div>
  );
}

export default Habits;
