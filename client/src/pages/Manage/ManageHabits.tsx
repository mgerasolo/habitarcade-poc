import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useHabits, useDeleteHabit, useCategories, useImportHabits } from '../../api';
import { useUIStore } from '../../stores';
import type { Habit, Category } from '../../types';

/**
 * Import Habits Modal
 * Allows users to paste markdown and bulk import habits
 */
function ImportHabitsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [markdown, setMarkdown] = useState('');
  const importHabits = useImportHabits();

  const exampleMarkdown = `## Morning Routine
- Wake Up @icon:material:WbSunny @color:#f59e0b
- Meditate @icon:material:SelfImprovement @color:#8b5cf6
- Exercise @icon:material:FitnessCenter @color:#ef4444

## Health
- Drink Water @icon:material:LocalDrink @color:#3b82f6
- Take Vitamins @icon:material:Medication @color:#22c55e`;

  const handleImport = async () => {
    if (!markdown.trim()) {
      toast.error('Please enter some markdown to import');
      return;
    }

    try {
      const result = await importHabits.mutateAsync(markdown);
      toast.success(result.message);
      setMarkdown('');
      onClose();
    } catch (error) {
      toast.error('Failed to import habits');
    }
  };

  const loadExample = () => {
    setMarkdown(exampleMarkdown);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/20 flex items-center justify-center border border-teal-500/30">
              <MuiIcons.FileUpload style={{ color: '#14b8a6', fontSize: 22 }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Import Habits</h2>
              <p className="text-sm text-slate-400">Bulk import from markdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
          >
            <MuiIcons.Close style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Format Info */}
          <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Markdown Format:</h3>
            <pre className="text-xs text-slate-400 font-mono overflow-x-auto">
{`## Category Name
- Habit Name @icon:material:IconName @color:#hex`}
            </pre>
          </div>

          {/* Markdown Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Paste your markdown
              </label>
              <button
                onClick={loadExample}
                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                Load Example
              </button>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="## Category&#10;- Habit Name @icon:material:Check @color:#14b8a6"
              className="w-full h-64 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importHabits.isPending || !markdown.trim()}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importHabits.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <MuiIcons.FileUpload style={{ fontSize: 18 }} />
                Import Habits
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Manage Habits Page
 *
 * Features:
 * - View all habits in a table/list
 * - Create new habits
 * - Edit existing habits
 * - Delete habits with confirmation
 * - Reorder habits via drag-and-drop
 */
export function ManageHabits() {
  const { data: habitsData, isLoading } = useHabits();
  const { data: categoriesData } = useCategories();
  const deleteHabit = useDeleteHabit();
  const { openModal, setSelectedHabit } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'created'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showImportModal, setShowImportModal] = useState(false);

  // Filter and sort habits
  const habits = useMemo(() => {
    if (!habitsData?.data) return [];

    let filtered = habitsData.data.filter((h: Habit) => !h.isDeleted);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((h: Habit) =>
        h.name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        filtered = filtered.filter((h: Habit) => !h.categoryId);
      } else {
        filtered = filtered.filter((h: Habit) => h.categoryId === categoryFilter);
      }
    }

    // Sort
    filtered.sort((a: Habit, b: Habit) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = (a.category?.name || '').localeCompare(b.category?.name || '');
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [habitsData, searchQuery, categoryFilter, sortBy, sortDirection]);

  const categories = useMemo(() => {
    if (!categoriesData?.data) return [];
    return categoriesData.data.filter((c: Category) => !c.isDeleted);
  }, [categoriesData]);

  // Handle edit
  const handleEdit = (habit: Habit) => {
    setSelectedHabit(habit);
    openModal('habit-form');
  };

  // Handle delete with confirmation
  const handleDelete = (habit: Habit) => {
    openModal('confirm-delete', {
      title: 'Delete Habit',
      message: `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteHabit.mutateAsync(habit.id);
          toast.success(`Deleted "${habit.name}"`);
        } catch (error) {
          toast.error('Failed to delete habit');
        }
      }
    });
  };

  // Handle add new
  const handleAdd = () => {
    setSelectedHabit(null);
    openModal('habit-form');
  };

  // Toggle sort
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Render icon
  const renderIcon = (habit: Habit) => {
    if (!habit.icon) {
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
          <MuiIcons.CheckCircle style={{ color: '#64748b', fontSize: 18 }} />
        </div>
      );
    }

    if (habit.icon.startsWith('material:')) {
      const iconName = habit.icon.replace('material:', '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${habit.iconColor || '#14b8a6'}20` }}
          >
            <IconComponent style={{ color: habit.iconColor || '#14b8a6', fontSize: 18 }} />
          </div>
        );
      }
    }

    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${habit.iconColor || '#14b8a6'}20` }}
      >
        <i className={habit.icon} style={{ color: habit.iconColor || '#14b8a6', fontSize: 16 }} />
      </div>
    );
  };

  return (
    <div className="p-6" data-testid="manage-habits-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
            <MuiIcons.CheckCircle style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Habits</h1>
            <p className="text-sm text-slate-400">{habits.length} habits</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all border border-slate-600"
          >
            <MuiIcons.FileUpload style={{ fontSize: 20 }} />
            Import
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-600/20"
          >
            <MuiIcons.Add style={{ fontSize: 20 }} />
            Add Habit
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
        >
          <option value="all">All Categories</option>
          <option value="uncategorized">Uncategorized</option>
          {categories.map((cat: Category) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-4 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
            Habit
            {sortBy === 'name' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('category')}>
            Category
            {sortBy === 'category' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 flex items-center gap-2">
            Status
          </div>
          <div className="col-span-1 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('created')}>
            Created
            {sortBy === 'created' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
            Loading habits...
          </div>
        ) : habits.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MuiIcons.CheckCircleOutline style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
            <p>No habits found</p>
            <button
              onClick={handleAdd}
              className="mt-4 text-teal-400 hover:text-teal-300 font-medium"
            >
              Create your first habit
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {habits.map((habit: Habit) => (
              <div
                key={habit.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-700/30 transition-colors"
              >
                {/* Habit Name */}
                <div className="col-span-4 flex items-center gap-3">
                  {renderIcon(habit)}
                  <span className="text-white font-medium">{habit.name}</span>
                </div>

                {/* Category */}
                <div className="col-span-3">
                  {habit.category ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                      <MuiIcons.Category style={{ fontSize: 14 }} />
                      {habit.category.name}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm">-</span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-2">
                  {habit.isActive !== false ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-500/20 text-teal-400 rounded-lg text-sm">
                      <MuiIcons.CheckCircle style={{ fontSize: 14 }} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-600/50 text-slate-400 rounded-lg text-sm">
                      <MuiIcons.PauseCircle style={{ fontSize: 14 }} />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Created */}
                <div className="col-span-1 text-sm text-slate-400">
                  {new Date(habit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEdit(habit)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <MuiIcons.Edit style={{ fontSize: 18 }} />
                  </button>
                  <button
                    onClick={() => handleDelete(habit)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <MuiIcons.Delete style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportHabitsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}

export default ManageHabits;
