import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import * as MuiIcons from '@mui/icons-material';
import { useCategories, useDeleteCategory, useHabits } from '../../api';
import { useUIStore } from '../../stores';
import type { Category, Habit } from '../../types';

/**
 * Manage Categories Page
 *
 * Features:
 * - View all categories in a table/list
 * - Create new categories
 * - Edit existing categories
 * - Delete categories with confirmation
 * - See habit count per category
 * - Reorder categories
 */
export function ManageCategories() {
  const { data: categoriesData, isLoading } = useCategories();
  const { data: habitsData } = useHabits();
  const deleteCategory = useDeleteCategory();
  const { openModal, setSelectedCategory } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'habits' | 'created'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get habit count per category
  const habitCounts = useMemo(() => {
    if (!habitsData?.data) return {};
    const counts: Record<string, number> = {};
    habitsData.data.forEach((h: Habit) => {
      if (h.categoryId && !h.isDeleted) {
        counts[h.categoryId] = (counts[h.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [habitsData]);

  // Filter and sort categories
  const categories = useMemo(() => {
    if (!categoriesData?.data) return [];

    let filtered = categoriesData.data.filter((c: Category) => !c.isDeleted);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((c: Category) =>
        c.name.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a: Category, b: Category) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'habits':
          comparison = (habitCounts[a.id] || 0) - (habitCounts[b.id] || 0);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [categoriesData, searchQuery, sortBy, sortDirection, habitCounts]);

  // Handle edit
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    openModal('category-form');
  };

  // Handle delete with confirmation
  const handleDelete = (category: Category) => {
    const habitCount = habitCounts[category.id] || 0;
    openModal('confirm-delete', {
      title: 'Delete Category',
      message: habitCount > 0
        ? `Are you sure you want to delete "${category.name}"? This category has ${habitCount} habit(s) that will become uncategorized.`
        : `Are you sure you want to delete "${category.name}"?`,
      onConfirm: async () => {
        try {
          await deleteCategory.mutateAsync(category.id);
          toast.success(`Deleted "${category.name}"`);
        } catch (error) {
          toast.error('Failed to delete category');
        }
      }
    });
  };

  // Handle add new
  const handleAdd = () => {
    setSelectedCategory(null);
    openModal('category-form');
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
  const renderIcon = (category: Category) => {
    if (!category.icon) {
      return (
        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
          <MuiIcons.Category style={{ color: '#64748b', fontSize: 18 }} />
        </div>
      );
    }

    if (category.icon.startsWith('material:')) {
      const iconName = category.icon.replace('material:', '');
      const IconComponent = (MuiIcons as Record<string, React.ComponentType<{ style?: React.CSSProperties }>>)[iconName];
      if (IconComponent) {
        return (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${category.iconColor || '#3b82f6'}20` }}
          >
            <IconComponent style={{ color: category.iconColor || '#3b82f6', fontSize: 18 }} />
          </div>
        );
      }
    }

    return (
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${category.iconColor || '#3b82f6'}20` }}
      >
        <i className={category.icon} style={{ color: category.iconColor || '#3b82f6', fontSize: 16 }} />
      </div>
    );
  };

  return (
    <div className="p-6" data-testid="manage-categories-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <MuiIcons.Category style={{ color: 'white', fontSize: 24 }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manage Categories</h1>
            <p className="text-sm text-slate-400">{categories.length} categories</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20"
        >
          <MuiIcons.Add style={{ fontSize: 20 }} />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-5 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
            Category
            {sortBy === 'name' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('habits')}>
            Habits
            {sortBy === 'habits' && (
              sortDirection === 'asc' ? <MuiIcons.ArrowUpward style={{ fontSize: 16 }} /> : <MuiIcons.ArrowDownward style={{ fontSize: 16 }} />
            )}
          </div>
          <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white" onClick={() => toggleSort('created')}>
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
            <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <MuiIcons.CategoryOutlined style={{ fontSize: 48, opacity: 0.5 }} className="mx-auto mb-2" />
            <p>No categories found</p>
            <button
              onClick={handleAdd}
              className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {categories.map((category: Category) => (
              <div
                key={category.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-700/30 transition-colors"
              >
                {/* Category Name */}
                <div className="col-span-5 flex items-center gap-3">
                  {renderIcon(category)}
                  <span className="text-white font-medium">{category.name}</span>
                </div>

                {/* Habit Count */}
                <div className="col-span-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                    <MuiIcons.CheckCircle style={{ fontSize: 14 }} />
                    {habitCounts[category.id] || 0} habit{(habitCounts[category.id] || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Created */}
                <div className="col-span-2 text-sm text-slate-400">
                  {new Date(category.createdAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <MuiIcons.Edit style={{ fontSize: 18 }} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
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

export default ManageCategories;
