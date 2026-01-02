import { HabitMatrix } from '../../widgets/HabitMatrix';

/**
 * Habits Page - Full-width Habit Matrix display
 *
 * A clean, focused view for habit tracking that displays only
 * the HabitMatrix widget at full width with maximum vertical density.
 * Optimized to fit all habits on screen without scrolling at 1920x1080.
 */
export function Habits() {
  return (
    <div className="h-full flex flex-col" data-testid="habits-page">
      {/* Full-width Habit Matrix - compact vertical mode for max density */}
      <div className="flex-1 p-2 overflow-hidden">
        <div className="h-full bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden p-2">
          <HabitMatrix className="h-full" compactVertical />
        </div>
      </div>
    </div>
  );
}

export default Habits;
