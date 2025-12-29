import { useState, useRef, useEffect } from 'react';
import { useCreateTask } from '../../api';

interface QuickAddProps {
  plannedDate: string;
}

export function QuickAdd({ plannedDate }: QuickAddProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const createTask = useCreateTask();

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setIsAdding(false);
      return;
    }

    createTask.mutate(
      {
        title: title.trim(),
        plannedDate,
        status: 'pending',
        sortOrder: 0, // Will be placed at top
      },
      {
        onSuccess: () => {
          setTitle('');
          setIsAdding(false);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle('');
      setIsAdding(false);
    }
  };

  const handleBlur = () => {
    // Only close if empty
    if (!title.trim()) {
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center justify-center gap-1 py-1 text-xs text-slate-500 hover:text-teal-400 hover:bg-teal-500/10 rounded transition-colors group"
      >
        <svg
          className="w-3 h-3 transition-transform group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-condensed">Add</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Task title..."
        disabled={createTask.isPending}
        className="w-full px-2 py-1 text-xs bg-slate-700 border border-teal-500/50 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
    </form>
  );
}

export default QuickAdd;
