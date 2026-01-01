import * as MuiIcons from '@mui/icons-material';

/**
 * Targets Page - Goal tracking and milestone management
 *
 * Features (planned):
 * - Set measurable targets for habits/tasks
 * - Track progress toward goals
 * - Define milestones and deadlines
 * - Visualize progress over time
 */
export function Targets() {
  return (
    <div className="p-6" data-testid="targets-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
          <MuiIcons.TrackChanges style={{ color: 'white', fontSize: 24 }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Targets</h1>
          <p className="text-sm text-slate-400">Set and track your goals</p>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
        <MuiIcons.TrackChanges
          style={{ fontSize: 64, opacity: 0.3 }}
          className="mx-auto mb-4 text-purple-400"
        />
        <h2 className="text-xl font-semibold text-white mb-2">
          Targets Coming Soon
        </h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Set measurable goals, track your progress, and celebrate achievements.
          Define milestones for your habits and tasks to stay motivated.
        </p>

        {/* Feature preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <MuiIcons.Flag className="text-purple-400 mb-2" style={{ fontSize: 32 }} />
            <h3 className="text-white font-medium mb-1">Goal Setting</h3>
            <p className="text-sm text-slate-400">Define clear, measurable targets</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <MuiIcons.TrendingUp className="text-green-400 mb-2" style={{ fontSize: 32 }} />
            <h3 className="text-white font-medium mb-1">Progress Tracking</h3>
            <p className="text-sm text-slate-400">Visualize your journey</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <MuiIcons.EmojiEvents className="text-amber-400 mb-2" style={{ fontSize: 32 }} />
            <h3 className="text-white font-medium mb-1">Achievements</h3>
            <p className="text-sm text-slate-400">Celebrate milestones</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Targets;
