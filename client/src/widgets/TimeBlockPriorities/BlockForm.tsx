import { useState, useEffect, useCallback, useMemo } from 'react';
import { useHabits, useCategories, useCreateTimeBlock, useUpdateTimeBlock } from '../../api';
import type { TimeBlock, Habit, Category } from '../../types';

interface BlockFormProps {
  block?: TimeBlock | null;
  onClose: () => void;
}

// Preset duration options
const DURATION_PRESETS = [
  { label: '15m', value: 15 },
  { label: '25m', value: 25 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
];

export function BlockForm({ block, onClose }: BlockFormProps) {
  const isEditing = !!block;

  // Form state
  const [name, setName] = useState(block?.name ?? '');
  const [durationMinutes, setDurationMinutes] = useState(block?.durationMinutes ?? 25);
  const [linkedHabitId, setLinkedHabitId] = useState<string | undefined>(block?.linkedHabitId);
  const [customDuration, setCustomDuration] = useState('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);

  // Fetch habits and categories for linking
  const { data: habitsData } = useHabits();
  const { data: categoriesData } = useCategories();
  const habits: Habit[] = habitsData?.data ?? [];
  const categories: Category[] = categoriesData?.data ?? [];

  // Group habits by category, ordered like Habit Matrix
  interface CategoryGroup {
    category: Category | null;
    habits: Habit[];
  }

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const groupMap = new Map<string | null, Habit[]>();

    // Sort categories by sortOrder
    const sortedCategories = [...categories]
      .filter(c => !c.isDeleted)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Pre-create category groups in order
    sortedCategories.forEach(cat => {
      groupMap.set(cat.id, []);
    });
    groupMap.set(null, []); // Uncategorized at the end

    // Filter and sort habits by sortOrder, then distribute into groups
    const sortedHabits = [...habits]
      .filter(h => !h.isDeleted)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    sortedHabits.forEach(habit => {
      const categoryId = habit.categoryId || null;
      if (!groupMap.has(categoryId)) {
        groupMap.set(categoryId, []);
      }
      groupMap.get(categoryId)!.push(habit);
    });

    // Build result array maintaining category order
    const result: CategoryGroup[] = [];

    sortedCategories.forEach(cat => {
      const categoryHabits = groupMap.get(cat.id) || [];
      if (categoryHabits.length > 0) {
        result.push({
          category: cat,
          habits: categoryHabits,
        });
      }
    });

    // Add uncategorized at the end if it has habits
    const uncategorized = groupMap.get(null) || [];
    if (uncategorized.length > 0) {
      result.push({
        category: null,
        habits: uncategorized,
      });
    }

    return result;
  }, [habits, categories]);

  // Mutations
  const createBlock = useCreateTimeBlock();
  const updateBlock = useUpdateTimeBlock();

  // Check if current duration matches a preset
  useEffect(() => {
    const isPreset = DURATION_PRESETS.some((p) => p.value === durationMinutes);
    if (!isPreset && durationMinutes > 0) {
      setShowCustomDuration(true);
      setCustomDuration(durationMinutes.toString());
    }
  }, [durationMinutes]);

  const handleDurationPreset = useCallback((value: number) => {
    setDurationMinutes(value);
    setShowCustomDuration(false);
    setCustomDuration('');
  }, []);

  const handleCustomDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomDuration(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 480) {
      setDurationMinutes(parsed);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      durationMinutes,
      linkedHabitId: linkedHabitId || undefined,
    };

    try {
      if (isEditing && block) {
        await updateBlock.mutateAsync({ id: block.id, ...data });
      } else {
        await createBlock.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save time block:', error);
    }
  }, [name, durationMinutes, linkedHabitId, isEditing, block, createBlock, updateBlock, onClose]);

  const isSubmitting = createBlock.isPending || updateBlock.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="
          relative w-full max-w-md
          bg-gradient-to-br from-slate-800 to-slate-900
          border border-slate-700/50
          rounded-2xl shadow-2xl shadow-black/30
          animate-in fade-in zoom-in-95 duration-200
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white font-condensed">
            {isEditing ? 'Edit Time Block' : 'Create Time Block'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Block name */}
          <div>
            <label htmlFor="block-name" className="block text-sm font-medium text-slate-300 mb-2">
              Block Name
            </label>
            <input
              id="block-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Deep Work, Writing, Exercise"
              className="
                w-full px-4 py-3 rounded-lg
                bg-slate-900/50 border border-slate-600/50
                text-white placeholder-slate-500
                focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20
                transition-all duration-150
              "
              autoFocus
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Duration
            </label>

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleDurationPreset(preset.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${durationMinutes === preset.value && !showCustomDuration
                      ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/20'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomDuration(true)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150
                  ${showCustomDuration
                    ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                Custom
              </button>
            </div>

            {/* Custom duration input */}
            {showCustomDuration && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customDuration}
                  onChange={handleCustomDurationChange}
                  min="1"
                  max="480"
                  placeholder="Enter minutes"
                  className="
                    w-32 px-4 py-2 rounded-lg
                    bg-slate-900/50 border border-slate-600/50
                    text-white placeholder-slate-500
                    focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20
                    transition-all duration-150
                  "
                />
                <span className="text-sm text-slate-400">minutes</span>
              </div>
            )}

            {/* Duration preview */}
            <p className="text-xs text-slate-500 mt-2">
              {durationMinutes > 60
                ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                : `${durationMinutes} minutes`
              }
            </p>
          </div>

          {/* Linked habit */}
          <div>
            <label htmlFor="linked-habit" className="block text-sm font-medium text-slate-300 mb-2">
              Link to Habit (Optional)
            </label>
            <select
              id="linked-habit"
              value={linkedHabitId ?? ''}
              onChange={(e) => setLinkedHabitId(e.target.value || undefined)}
              className="
                w-full px-4 py-3 rounded-lg
                bg-slate-900/50 border border-slate-600/50
                text-white
                focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20
                transition-all duration-150
                appearance-none cursor-pointer
              "
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.25em 1.25em',
              }}
            >
              <option value="">No linked habit</option>
              {categoryGroups.map((group) => (
                <optgroup
                  key={group.category?.id || 'uncategorized'}
                  label={group.category ? `${group.category.icon || ''} ${group.category.name}`.trim() : 'Uncategorized'}
                >
                  {group.habits.map((habit) => (
                    <option key={habit.id} value={habit.id}>
                      {habit.icon ? `${habit.icon} ` : ''}{habit.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              When the timer completes, you can mark the linked habit as done.
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 px-4 py-3 rounded-lg
                bg-slate-700 hover:bg-slate-600
                text-slate-300 font-medium
                transition-colors duration-150
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || durationMinutes <= 0 || isSubmitting}
              className="
                flex-1 px-4 py-3 rounded-lg
                bg-gradient-to-r from-teal-500 to-blue-500
                hover:from-teal-400 hover:to-blue-400
                disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed
                text-white font-medium
                shadow-lg shadow-teal-500/20 disabled:shadow-none
                transition-all duration-150
                flex items-center justify-center gap-2
              "
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isEditing ? 'Save Changes' : 'Create Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BlockForm;
