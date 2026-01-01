import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useHabits, useDeleteHabit, useCategories } from '../../api';
import { useUIStore } from '../../stores';
import type { Habit, Category } from '../../types';

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
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-teal-600/20"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          Add Habit
        </button>
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
          <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('category')}>
            Category
            {sortBy === 'category' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-3 flex items-center gap-2">
            <MuiIcons.Flag style={{ fontSize: 16 }} />
            Goal
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <MuiIcons.Link style={{ fontSize: 16 }} />
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
                  <div>
                    <span className="text-white font-medium">{habit.name}</span>
                    {habit.description && (
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{habit.description}</p>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  {habit.category ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                      <MuiIcons.Category style={{ fontSize: 14 }} />
                      {habit.category.name}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm">-</span>
                  )}
                </div>

                {/* Goal */}
                <div className="col-span-3">
                  {habit.goalFrequency ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-600/10 border border-teal-600/30 rounded-lg text-sm text-teal-400">
                      <MuiIcons.Flag style={{ fontSize: 14 }} />
                      {habit.goalFrequency === 'daily' && 'Daily'}
                      {habit.goalFrequency === 'weekly' && `${habit.goalTarget || '?'}x/week`}
                      {habit.goalFrequency === 'specific_days' && `${habit.goalDays?.length || 0} days`}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm">No goal set</span>
                  )}
                </div>

                {/* Links count */}
                <div className="col-span-1">
                  {habit.links && habit.links.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                      <MuiIcons.Link style={{ fontSize: 14 }} />
                      {habit.links.length}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-sm">-</span>
                  )}
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
    </div>
  );
}

export default ManageHabits;
