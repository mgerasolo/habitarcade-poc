import { useState } from 'react';
import * as MuiIcons from '@mui/icons-material';

interface Target {
  id: string;
  name: string;
  type: 'numeric' | 'completion' | 'streak';
  currentValue: number;
  targetValue: number;
  unit?: string;
  deadline?: string;
  color: string;
}

// Mock data - will be replaced with API calls
const MOCK_TARGETS: Target[] = [
  {
    id: '1',
    name: 'Read 24 Books',
    type: 'numeric',
    currentValue: 8,
    targetValue: 24,
    unit: 'books',
    deadline: '2026-12-31',
    color: '#14b8a6',
  },
  {
    id: '2',
    name: 'Save $5000',
    type: 'numeric',
    currentValue: 2150,
    targetValue: 5000,
    unit: '$',
    deadline: '2026-06-30',
    color: '#22c55e',
  },
  {
    id: '3',
    name: '30-Day Meditation Streak',
    type: 'streak',
    currentValue: 12,
    targetValue: 30,
    unit: 'days',
    color: '#8b5cf6',
  },
  {
    id: '4',
    name: 'Complete Marathon',
    type: 'completion',
    currentValue: 0,
    targetValue: 1,
    deadline: '2026-09-15',
    color: '#f59e0b',
  },
];

function TargetCard({ target }: { target: Target }) {
  const progress = Math.min((target.currentValue / target.targetValue) * 100, 100);
  const isComplete = target.currentValue >= target.targetValue;

  const getStatusColor = () => {
    if (isComplete) return 'text-green-400';
    if (progress >= 75) return 'text-teal-400';
    if (progress >= 50) return 'text-yellow-400';
    if (progress >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${target.color}20` }}
          >
            {target.type === 'streak' ? (
              <MuiIcons.LocalFireDepartment style={{ color: target.color, fontSize: 24 }} />
            ) : target.type === 'completion' ? (
              <MuiIcons.Flag style={{ color: target.color, fontSize: 24 }} />
            ) : (
              <MuiIcons.TrackChanges style={{ color: target.color, fontSize: 24 }} />
            )}
          </div>
          <div>
            <h3 className="font-medium text-white">{target.name}</h3>
            {target.deadline && (
              <p className="text-xs text-slate-400">
                Due: {new Date(target.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        {isComplete && (
          <MuiIcons.CheckCircle className="text-green-400" style={{ fontSize: 24 }} />
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: target.color,
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className={getStatusColor()}>
          {target.unit === '$' ? `$${target.currentValue.toLocaleString()}` : target.currentValue}
          {target.unit && target.unit !== '$' ? ` ${target.unit}` : ''}
        </span>
        <span className="text-slate-400">
          / {target.unit === '$' ? `$${target.targetValue.toLocaleString()}` : target.targetValue}
          {target.unit && target.unit !== '$' ? ` ${target.unit}` : ''}
        </span>
        <span className={`font-medium ${getStatusColor()}`}>
          {progress.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function Targets() {
  const [targets] = useState<Target[]>(MOCK_TARGETS);

  const completedCount = targets.filter(t => t.currentValue >= t.targetValue).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MuiIcons.TrackChanges style={{ fontSize: 32 }} className="text-teal-400" />
            Targets
          </h1>
          <p className="text-slate-400 mt-1">
            {completedCount} of {targets.length} targets completed
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          New Target
        </button>
      </div>

      {/* Target grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.map(target => (
          <TargetCard key={target.id} target={target} />
        ))}
      </div>

      {/* Empty state */}
      {targets.length === 0 && (
        <div className="text-center py-12">
          <MuiIcons.TrackChanges style={{ fontSize: 64 }} className="text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-2">No targets yet</h3>
          <p className="text-slate-500 mb-4">Create your first target to start tracking progress</p>
          <button className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors">
            Create Target
          </button>
        </div>
      )}
    </div>
  );
}

export default Targets;
