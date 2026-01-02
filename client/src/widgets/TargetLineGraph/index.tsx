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
  /** Measurement type to display (default: 'weight') */
  measurementType?: string;
  /** Custom class name */
  className?: string;
}

/**
 * TargetLineGraph - Progress tracking widget with target line visualization
 *
 * Features:
 * - Line chart showing actual values vs target line
 * - Target line is dashed gray, linear interpolation from start to goal
 * - Actual values in solid teal/blue
 * - Status display: X above/below target
 * - Quick entry input for today's value
 * - Color: green if on/below target, red if above (for weight loss)
 */
export function TargetLineGraph({
  measurementType = 'weight',
  className = '',
}: TargetLineGraphProps) {
  const [showConfig, setShowConfig] = useState(false);

  // Fetch measurements
  const { data: measurements, isLoading: measurementsLoading } = useMeasurements();
  const measurement = measurements?.data?.find(
    (m: Measurement) => m.type === measurementType
  );

  // Fetch entries (last 90 days by default)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const startDate = ninetyDaysAgo.toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];

  const { data: entries, isLoading: entriesLoading } = useMeasurementEntries(
    measurement?.id || '',
    startDate,
    endDate
  );

  // Fetch targets
  const { data: targets, isLoading: targetsLoading } = useMeasurementTargets(
    measurement?.id || ''
  );

  const isLoading = measurementsLoading || entriesLoading || targetsLoading;

  // Get current active target (most recent)
  const currentTarget = targets?.data?.[0] as MeasurementTarget | undefined;

  // Get latest entry (sorted by date descending)
  const sortedEntries = [...(entries?.data || [])].sort(
    (a: MeasurementEntry, b: MeasurementEntry) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestEntry = sortedEntries[0] as MeasurementEntry | undefined;

  /**
   * Calculate target value for a given date using linear interpolation
   */
  const calculateTargetForDate = (date: Date): number | null => {
    if (!currentTarget) return null;

    const start = new Date(currentTarget.startDate);
    const end = new Date(currentTarget.goalDate);
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed = (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    // Clamp progress between 0 and 1
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

  // Determine if above or below target (for weight loss, above is bad)
  const isAboveTarget = difference !== null && difference > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <LoadingSkeleton />
      </div>
    );
  }

  // No measurement configured
  if (!measurement) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <EmptyState onConfigure={() => setShowConfig(true)} />
        {showConfig && (
          <TargetConfig
            measurement={undefined}
            currentTarget={undefined}
            onClose={() => setShowConfig(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Status header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-slate-400 text-xs uppercase tracking-wider">
            Current
          </span>
          <div className="text-2xl font-bold text-white font-condensed">
            {latestEntry?.value.toFixed(1) || '--'}{' '}
            <span className="text-sm text-slate-400 font-normal">
              {measurement.unit || 'lbs'}
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
            <span className="text-slate-400 text-xs uppercase tracking-wider">
              Target
            </span>
            <div className="text-lg font-semibold text-slate-300 font-condensed">
              {todayTarget.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      {/* Progress indicator bar */}
      {currentTarget && (
        <ProgressBar
          current={latestEntry?.value}
          target={currentTarget}
          isAboveTarget={isAboveTarget}
        />
      )}

      {/* Chart */}
      <div className="flex-1 min-h-0 my-3">
        <Chart
          entries={sortedEntries.reverse()}
          target={currentTarget}
          unit={measurement.unit || 'lbs'}
        />
      </div>

      {/* Quick entry */}
      <QuickEntry
        measurementId={measurement.id}
        unit={measurement.unit || 'lbs'}
        lastValue={latestEntry?.value}
      />

      {/* Config button */}
      <button
        onClick={() => setShowConfig(true)}
        className="mt-2 text-xs text-slate-400 hover:text-teal-400 transition-colors self-end"
      >
        Configure target
      </button>

      {/* Config modal */}
      {showConfig && (
        <TargetConfig
          measurement={measurement}
          currentTarget={currentTarget}
          onClose={() => setShowConfig(false)}
        />
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
    <div className="animate-pulse h-full flex flex-col">
      <div className="flex justify-between mb-4">
        <div>
          <div className="h-3 w-12 bg-slate-700/50 rounded mb-1" />
          <div className="h-7 w-20 bg-slate-700/50 rounded" />
        </div>
        <div className="text-right">
          <div className="h-3 w-14 bg-slate-700/50 rounded mb-1 ml-auto" />
          <div className="h-6 w-16 bg-slate-700/50 rounded ml-auto" />
        </div>
      </div>
      <div className="flex-1 bg-slate-700/30 rounded-lg" />
      <div className="h-10 bg-slate-700/30 rounded-lg mt-3" />
    </div>
  );
}

/**
 * Empty state when no measurement is configured
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
        No target configured
      </h4>
      <p className="text-sm text-slate-400 mb-4 max-w-[200px]">
        Set up a measurement target to start tracking your progress.
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
        Configure Target
      </button>
    </div>
  );
}

export default TargetLineGraph;
