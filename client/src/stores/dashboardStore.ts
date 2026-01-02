import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardLayoutItem } from '../types';

// Default layout for the dashboard
// Layout: Wide modules (Habit Matrix, Weekly Tasks) on left, narrow modules on right
const DEFAULT_LAYOUT: DashboardLayoutItem[] = [
  // Left column (wide) - 18 columns
  { i: 'habit-matrix', x: 0, y: 0, w: 18, h: 10, minW: 8, minH: 6 },
  { i: 'weekly-kanban', x: 0, y: 10, w: 18, h: 8, minW: 6, minH: 4 },
  // Right column (narrow) - 6 columns
  { i: 'target-graph', x: 18, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
  { i: 'time-blocks', x: 18, y: 6, w: 6, h: 6, minW: 4, minH: 4 },
  { i: 'parking-lot', x: 18, y: 12, w: 6, h: 6, minW: 4, minH: 3 },
];

// Height for collapsed widgets (title bar only - approximately 40px at 30px row height)
const COLLAPSED_HEIGHT = 2;

interface DashboardStore {
  // State
  layout: DashboardLayoutItem[];
  activeWidgetId: string | null;
  isEditMode: boolean;
  // Map of widget id to original height (before collapse)
  collapsedWidgets: Record<string, number>;
  // Undo stack for edit mode - stores previous layouts
  layoutHistory: DashboardLayoutItem[][];
  // Layout before entering edit mode (for cancel/discard)
  layoutBeforeEdit: DashboardLayoutItem[] | null;
  // Flag to track if changes were made during edit session
  hasUnsavedChanges: boolean;

  // Actions
  setLayout: (layout: DashboardLayoutItem[]) => void;
  setActiveWidget: (id: string | null) => void;
  toggleEditMode: () => void;
  saveAndExitEditMode: () => void;
  discardAndExitEditMode: () => void;
  resetLayout: () => void;
  undoLayoutChange: () => void;
  updateWidgetPosition: (id: string, updates: Partial<DashboardLayoutItem>) => void;
  toggleWidgetCollapse: (widgetId: string) => void;
  addWidget: (widgetId: string, defaultSize: { w: number; h: number }, minSize: { w: number; h: number }) => void;
  removeWidget: (widgetId: string) => void;
  isWidgetOnDashboard: (widgetId: string) => boolean;
  canUndo: () => boolean;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      layout: DEFAULT_LAYOUT,
      activeWidgetId: null,
      isEditMode: false,
      collapsedWidgets: {},
      layoutHistory: [],
      layoutBeforeEdit: null,
      hasUnsavedChanges: false,

      setLayout: (layout) => {
        const state = get();
        // Only track history in edit mode and add current layout to history before change
        if (state.isEditMode) {
          const currentLayout = state.layout;
          // Only add to history if layout actually changed
          const layoutChanged = JSON.stringify(currentLayout) !== JSON.stringify(layout);
          if (layoutChanged) {
            set({
              layout,
              layoutHistory: [...state.layoutHistory, currentLayout].slice(-20), // Keep last 20 states
              hasUnsavedChanges: true,
            });
            return;
          }
        }
        set({ layout });
      },

      setActiveWidget: (id) => set({ activeWidgetId: id }),

      toggleEditMode: () => {
        const state = get();
        if (!state.isEditMode) {
          // Entering edit mode - save current layout as backup
          set({
            isEditMode: true,
            layoutBeforeEdit: [...state.layout],
            layoutHistory: [],
            hasUnsavedChanges: false,
          });
        } else {
          // Exiting edit mode via toggle (treat as save)
          set({
            isEditMode: false,
            layoutBeforeEdit: null,
            layoutHistory: [],
            hasUnsavedChanges: false,
          });
        }
      },

      saveAndExitEditMode: () => set({
        isEditMode: false,
        layoutBeforeEdit: null,
        layoutHistory: [],
        hasUnsavedChanges: false,
      }),

      discardAndExitEditMode: () => {
        const state = get();
        set({
          isEditMode: false,
          layout: state.layoutBeforeEdit || state.layout,
          layoutBeforeEdit: null,
          layoutHistory: [],
          hasUnsavedChanges: false,
        });
      },

      resetLayout: () => set({ layout: DEFAULT_LAYOUT, collapsedWidgets: {}, hasUnsavedChanges: true }),

      undoLayoutChange: () => {
        const state = get();
        if (state.layoutHistory.length === 0) return;

        const previousLayout = state.layoutHistory[state.layoutHistory.length - 1];
        const newHistory = state.layoutHistory.slice(0, -1);

        set({
          layout: previousLayout,
          layoutHistory: newHistory,
          hasUnsavedChanges: newHistory.length > 0 || JSON.stringify(previousLayout) !== JSON.stringify(state.layoutBeforeEdit),
        });
      },

      canUndo: () => get().layoutHistory.length > 0,

      updateWidgetPosition: (id, updates) => set((state) => ({
        layout: state.layout.map((item) =>
          item.i === id ? { ...item, ...updates } : item
        ),
      })),

      toggleWidgetCollapse: (widgetId: string) => {
        const state = get();
        const isCurrentlyCollapsed = widgetId in state.collapsedWidgets;

        if (isCurrentlyCollapsed) {
          // Expand: restore original height
          const originalHeight = state.collapsedWidgets[widgetId];
          const newCollapsedWidgets = { ...state.collapsedWidgets };
          delete newCollapsedWidgets[widgetId];

          set({
            collapsedWidgets: newCollapsedWidgets,
            layout: state.layout.map((item) =>
              item.i === widgetId ? { ...item, h: originalHeight } : item
            ),
          });
        } else {
          // Collapse: save original height and set to collapsed height
          const widget = state.layout.find((item) => item.i === widgetId);
          if (widget) {
            set({
              collapsedWidgets: { ...state.collapsedWidgets, [widgetId]: widget.h },
              layout: state.layout.map((item) =>
                item.i === widgetId ? { ...item, h: COLLAPSED_HEIGHT } : item
              ),
            });
          }
        }
      },

      addWidget: (widgetId: string, defaultSize: { w: number; h: number }, minSize: { w: number; h: number }) => {
        const state = get();
        // Check if widget already exists
        if (state.layout.some((item) => item.i === widgetId)) {
          return;
        }

        // Find the lowest y position to add widget below existing ones
        const maxY = state.layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);

        const newWidget: DashboardLayoutItem = {
          i: widgetId,
          x: 0,
          y: maxY,
          w: defaultSize.w,
          h: defaultSize.h,
          minW: minSize.w,
          minH: minSize.h,
        };

        set({ layout: [...state.layout, newWidget] });
      },

      removeWidget: (widgetId: string) => {
        const state = get();
        // Remove from layout
        const newLayout = state.layout.filter((item) => item.i !== widgetId);
        // Also remove from collapsed widgets if present
        const newCollapsedWidgets = { ...state.collapsedWidgets };
        delete newCollapsedWidgets[widgetId];

        set({
          layout: newLayout,
          collapsedWidgets: newCollapsedWidgets,
          // Clear active widget if it was the removed one
          activeWidgetId: state.activeWidgetId === widgetId ? null : state.activeWidgetId,
        });
      },

      isWidgetOnDashboard: (widgetId: string) => {
        const state = get();
        return state.layout.some((item) => item.i === widgetId);
      },

    }),
    {
      name: 'habitarcade-dashboard',
    }
  )
);

export { DEFAULT_LAYOUT, COLLAPSED_HEIGHT };
