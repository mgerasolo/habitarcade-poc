import { useCallback, useState, useEffect, useRef } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useDashboardStore, COLLAPSED_HEIGHT } from '../../stores';
import { WidgetContainer } from './WidgetContainer';
import { getWidget, useHabitMatrixHeaderControls } from './WidgetRegistry';
import type { DashboardLayoutItem } from '../../types';
import type { CustomHeaderControls } from './WidgetContainer';

// Default grid configuration
const GRID_COLS = 24;
const ROW_HEIGHT = 30;
const GRID_MARGIN: [number, number] = [12, 12];

/**
 * Dashboard - Main dashboard layout with draggable/resizable widgets
 *
 * Features:
 * - 24-column responsive grid layout using react-grid-layout
 * - Persisted layout via useDashboardStore (localStorage)
 * - Edit mode toggle for drag/resize
 * - Automatic layout saving on change
 * - Vertical compaction for optimal space usage
 */
export function Dashboard() {
  const { layout, setLayout, isEditMode, collapsedWidgets } = useDashboardStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1800);

  // Get header controls for habit-matrix widget
  const { headerControls: habitMatrixHeaderControls, responsiveDays } = useHabitMatrixHeaderControls();

  // Function to get header controls for a specific widget
  const getHeaderControls = useCallback((widgetId: string): CustomHeaderControls | undefined => {
    if (widgetId === 'habit-matrix') {
      return habitMatrixHeaderControls;
    }
    return undefined;
  }, [habitMatrixHeaderControls]);

  // Create a layout with proper heights for collapsed widgets
  // This is derived from the store layout and ensures react-grid-layout sees correct heights
  const effectiveLayout = layout.map((item) => ({
    ...item,
    // Ensure collapsed widgets have the correct height
    h: item.i in collapsedWidgets ? COLLAPSED_HEIGHT : item.h,
    // Disable resizing for collapsed widgets
    isResizable: !(item.i in collapsedWidgets),
  }));

  // Track container width for responsive grid
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 32; // Subtract padding
        setContainerWidth(Math.max(width, 800)); // Minimum width
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Handle layout changes from drag/resize operations
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      // Note: We don't check isEditMode here because:
      // 1. Resizing/dragging can only happen when isResizable/isDraggable is true (edit mode)
      // 2. Checking isEditMode here causes a race condition when user clicks "Done" -
      //    the final onLayoutChange event may fire AFTER isEditMode becomes false,
      //    causing the last resize to not be saved.
      // 3. We only save if layout actually changed to prevent unnecessary writes

      const updatedLayout = newLayout.map((item) => {
        const originalItem = layout.find((l) => l.i === item.i);
        const isCollapsed = item.i in collapsedWidgets;

        return {
          i: item.i,
          x: item.x,
          y: item.y,
          w: item.w,
          // Preserve collapsed height for collapsed widgets
          h: isCollapsed ? COLLAPSED_HEIGHT : item.h,
          minW: originalItem?.minW,
          // Override minH for collapsed widgets to allow small height
          minH: isCollapsed ? COLLAPSED_HEIGHT : originalItem?.minH,
          maxW: originalItem?.maxW,
          maxH: originalItem?.maxH,
        };
      });

      // Only save if layout actually changed (prevents unnecessary writes on initial render)
      const hasChanged = updatedLayout.some((item, index) => {
        const current = layout[index];
        if (!current || current.i !== item.i) return true;
        return current.x !== item.x || current.y !== item.y ||
               current.w !== item.w || current.h !== item.h;
      });

      if (hasChanged) {
        setLayout(updatedLayout as DashboardLayoutItem[]);
      }
    },
    [layout, setLayout, collapsedWidgets]
  );

  // Handle drag start - could be used for visual feedback
  const handleDragStart = useCallback(() => {
    document.body.classList.add('cursor-grabbing');
  }, []);

  // Handle drag stop
  const handleDragStop = useCallback(() => {
    document.body.classList.remove('cursor-grabbing');
  }, []);

  return (
    <div data-testid="dashboard-page">
      {/* Grid layout container */}
      <div ref={containerRef}>
        <GridLayout
          className="layout"
          layout={effectiveLayout}
          cols={GRID_COLS}
          rowHeight={ROW_HEIGHT}
          width={containerWidth}
          margin={GRID_MARGIN}
          onLayoutChange={handleLayoutChange}
          onDragStart={handleDragStart}
          onDragStop={handleDragStop}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          draggableHandle=".drag-handle"
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms={true}
          resizeHandles={['s', 'e', 'se']}
        >
          {layout.map((item) => {
            const isCollapsed = item.i in collapsedWidgets;
            return (
            <div
              key={item.i}
              className={`widget-wrapper ${isCollapsed ? 'is-collapsed' : ''}`}
              data-widget-id={item.i}
              data-testid={`widget-${item.i}`}
            >
              <WidgetContainer
                widgetId={item.i}
                headerControls={getHeaderControls(item.i)}
              >
                {getWidget(item.i, item.i === 'habit-matrix' ? { daysToShow: responsiveDays } : undefined)}
              </WidgetContainer>
            </div>
          );
          })}
        </GridLayout>
      </div>

      {/* Edit mode indicator overlay */}
      {isEditMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className="
              px-6 py-3 rounded-full
              bg-teal-600/90 backdrop-blur
              text-white font-condensed font-medium
              shadow-lg shadow-teal-500/30
              flex items-center gap-3
              animate-pulse
            "
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <span>Edit Mode Active</span>
            <span className="text-teal-200 text-sm">Drag widgets to rearrange</span>
          </div>
        </div>
      )}

      {/* Grid overlay when in edit mode */}
      {isEditMode && (
        <div
          className="
            fixed inset-0 pointer-events-none z-10
            bg-[linear-gradient(to_right,rgba(45,212,191,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,212,191,0.03)_1px,transparent_1px)]
            bg-[size:calc(100%/24)_30px]
          "
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default Dashboard;
