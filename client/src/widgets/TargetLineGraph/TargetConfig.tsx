import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCreateMeasurement,
  useCreateMeasurementTarget,
  useUpdateMeasurementTarget,
  measurementKeys,
} from '../../api';
import type { Measurement, MeasurementTarget } from '../../types';

interface TargetConfigProps {
  measurement?: Measurement;
  currentTarget?: MeasurementTarget;
  onClose: () => void;
}

/**
 * TargetConfig - Modal for configuring measurement targets
 *
 * Features:
 * - Create new measurement if none exists
 * - Set start value, goal value, start date, goal date
 * - Edit existing target
 * - Visual preview of timeline
 */
export function TargetConfig({
  measurement,
  currentTarget,
  onClose,
}: TargetConfigProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Form state
  const [measurementName, setMeasurementName] = useState(
    measurement?.name || 'Weight'
  );
  const [measurementUnit, setMeasurementUnit] = useState(
    measurement?.unit || 'lbs'
  );
  const [startValue, setStartValue] = useState(
    currentTarget?.startValue?.toString() || ''
  );
  const [goalValue, setGoalValue] = useState(
    currentTarget?.goalValue?.toString() || ''
  );
  const [reachGoalValue, setReachGoalValue] = useState(
    currentTarget?.reachGoalValue?.toString() || ''
  );
  const [showReachGoal, setShowReachGoal] = useState(
    !!currentTarget?.reachGoalValue
  );
  const [startDate, setStartDate] = useState(
    currentTarget?.startDate || new Date().toISOString().split('T')[0]
  );
  const [goalDate, setGoalDate] = useState(
    currentTarget?.goalDate ||
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Mutations
  const createMeasurement = useCreateMeasurement();
  const createTarget = useCreateMeasurementTarget();
  const updateTarget = useUpdateMeasurementTarget();

  const isSubmitting =
    createMeasurement.isPending ||
    createTarget.isPending ||
    updateTarget.isPending;

  // Calculate timeline info
  const daysBetween = () => {
    const start = new Date(startDate);
    const end = new Date(goalDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const weeklyChange = () => {
    const start = parseFloat(startValue);
    const goal = parseFloat(goalValue);
    if (isNaN(start) || isNaN(goal)) return null;

    const days = daysBetween();
    const weeks = days / 7;
    const totalChange = goal - start;
    return weeks > 0 ? totalChange / weeks : 0;
  };

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numStartValue = parseFloat(startValue);
    const numGoalValue = parseFloat(goalValue);
    const numReachGoalValue = reachGoalValue ? parseFloat(reachGoalValue) : undefined;

    if (isNaN(numStartValue) || isNaN(numGoalValue)) {
      return;
    }

    try {
      let measurementId = measurement?.id;

      // Create measurement if it doesn't exist
      if (!measurementId) {
        const result = await createMeasurement.mutateAsync({
          type: 'weight',
          name: measurementName,
          unit: measurementUnit,
        });
        measurementId = result.data.id;
      }

      // Create or update target
      if (currentTarget) {
        await updateTarget.mutateAsync({
          measurementId,
          targetId: currentTarget.id,
          startValue: numStartValue,
          goalValue: numGoalValue,
          reachGoalValue: showReachGoal ? numReachGoalValue : undefined,
          startDate,
          goalDate,
        });
      } else {
        await createTarget.mutateAsync({
          measurementId,
          startValue: numStartValue,
          goalValue: numGoalValue,
          reachGoalValue: showReachGoal ? numReachGoalValue : undefined,
          startDate,
          goalDate,
        });
      }

      // Wait for queries to refetch before closing to prevent blank screen
      await queryClient.refetchQueries({ queryKey: measurementKeys.all });
      if (measurementId) {
        await queryClient.refetchQueries({ queryKey: measurementKeys.targets(measurementId) });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save target:', error);
    }
  };

  const weeklyChangeValue = weeklyChange();
  const isWeightLoss =
    weeklyChangeValue !== null && weeklyChangeValue < 0
      ? Math.abs(weeklyChangeValue) <= 2
      : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="
          w-full max-w-md mx-4
          bg-slate-800 border border-slate-700/50
          rounded-xl shadow-2xl shadow-black/50
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
          <h2 className="text-lg font-semibold text-white font-condensed">
            {currentTarget ? 'Edit Target' : 'Configure Target'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Measurement info (only show if no measurement exists) */}
          {!measurement && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Measurement Name
                </label>
                <input
                  type="text"
                  value={measurementName}
                  onChange={(e) => setMeasurementName(e.target.value)}
                  className="
                    w-full px-3 py-2
                    bg-slate-700/50 border border-slate-600/50
                    rounded-lg text-white placeholder-slate-500
                    focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50
                    text-sm
                  "
                  placeholder="e.g., Weight"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  value={measurementUnit}
                  onChange={(e) => setMeasurementUnit(e.target.value)}
                  className="
                    w-full px-3 py-2
                    bg-slate-700/50 border border-slate-600/50
                    rounded-lg text-white placeholder-slate-500
                    focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50
                    text-sm
                  "
                  placeholder="e.g., lbs, kg"
                />
              </div>
            </div>
          )}

          {/* Values row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Start Value ({measurement?.unit || measurementUnit})
              </label>
              <input
                type="number"
                step="0.1"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                required
                className="
                  w-full px-3 py-2
                  bg-slate-700/50 border border-slate-600/50
                  rounded-lg text-white placeholder-slate-500
                  focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50
                  text-sm
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                "
                placeholder="Current value"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Goal Value ({measurement?.unit || measurementUnit})
              </label>
              <input
                type="number"
                step="0.1"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                required
                className="
                  w-full px-3 py-2
                  bg-slate-700/50 border border-slate-600/50
                  rounded-lg text-white placeholder-slate-500
                  focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50
                  text-sm
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none
                  [&::-webkit-inner-spin-button]:appearance-none
                "
                placeholder="Target value"
              />
            </div>
          </div>

          {/* Reach Goal toggle and input */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={showReachGoal}
                onChange={(e) => setShowReachGoal(e.target.checked)}
                className="
                  w-4 h-4 rounded
                  bg-slate-700/50 border-slate-600
                  text-teal-500 focus:ring-teal-500/50
                "
              />
              <span className="text-sm text-slate-300">
                Set a reach goal (optional stretch target)
              </span>
            </label>
            {showReachGoal && (
              <div className="ml-6">
                <label className="block text-xs text-slate-400 mb-1.5">
                  Reach Goal Value ({measurement?.unit || measurementUnit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={reachGoalValue}
                  onChange={(e) => setReachGoalValue(e.target.value)}
                  className="
                    w-full px-3 py-2
                    bg-slate-700/50 border border-slate-600/50
                    rounded-lg text-white placeholder-slate-500
                    focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50
                    text-sm
                    [appearance:textfield]
                    [&::-webkit-outer-spin-button]:appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none
                  "
                  placeholder="Aggressive target (optional)"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  A more aggressive goal to strive for beyond your primary target
                </p>
              </div>
            )}
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="
                  w-full px-3 py-2
                  bg-slate-700/50 border border-slate-600/50
                  rounded-lg text-white
                  focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50
                  text-sm
                  [color-scheme:dark]
                "
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Goal Date
              </label>
              <input
                type="date"
                value={goalDate}
                onChange={(e) => setGoalDate(e.target.value)}
                required
                className="
                  w-full px-3 py-2
                  bg-slate-700/50 border border-slate-600/50
                  rounded-lg text-white
                  focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50
                  text-sm
                  [color-scheme:dark]
                "
              />
            </div>
          </div>

          {/* Timeline preview */}
          {startValue && goalValue && (
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">Timeline Preview</span>
                <span className="text-xs text-slate-500">
                  {daysBetween()} days ({Math.ceil(daysBetween() / 7)} weeks)
                </span>
              </div>

              {/* Visual timeline */}
              <div className="relative h-2 bg-slate-700 rounded-full mb-3">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                  style={{ width: '100%' }}
                />
                <div className="absolute -top-1 left-0 w-4 h-4 bg-teal-500 rounded-full border-2 border-slate-800" />
                <div className="absolute -top-1 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-slate-800" />
              </div>

              <div className="flex justify-between text-xs">
                <div>
                  <div className="text-slate-400">Start</div>
                  <div className="text-white font-medium">
                    {startValue} {measurement?.unit || measurementUnit}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-slate-400">Weekly Change</div>
                  <div
                    className={`font-medium ${
                      weeklyChangeValue !== null
                        ? isWeightLoss
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {weeklyChangeValue !== null
                      ? `${weeklyChangeValue > 0 ? '+' : ''}${weeklyChangeValue.toFixed(1)} ${measurement?.unit || measurementUnit}/wk`
                      : '--'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400">Goal</div>
                  <div className="text-white font-medium">
                    {goalValue} {measurement?.unit || measurementUnit}
                  </div>
                </div>
              </div>

              {/* Warning for aggressive weight loss */}
              {weeklyChangeValue !== null && weeklyChangeValue < -2 && (
                <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400">
                  Warning: Losing more than 2 lbs/week may not be sustainable.
                  Consider extending your timeline.
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {(createMeasurement.isError ||
            createTarget.isError ||
            updateTarget.isError) && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              Failed to save target. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 px-4 py-2.5
                bg-slate-700/50 hover:bg-slate-600/50
                border border-slate-600/50
                text-slate-300 font-medium text-sm
                rounded-lg transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !startValue || !goalValue}
              className="
                flex-1 px-4 py-2.5
                bg-gradient-to-r from-teal-600 to-blue-600
                hover:from-teal-500 hover:to-blue-500
                text-white font-medium text-sm
                rounded-lg shadow-lg shadow-teal-500/20
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{currentTarget ? 'Update Target' : 'Set Target'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TargetConfig;
