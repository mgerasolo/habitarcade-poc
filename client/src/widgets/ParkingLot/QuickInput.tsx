import { useState, useRef, useEffect, useCallback } from 'react';

interface QuickInputProps {
  onCapture: (content: string) => void;
  isLoading?: boolean;
}

/**
 * QuickInput - Fast capture input for parking lot items
 *
 * Features:
 * - Type + Enter = instant save
 * - Auto-focus on mount
 * - Loading state during save
 * - Clear after successful capture
 * - Placeholder hints for quick use
 */
export function QuickInput({ onCapture, isLoading = false }: QuickInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedValue = value.trim();

      if (!trimmedValue || isLoading) return;

      onCapture(trimmedValue);
      setValue('');

      // Re-focus input after capture
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [value, isLoading, onCapture]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape clears the input
    if (e.key === 'Escape') {
      setValue('');
      inputRef.current?.blur();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        {/* Icon */}
        <div className="absolute left-3 text-slate-500 pointer-events-none">
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 text-teal-400"
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
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Quick capture... (press Enter)"
          className={`
            w-full pl-10 pr-12 py-2.5
            bg-slate-700/30 border border-slate-600/40
            rounded-lg text-white placeholder-slate-500
            focus:outline-none focus:border-teal-500/70 focus:bg-slate-700/50
            focus:ring-1 focus:ring-teal-500/30
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            text-sm
          `}
        />

        {/* Enter hint or submit button */}
        {value.trim() && (
          <button
            type="submit"
            disabled={isLoading}
            className="
              absolute right-2
              px-2 py-1
              text-[10px] font-medium
              text-teal-400 hover:text-teal-300
              bg-teal-500/10 hover:bg-teal-500/20
              rounded
              transition-all duration-150
              disabled:opacity-50
            "
          >
            Enter
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[10px] text-slate-600">
          Type anything, deal with it later
        </span>
        {value && (
          <span className="text-[10px] text-slate-600">
            ESC to clear
          </span>
        )}
      </div>
    </form>
  );
}

export default QuickInput;
