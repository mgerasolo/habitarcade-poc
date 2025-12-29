import { useState, useRef, useEffect } from 'react';
import { useAddMeasurementEntry } from '../../api';

interface QuickEntryProps {
  measurementId?: string;
  unit: string;
  lastValue?: number;
}

/**
 * QuickEntry - Quick value entry input for measurements
 *
 * Features:
 * - Single input field with unit label
 * - Enter to submit
 * - Shows last value as placeholder
 * - Loading state during submission
 * - Success/error feedback
 */
export function QuickEntry({ measurementId, unit, lastValue }: QuickEntryProps) {
  const [value, setValue] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEntry = useAddMeasurementEntry();

  // Format today's date
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!measurementId || !value) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    try {
      await addEntry.mutateAsync({
        measurementId,
        date: today,
        value: numValue,
      });

      setValue('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isDisabled = !measurementId || addEntry.isPending;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={lastValue ? `Last: ${lastValue}` : 'Enter value...'}
            disabled={isDisabled}
            className={`
              w-full px-3 py-2 pr-16
              bg-slate-700/50 border border-slate-600/50
              rounded-lg text-white placeholder-slate-500
              focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              text-sm font-medium
              [appearance:textfield]
              [&::-webkit-outer-spin-button]:appearance-none
              [&::-webkit-inner-spin-button]:appearance-none
            `}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            {unit}
          </span>
        </div>

        <button
          type="submit"
          disabled={isDisabled || !value}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm
            transition-all duration-200
            ${
              showSuccess
                ? 'bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-teal-500/20
            flex items-center gap-1.5
          `}
        >
          {addEntry.isPending ? (
            <>
              <LoadingSpinner />
              <span>Saving</span>
            </>
          ) : showSuccess ? (
            <>
              <CheckIcon />
              <span>Saved</span>
            </>
          ) : (
            <>
              <PlusIcon />
              <span>Log</span>
            </>
          )}
        </button>
      </div>

      {/* Date indicator */}
      <div className="mt-1 text-center">
        <span className="text-[10px] text-slate-500">
          Logging for{' '}
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Error message */}
      {addEntry.isError && (
        <div className="mt-2 text-xs text-red-400 text-center">
          Failed to save. Please try again.
        </div>
      )}
    </form>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
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
  );
}

function PlusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default QuickEntry;
