import { useState, useMemo } from 'react';
import { WIDGET_META, type WidgetMeta } from './WidgetRegistry';
import { useDashboardStore } from '../../stores';

interface WidgetCatalogProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryType = 'all' | 'productivity' | 'tracking' | 'inspiration';

interface WidgetCategory {
  id: CategoryType;
  label: string;
  description: string;
}

const CATEGORIES: WidgetCategory[] = [
  { id: 'all', label: 'All Widgets', description: 'Browse all available widgets' },
  { id: 'productivity', label: 'Productivity', description: 'Task and time management' },
  { id: 'tracking', label: 'Tracking', description: 'Habits and progress tracking' },
  { id: 'inspiration', label: 'Inspiration', description: 'Quotes and motivation' },
];

// Map widgets to categories
const WIDGET_CATEGORIES: Record<string, CategoryType[]> = {
  'habit-matrix': ['tracking'],
  'weekly-kanban': ['productivity'],
  'time-blocks': ['productivity'],
  'target-graph': ['tracking'],
  'parking-lot': ['productivity'],
  'priorities': ['productivity'],
  'quotes': ['inspiration'],
  'videos': ['inspiration'],
};

/**
 * WidgetCatalog - Modal component for browsing and adding widgets to dashboard
 *
 * Features:
 * - Browse widgets by category
 * - Search/filter widgets
 * - Preview widget appearance
 * - Add widgets to dashboard with one click
 * - Shows which widgets are already on dashboard
 */
export function WidgetCatalog({ isOpen, onClose }: WidgetCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');

  const { addWidget, removeWidget, isWidgetOnDashboard } = useDashboardStore();

  // Get all available widgets from registry
  const allWidgets = useMemo(() => Object.values(WIDGET_META), []);

  // Filter widgets by search and category
  const filteredWidgets = useMemo(() => {
    return allWidgets.filter((widget) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        widget.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const widgetCategories = WIDGET_CATEGORIES[widget.id] || [];
      const matchesCategory =
        activeCategory === 'all' || widgetCategories.includes(activeCategory);

      return matchesSearch && matchesCategory;
    });
  }, [allWidgets, searchQuery, activeCategory]);

  const handleAddWidget = (widget: WidgetMeta) => {
    addWidget(widget.id, widget.defaultSize, widget.minSize);
  };

  const handleRemoveWidget = (widgetId: string) => {
    removeWidget(widgetId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative z-10 w-full max-w-4xl max-h-[85vh]
          bg-slate-800 border border-slate-700/50 rounded-2xl
          shadow-2xl shadow-black/50
          flex flex-col overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div>
            <h2 className="text-xl font-condensed font-bold text-slate-100">
              Widget Catalog
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Browse and add widgets to customize your dashboard
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and filters */}
        <div className="px-6 py-4 border-b border-slate-700/30 space-y-4">
          {/* Search input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search widgets..."
              className="
                w-full pl-10 pr-4 py-2.5 rounded-xl
                bg-slate-900/50 border border-slate-700/50
                text-slate-200 placeholder-slate-500
                focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
                transition-all duration-150
              "
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                  transition-all duration-150
                  ${
                    activeCategory === category.id
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Widget grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredWidgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-condensed text-lg text-slate-300 font-medium mb-2">
                No widgets found
              </h3>
              <p className="text-sm text-slate-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWidgets.map((widget) => {
                const isOnDashboard = isWidgetOnDashboard(widget.id);
                return (
                  <WidgetCard
                    key={widget.id}
                    widget={widget}
                    isOnDashboard={isOnDashboard}
                    onAdd={() => handleAddWidget(widget)}
                    onRemove={() => handleRemoveWidget(widget.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {filteredWidgets.length} widget{filteredWidgets.length !== 1 ? 's' : ''} available
            </p>
            <button
              onClick={onClose}
              className="
                px-4 py-2 rounded-lg
                bg-slate-700 hover:bg-slate-600
                text-white text-sm font-medium
                transition-colors duration-150
              "
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Widget card component for catalog display
 */
interface WidgetCardProps {
  widget: WidgetMeta;
  isOnDashboard: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

function WidgetCard({ widget, isOnDashboard, onAdd, onRemove }: WidgetCardProps) {
  return (
    <div
      className={`
        relative group p-4 rounded-xl
        border transition-all duration-200
        ${
          isOnDashboard
            ? 'bg-teal-900/20 border-teal-500/30'
            : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/70'
        }
      `}
    >
      {/* On dashboard badge */}
      {isOnDashboard && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-teal-500/20 text-teal-400 rounded-full">
            Active
          </span>
        </div>
      )}

      {/* Widget icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
            ${isOnDashboard ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700/50 text-slate-400'}
          `}
        >
          {widget.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-condensed font-semibold text-slate-200 truncate">
            {widget.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {widget.defaultSize.w}x{widget.defaultSize.h} grid units
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 mb-4 line-clamp-2">
        {widget.description}
      </p>

      {/* Action button */}
      {isOnDashboard ? (
        <button
          onClick={onRemove}
          className="
            w-full py-2 rounded-lg
            bg-slate-700/50 hover:bg-red-600/20 hover:text-red-400
            text-slate-300 text-sm font-medium
            border border-slate-600/50 hover:border-red-500/30
            transition-all duration-150
            flex items-center justify-center gap-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          Remove from Dashboard
        </button>
      ) : (
        <button
          onClick={onAdd}
          className="
            w-full py-2 rounded-lg
            bg-teal-600/20 hover:bg-teal-600
            text-teal-400 hover:text-white text-sm font-medium
            border border-teal-500/30 hover:border-teal-500
            transition-all duration-150
            flex items-center justify-center gap-2
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add to Dashboard
        </button>
      )}
    </div>
  );
}

export default WidgetCatalog;
