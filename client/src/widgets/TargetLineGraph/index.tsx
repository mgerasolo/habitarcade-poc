import { useState } from 'react';
import {
  useMeasurements,
  useMeasurementEntries,
  useMeasurementTargets,
} from '../../api';
import { Chart } from './Chart';
import { QuickEntry } from './QuickEntry';
import { TargetConfig } from './TargetConfig';
import type { Measurement, MeasurementEntry, MeasurementTarget } from '../../types';

interface TargetLineGraphProps {
  /** Custom class name */
  className?: string;
}

/**
 * TargetLineGraph - Progress tracking widget with multiple objectives
 *
 * Features:
 * - Lists all measurements with active targets as collapsible rows
 * - Each row shows objective name, current value, progress
 * - Expanded view shows chart and quick entry
 * - Add new objective button
 */
export function TargetLineGraph({ className = '' }: TargetLineGraphProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | undefined>();
  const [editingTarget, setEditingTarget] = useState<MeasurementTarget | undefined>();

  // Fetch all measurements
  const { data: measurements, isLoading: measurementsLoading } = useMeasurements();
  const measurementList = measurements?.data || [];

  // Filter to only those with targets (we'll fetch targets for expanded one)
  const measurementsWithTargets = measurementList.filter(
    (m: Measurement) => m.targets && m.targets.length > 0
  );

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleConfigure = (measurement?: Measurement, target?: MeasurementTarget) => {
    setEditingMeasurement(measurement);
    setEditingTarget(target);
    setShowConfig(true);
  };

  const handleCloseConfig = () => {
    setShowConfig(false);
    setEditingMeasurement(undefined);
    setEditingTarget(undefined);
  };

  // Loading state
  if (measurementsLoading) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  // No objectives configured
  if (measurementsWithTargets.length === 0) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <EmptyState onConfigure={() => handleConfigure()} />
        {showConfig && (
          <TargetConfig
            measurement={undefined}
            currentTarget={undefined}
            onClose={handleCloseConfig}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col overflow-hidden ${className}`}>
      {/* Scrollable list of objectives */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {measurementsWithTargets.map((measurement: Measurement) => (
          <ObjectiveRow
            key={measurement.id}
            measurement={measurement}
            isExpanded={expandedId === measurement.id}
            onToggle={() => handleToggleExpand(measurement.id)}
            onConfigure={(target) => handleConfigure(measurement, target)}
          />
        ))}
      </div>

      {/* Add new objective button */}
      <button
        onClick={() => handleConfigure()}
        className="
          mt-3 w-full py-2 px-3
          border border-dashed border-slate-600
          text-slate-400 text-sm
          rounded-lg
          hover:border-teal-500/50 hover:text-teal-400
          transition-colors duration-200
          flex items-center justify-center gap-2
        "
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Objective
      </button>

      {/* Config modal */}
      {showConfig && (
        <TargetConfig
          measurement={editingMeasurement}
          currentTarget={editingTarget}
          onClose={handleCloseConfig}
        />
      )}
    </div>
  );
}

/**
 * Individual objective row - collapsible
 */
function ObjectiveRow({
  measurement,
  isExpanded,
  onToggle,
  onConfigure,
}: {
  measurement: Measurement;
  isExpanded: boolean;
  onToggle: () => void;
  onConfigure: (target?: MeasurementTarget) => void;
}) {
  // Fetch entries for this measurement (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const startDate = ninetyDaysAgo.toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];

  const { data: entries } = useMeasurementEntries(measurement.id, startDate, endDate);
  const { data: targets } = useMeasurementTargets(measurement.id);

  // Get current target (most recent)
  const currentTarget = targets?.data?.[0] as MeasurementTarget | undefined;

  // Get sorted entries (newest first for latest, oldest first for chart)
  const sortedEntries = [...(entries?.data || [])].sort(
    (a: MeasurementEntry, b: MeasurementEntry) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestEntry = sortedEntries[0] as MeasurementEntry | undefined;
  const chartEntries = [...sortedEntries].reverse();

  // Calculate target for today
  const calculateTargetForDate = (date: Date): number | null => {
    if (!currentTarget) return null;

    const start = new Date(currentTarget.startDate);
    const end = new Date(currentTarget.goalDate);
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed = (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const progress = Math.min(Math.max(daysPassed / totalDays, 0), 1);

    return (
      currentTarget.startValue +
      (currentTarget.goalValue - currentTarget.startValue) * progress
    );
  };

  const todayTarget = calculateTargetForDate(new Date());
  const difference =
    latestEntry && todayTarget !== null
      ? Number(latestEntry.value) - todayTarget
      : null;
  const isAboveTarget = difference !== null && difference > 0;

  // Calculate progress percentage
  const progressPercent = currentTarget && latestEntry
    ? Math.min(
        Math.max(
          ((currentTarget.startValue - Number(latestEntry.value)) /
            (currentTarget.startValue - currentTarget.goalValue)) *
            100,
          0
        ),
        100
      )
    : 0;

  return (
    <div className="bg-slate-800/40 rounded-lg overflow-hidden border border-slate-700/50">
      {/* Collapsed header - always visible */}
      <button
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-700/30 transition-colors"
      >
        {/* Expand/collapse chevron */}
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isExpanded ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Objective name */}
        <span className="font-condensed font-semibold text-slate-200 flex-1 text-left truncate">
          {measurement.name}
        </span>

        {/* Current value */}
        <span className="text-lg font-bold font-condensed text-white">
          {latestEntry ? Number(latestEntry.value).toFixed(1) : '--'}
          <span className="text-xs text-slate-400 font-normal ml-1">
            {measurement.unit || 'units'}
          </span>
        </span>

        {/* Progress indicator */}
        {currentTarget && (
          <div className="flex items-center gap-2">
            {/* Mini progress bar */}
            <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isAboveTarget ? 'bg-red-400' : 'bg-teal-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* vs target badge */}
            {difference !== null && (
              <span
                className={`text-xs font-condensed font-semibold ${
                  isAboveTarget ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {difference > 0 ? '+' : ''}
                {difference.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-slate-700/50">
          {/* Status header */}
          <div className="flex items-center justify-between py-3">
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider">Current</span>
              <div className="text-2xl font-bold text-white font-condensed">
                {latestEntry ? Number(latestEntry.value).toFixed(1) : '--'}{' '}
                <span className="text-sm text-slate-400 font-normal">
                  {measurement.unit || 'units'}
                </span>
              </div>
              {latestEntry && (
                <span className="text-[10px] text-slate-500">
                  {new Date(latestEntry.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>

            {difference !== null && (
              <div className={`text-right ${isAboveTarget ? 'text-red-400' : 'text-emerald-400'}`}>
                <span className="text-xs uppercase tracking-wider opacity-80">vs Target</span>
                <div className="text-xl font-bold font-condensed">
                  {difference > 0 ? '+' : ''}
                  {difference.toFixed(1)}
                </div>
              </div>
            )}

            {currentTarget && todayTarget !== null && (
              <div className="text-right">
                <span className="text-slate-400 text-xs uppercase tracking-wider">Target</span>
                <div className="text-lg font-semibold text-slate-300 font-condensed">
                  {todayTarget.toFixed(1)}
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {currentTarget && (
            <ProgressBar
              current={latestEntry?.value}
              target={currentTarget}
              isAboveTarget={isAboveTarget}
            />
          )}

          {/* Chart */}
          <div className="h-40 my-3">
            <Chart
              entries={chartEntries}
              target={currentTarget}
              unit={measurement.unit || 'units'}
            />
          </div>

          {/* Quick entry */}
          <QuickEntry
            measurementId={measurement.id}
            unit={measurement.unit || 'units'}
            lastValue={latestEntry?.value}
          />

          {/* Configure button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfigure(currentTarget);
            }}
            className="mt-2 text-xs text-slate-400 hover:text-teal-400 transition-colors"
          >
            Configure target
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Progress bar showing position between start and goal
 */
function ProgressBar({
  current,
  target,
  isAboveTarget,
}: {
  current?: number;
  target: MeasurementTarget;
  isAboveTarget: boolean;
}) {
  if (!current) return null;

  const range = target.startValue - target.goalValue;
  const progress = ((target.startValue - current) / range) * 100;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
        <span>Start: {target.startValue}</span>
        <span>Goal: {target.goalValue}</span>
      </div>
      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isAboveTarget
              ? 'bg-gradient-to-r from-red-500 to-red-400'
              : 'bg-gradient-to-r from-teal-500 to-emerald-400'
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      <div className="text-center text-[10px] text-slate-400 mt-1">
        {clampedProgress.toFixed(0)}% to goal
      </div>
    </div>
  );
}

/**
 * Loading skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse h-full flex flex-col space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="bg-slate-800/40 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-slate-700/50 rounded" />
            <div className="h-4 w-24 bg-slate-700/50 rounded flex-1" />
            <div className="h-6 w-16 bg-slate-700/50 rounded" />
            <div className="h-2 w-16 bg-slate-700/50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no objectives are configured
 */
function EmptyState({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-8">
      <div className="text-slate-500 mb-4">
        <svg
          className="w-12 h-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h4 className="font-condensed text-slate-200 font-semibold mb-1">
        No objectives configured
      </h4>
      <p className="text-sm text-slate-400 mb-4 max-w-[200px]">
        Set up tracking objectives to monitor your progress toward goals.
      </p>
      <button
        onClick={onConfigure}
        className="
          px-4 py-2
          bg-gradient-to-r from-teal-600 to-blue-600
          hover:from-teal-500 hover:to-blue-500
          text-white text-sm font-medium rounded-lg
          shadow-lg shadow-teal-500/20
          transition-all duration-200
        "
      >
        Add Objective
      </button>
    </div>
  );
}

export default TargetLineGraph;
