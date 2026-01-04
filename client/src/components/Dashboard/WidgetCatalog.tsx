import { useState, useMemo, useCallback } from 'react';
import { useUIStore, useDashboardStore } from '../../stores';
import { WIDGET_META, getAvailableWidgets } from './WidgetRegistry';
import type { WidgetMeta } from './WidgetRegistry';
import * as MuiIcons from '@mui/icons-material';

// Widget categories for filtering
type WidgetCategory = 'all' | 'tracking' | 'productivity' | 'content' | 'utility';

interface CategoryMeta {
  label: string;
  icon: keyof typeof MuiIcons;
  description: string;
}

const CATEGORIES: Record<WidgetCategory, CategoryMeta> = {
  all: { label: 'All Widgets', icon: 'Apps', description: 'View all available widgets' },
  tracking: { label: 'Tracking', icon: 'Timeline', description: 'Track habits, goals, and progress' },
  productivity: { label: 'Productivity', icon: 'WorkspacePremium', description: 'Task management and time blocking' },
  content: { label: 'Content', icon: 'AutoStories', description: 'Quotes, videos, and inspiration' },
  utility: { label: 'Utility', icon: 'Build', description: 'Quick capture and notes' },
};

// Map widgets to categories
const WIDGET_CATEGORIES: Record<string, WidgetCategory> = {
  'habit-matrix': 'tracking',
  'target-graph': 'tracking',
  'weekly-kanban': 'productivity',
  'time-blocks': 'productivity',
  'quotes': 'content',
  'videos': 'content',
  'parking-lot': 'utility',
};

/**
 * WidgetCatalog - Full-screen modal for browsing and adding widgets
 *
 * Features:
 * - Search/filter widgets by name or description
 * - Browse by category
 * - Preview widget appearance
 * - Add/remove widgets from dashboard
 */
export function WidgetCatalog() {
  const { closeModal } = useUIStore();
  const { addWidget, removeWidget, isWidgetOnDashboard } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory>('all');
  const [previewWidget, setPreviewWidget] = useState<string | null>(null);

  // Get all available widget IDs
  const allWidgets = useMemo(() => getAvailableWidgets(), []);

  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    return allWidgets.filter((widgetId) => {
      const meta = WIDGET_META[widgetId];
      if (!meta) return false;

      // Filter by category
      if (selectedCategory !== 'all') {
        const category = WIDGET_CATEGORIES[widgetId] || 'utility';
        if (category !== selectedCategory) return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          meta.title.toLowerCase().includes(query) ||
          meta.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [allWidgets, selectedCategory, searchQuery]);

  // Handle adding/removing a widget
  const handleToggleWidget = useCallback(
    (meta: WidgetMeta) => {
      if (isWidgetOnDashboard(meta.id)) {
        removeWidget(meta.id);
      } else {
        addWidget(meta.id, meta.defaultSize, meta.minSize);
      }
    },
    [addWidget, removeWidget, isWidgetOnDashboard]
  );

  // Get widget count per category
  const categoryWidgetCounts = useMemo(() => {
    const counts: Record<WidgetCategory, number> = {
      all: allWidgets.length,
      tracking: 0,
      productivity: 0,
      content: 0,
      utility: 0,
    };
    allWidgets.forEach((widgetId) => {
      const category = WIDGET_CATEGORIES[widgetId] || 'utility';
      counts[category]++;
    });
    return counts;
  }, [allWidgets]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
      data-testid="widget-catalog-modal"
    >
      <div
        className="bg-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-slate-700 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                <MuiIcons.Widgets style={{ color: 'white', fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Widget Catalog</h2>
                <p className="text-sm text-slate-400">Browse and add widgets to your dashboard</p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="w-8 h-8 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors flex items-center justify-center"
              data-testid="close-catalog"
            >
              <MuiIcons.Close style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Search bar */}
          <div className="mt-4 relative">
            <MuiIcons.Search
              style={{ fontSize: 20 }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              data-testid="widget-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <MuiIcons.Clear style={{ fontSize: 18 }} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Category sidebar */}
          <div className="w-56 border-r border-slate-700 p-3 flex-shrink-0 overflow-y-auto">
            <div className="space-y-1">
              {(Object.keys(CATEGORIES) as WidgetCategory[]).map((category) => {
                const meta = CATEGORIES[category];
                const IconComponent = MuiIcons[meta.icon] as React.ComponentType<{
                  style?: React.CSSProperties;
                  className?: string;
                }>;
                const isActive = selectedCategory === category;
                const count = categoryWidgetCounts[category];

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors
                      ${isActive
                        ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border border-transparent'
                      }
                    `}
                    data-testid={`category-${category}`}
                  >
                    <IconComponent style={{ fontSize: 18 }} />
                    <span className="flex-1 text-sm font-medium">{meta.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-teal-500/20' : 'bg-slate-700'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {filteredWidgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MuiIcons.SearchOff style={{ fontSize: 48 }} className="mb-3 opacity-50" />
                <p className="text-lg font-medium">No widgets found</p>
                <p className="text-sm">Try a different search term or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWidgets.map((widgetId) => {
                  const meta = WIDGET_META[widgetId];
                  if (!meta) return null;

                  const isOnDashboard = isWidgetOnDashboard(widgetId);
                  const isPreview = previewWidget === widgetId;

                  return (
                    <div
                      key={widgetId}
                      className={`
                        relative rounded-xl border overflow-hidden transition-all duration-200
                        ${isOnDashboard
                          ? 'bg-teal-900/20 border-teal-500/30'
                          : 'bg-slate-700/30 border-slate-600/50 hover:border-teal-500/50'
                        }
                        ${isPreview ? 'ring-2 ring-teal-500' : ''}
                      `}
                      data-testid={`widget-card-${widgetId}`}
                    >
                      {/* Widget preview area */}
                      <div
                        className="h-32 bg-slate-900/50 flex items-center justify-center cursor-pointer"
                        onClick={() => setPreviewWidget(isPreview ? null : widgetId)}
                      >
                        <div className={`
                          w-16 h-16 rounded-xl flex items-center justify-center
                          ${isOnDashboard ? 'bg-teal-600/30 text-teal-400' : 'bg-slate-700/50 text-slate-400'}
                        `}>
                          {meta.icon}
                        </div>
                      </div>

                      {/* Widget info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-white">{meta.title}</h3>
                          {isOnDashboard && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 flex-shrink-0">
                              Added
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{meta.description}</p>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleWidget(meta)}
                            className={`
                              flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
                              ${isOnDashboard
                                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                : 'bg-teal-600 text-white hover:bg-teal-500'
                              }
                            `}
                            data-testid={`toggle-widget-${widgetId}`}
                          >
                            {isOnDashboard ? (
                              <>
                                <MuiIcons.RemoveCircle style={{ fontSize: 16 }} className="inline mr-1" />
                                Remove
                              </>
                            ) : (
                              <>
                                <MuiIcons.AddCircle style={{ fontSize: 16 }} className="inline mr-1" />
                                Add to Dashboard
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Size info */}
                      <div className="px-4 pb-3 flex items-center gap-4 text-xs text-slate-500">
                        <span>Default: {meta.defaultSize.w}x{meta.defaultSize.h}</span>
                        <span>Min: {meta.minSize.w}x{meta.minSize.h}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-slate-400">
            {filteredWidgets.filter((id) => isWidgetOnDashboard(id)).length} of {filteredWidgets.length} widgets on dashboard
          </p>
          <button
            onClick={closeModal}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors font-medium"
            data-testid="done-button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default WidgetCatalog;
