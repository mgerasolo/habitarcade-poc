import { useState, useRef, useEffect } from 'react';
import * as MuiIcons from '@mui/icons-material';

interface QuickEntryProps {
  onAddTask: (title: string) => void;
  onAddHabit: (name: string) => void;
  isCreating: boolean;
}

type EntryMode = 'closed' | 'task' | 'habit';

/**
 * Quick entry footer for adding tasks and habits
 */
export function QuickEntry({
  onAddTask,
  onAddHabit,
  isCreating,
}: QuickEntryProps) {
  const [mode, setMode] = useState<EntryMode>('closed');
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode !== 'closed' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!value.trim()) {
      setMode('closed');
      return;
    }

    if (mode === 'task') {
      onAddTask(value.trim());
    } else if (mode === 'habit') {
      onAddHabit(value.trim());
    }

    setValue('');
    setMode('closed');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setValue('');
      setMode('closed');
    }
  };

  const handleBlur = () => {
    // Only close if empty after a short delay (allows click on submit)
    setTimeout(() => {
      if (!value.trim()) {
        setMode('closed');
      }
    }, 150);
  };

  if (mode === 'closed') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 pb-6 flex justify-center gap-3 pointer-events-auto">
          <button
            onClick={() => setMode('task')}
            className="
              flex items-center gap-2 px-6 py-3
              bg-blue-600 hover:bg-blue-500
              text-white rounded-xl
              shadow-lg shadow-blue-600/30
              transition-all duration-150
              font-medium text-sm
            "
          >
            <MuiIcons.AddTask style={{ fontSize: 20 }} />
            <span>Quick Task</span>
          </button>

          <button
            onClick={() => setMode('habit')}
            className="
              flex items-center gap-2 px-6 py-3
              bg-teal-600 hover:bg-teal-500
              text-white rounded-xl
              shadow-lg shadow-teal-600/30
              transition-all duration-150
              font-medium text-sm
            "
          >
            <MuiIcons.Add style={{ fontSize: 20 }} />
            <span>Quick Habit</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700/50">
      <form
        onSubmit={handleSubmit}
        className="max-w-7xl mx-auto px-4 py-4"
      >
        <div className="flex items-center gap-3">
          {/* Mode indicator */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${mode === 'task' ? 'bg-blue-600' : 'bg-teal-600'}
          `}>
            {mode === 'task' ? (
              <MuiIcons.AddTask style={{ fontSize: 20, color: 'white' }} />
            ) : (
              <MuiIcons.CheckCircle style={{ fontSize: 20, color: 'white' }} />
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={mode === 'task' ? 'Enter task title...' : 'Enter habit name...'}
            disabled={isCreating}
            className="
              flex-1 px-4 py-3
              bg-slate-700 border border-slate-600
              rounded-xl text-white
              placeholder-slate-400
              focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
              disabled:opacity-50
            "
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={isCreating || !value.trim()}
            className={`
              px-5 py-3 rounded-xl font-medium text-sm
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              ${mode === 'task'
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
              }
            `}
          >
            {isCreating ? (
              <MuiIcons.Sync className="animate-spin" style={{ fontSize: 20 }} />
            ) : (
              'Add'
            )}
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={() => {
              setValue('');
              setMode('closed');
            }}
            className="
              p-3 rounded-xl
              bg-slate-700 hover:bg-slate-600
              text-slate-400 hover:text-white
              transition-colors
            "
          >
            <MuiIcons.Close style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">Enter</kbd> to add,{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">Esc</kbd> to cancel
        </p>
      </form>
    </div>
  );
}

export default QuickEntry;
