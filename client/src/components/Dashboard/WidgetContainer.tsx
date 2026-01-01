import { useCallback, type ReactNode } from 'react';
import { useDashboardStore } from '../../stores';

interface WidgetContainerProps {
  widgetId: string;
  children: ReactNode;
}

// Widget title mapping
const WIDGET_TITLES: Record<string, string> = {
  'habit-matrix': 'Habit Matrix',
  'weekly-kanban': 'Weekly Tasks',
  'time-blocks': 'Time Blocks',
  'target-graph': 'Progress Tracker',
  'parking-lot': 'Quick Capture',
};

// Widget icons (using SVG paths for consistency)
const WIDGET_ICONS: Record<string, ReactNode> = {
  'habit-matrix': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  ),
  'weekly-kanban': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
      />
    </svg>
  ),
  'time-blocks': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  'target-graph': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  ),
  'parking-lot': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
};

/**
 * WidgetContainer - Wrapper component for dashboard widgets
 *
 * Features:
 * - Title bar with widget name and icon
 * - Drag handle for react-grid-layout
 * - Minimize/maximize toggle
 * - Active state highlighting
 * - Edit mode visual indicators
 */
export function WidgetContainer({ widgetId, children }: WidgetContainerProps) {
  const { isEditMode, activeWidgetId, setActiveWidget, toggleWidgetCollapse, collapsedWidgets } = useDashboardStore();
  const isMinimized = widgetId in collapsedWidgets;

  const isActive = activeWidgetId === widgetId;
  const title = WIDGET_TITLES[widgetId] || widgetId;
  const icon = WIDGET_ICONS[widgetId];

  // Handle minimize toggle
  const handleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleWidgetCollapse(widgetId);
    },
    [toggleWidgetCollapse, widgetId]
  );

  // Handle widget click for focus
  const handleClick = useCallback(() => {
    setActiveWidget(widgetId);
  }, [setActiveWidget, widgetId]);

  return (
    <div
      className={`
        h-full flex flex-col
        bg-slate-800/80 backdrop-blur rounded-xl overflow-hidden
        border transition-all duration-200
        ${isActive ? 'border-teal-500 shadow-lg shadow-teal-500/20' : 'border-slate-700/50'}
        ${isEditMode ? 'ring-1 ring-teal-500/20' : ''}
      `}
      onClick={handleClick}
    >
      {/* Header / Drag Handle */}
      <div
        className={`
          drag-handle px-4 py-2 flex items-center justify-between
          bg-gradient-to-r from-slate-700/80 to-slate-800/80
          border-b border-slate-700/50
          select-none flex-shrink-0
          ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        `}
      >
        {/* Title section */}
        <div className="flex items-center gap-2">
          {icon && (
            <span className={`${isActive ? 'text-teal-400' : 'text-slate-400'} transition-colors`}>
              {icon}
            </span>
          )}
          <h3
            className={`
              font-condensed font-semibold text-sm
              ${isActive ? 'text-white' : 'text-slate-200'}
              transition-colors
            `}
          >
            {title}
          </h3>
        </div>

        {/* Controls section */}
        <div className="flex items-center gap-2">
          {/* Edit mode indicator */}
          {isEditMode && (
            <span className="text-xs text-teal-400/70 font-condensed hidden sm:inline">
              Drag to move
            </span>
          )}

          {/* Minimize/Maximize button */}
          <button
            onClick={handleMinimize}
            className="
              p-1 rounded hover:bg-slate-600/50
              text-slate-400 hover:text-slate-200
              transition-colors duration-150
            "
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            )}
          </button>

          {/* Widget menu (placeholder for future features) */}
          <button
            className="
              p-1 rounded hover:bg-slate-600/50
              text-slate-400 hover:text-slate-200
              transition-colors duration-150
            "
            title="Widget options"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div
        className={`
          flex-1 overflow-auto
          transition-all duration-200
          ${isMinimized ? 'h-0 p-0 overflow-hidden' : 'p-3'}
        `}
      >
        {!isMinimized && children}
      </div>

      {/* Resize handle visual indicator (edit mode only) */}
      {isEditMode && !isMinimized && (
        <div
          className="
            absolute bottom-0 right-0
            w-4 h-4 cursor-se-resize
            flex items-end justify-end
            pointer-events-none
          "
          aria-hidden="true"
        >
          <svg
            className="w-3 h-3 text-teal-500/50"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="18" cy="18" r="2" />
            <circle cx="12" cy="18" r="2" />
            <circle cx="18" cy="12" r="2" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default WidgetContainer;
