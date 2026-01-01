import * as MuiIcons from '@mui/icons-material';

/**
 * Time Blocks Page - Time blocking and schedule management
 *
 * Features (planned):
 * - Create time blocks for focused work
 * - Assign tasks to specific time slots
 * - Daily/weekly schedule visualization
 * - Integration with habits and tasks
 */
export function TimeBlocks() {
  return (
    <div className="p-6" data-testid="time-blocks-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <MuiIcons.Schedule style={{ color: 'white', fontSize: 24 }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Time Blocks</h1>
          <p className="text-sm text-slate-400">Plan and protect your time</p>
        </div>
      </div>

      {/* Placeholder content */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
        <MuiIcons.Schedule
          style={{ fontSize: 64, opacity: 0.3 }}
          className="mx-auto mb-4 text-blue-400"
        />
        <h2 className="text-xl font-semibold text-white mb-2">
          Time Blocks Coming Soon
        </h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Block out focused work time, schedule your priorities, and protect
          your most productive hours. Integrated with your tasks and habits.
        </p>

        {/* Feature preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <MuiIcons.ViewTimeline className="text-blue-400 mb-2" style={{ fontSize: 32 }} />
            <h3 className="text-white font-medium mb-1">Schedule View</h3>
            <p className="text-sm text-slate-400">Visual daily timeline</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <MuiIcons.Timer className="text-teal-400 mb-2" style={{ fontSize: 32 }} />
            <h3 className="text-white font-medium mb-1">Focus Time</h3>
            <p className="text-sm text-slate-400">Protected work blocks</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <MuiIcons.Link className="text-amber-400 mb-2" style={{ fontSize: 32 }} />
            <h3 className="text-white font-medium mb-1">Task Integration</h3>
            <p className="text-sm text-slate-400">Link tasks to time slots</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeBlocks;
