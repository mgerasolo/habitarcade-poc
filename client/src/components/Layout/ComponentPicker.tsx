import { useCallback } from 'react';
import { useDashboardStore } from '../../stores';
import { WIDGET_META, getAvailableWidgets } from '../Dashboard/WidgetRegistry';
import type { WidgetMeta } from '../Dashboard/WidgetRegistry';

/**
 * ComponentPicker - Widget selection panel for edit mode
 *
 * Displays available widgets that can be added to the dashboard.
 * Each widget shows its icon, title, and an "Add" button.
 */
export function ComponentPicker() {
  const { addWidget, isWidgetOnDashboard } = useDashboardStore();

  // Get all available widget IDs
  const widgetIds = getAvailableWidgets();

  // Handle adding a widget to the dashboard
  const handleAddWidget = useCallback(
    (meta: WidgetMeta) => {
      addWidget(meta.id, meta.defaultSize, meta.minSize);
    },
    [addWidget]
  );

  return (
    <div className="space-y-4" data-testid="component-picker">
      <p className="text-sm text-slate-400">
        Add widgets to your dashboard. Click the Add button to place a widget.
      </p>

      {/* Widget grid */}
      <div className="grid grid-cols-1 gap-3" data-testid="widget-list">
        {widgetIds.map((widgetId) => {
          const meta = WIDGET_META[widgetId];
          if (!meta) return null;

          const isOnDashboard = isWidgetOnDashboard(widgetId);

          return (
            <div
              key={widgetId}
              className={`
                p-3 rounded-lg border transition-all duration-150
                ${isOnDashboard
                  ? 'bg-slate-700/30 border-slate-600/50 opacity-60'
                  : 'bg-slate-700/50 border-slate-600/50 hover:border-teal-500/50 hover:bg-slate-700/70'
                }
              `}
              data-testid={`widget-card-${widgetId}`}
            >
              <div className="flex items-start gap-3">
                {/* Widget icon */}
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isOnDashboard
                      ? 'bg-slate-600/50 text-slate-400'
                      : 'bg-teal-600/20 text-teal-400'
                    }
                  `}
                >
                  {meta.icon}
                </div>

                {/* Widget info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-200 truncate">
                    {meta.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {meta.description}
                  </p>
                </div>

                {/* Add button */}
                <button
                  onClick={() => handleAddWidget(meta)}
                  disabled={isOnDashboard}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0
                    ${isOnDashboard
                      ? 'bg-slate-600/50 text-slate-500 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-500 text-white'
                    }
                  `}
                  data-testid={`add-widget-${widgetId}`}
                  aria-label={isOnDashboard ? `${meta.title} already on dashboard` : `Add ${meta.title}`}
                >
                  {isOnDashboard ? 'Added' : 'Add'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Widget count */}
      <div className="text-xs text-slate-500 text-center">
        {widgetIds.length} widgets available
      </div>
    </div>
  );
}

export default ComponentPicker;
