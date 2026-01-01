import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardLayoutItem } from '../types';

// Default layout for the dashboard
const DEFAULT_LAYOUT: DashboardLayoutItem[] = [
  { i: 'habit-matrix', x: 0, y: 0, w: 16, h: 12, minW: 8, minH: 6 },
  { i: 'weekly-kanban', x: 16, y: 0, w: 8, h: 8, minW: 6, minH: 4 },
  { i: 'time-blocks', x: 16, y: 8, w: 8, h: 8, minW: 4, minH: 4 },
  { i: 'target-graph', x: 0, y: 12, w: 12, h: 6, minW: 6, minH: 4 },
  { i: 'parking-lot', x: 12, y: 12, w: 12, h: 6, minW: 4, minH: 3 },
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

  // Actions
  setLayout: (layout: DashboardLayoutItem[]) => void;
  setActiveWidget: (id: string | null) => void;
  toggleEditMode: () => void;
  resetLayout: () => void;
  updateWidgetPosition: (id: string, updates: Partial<DashboardLayoutItem>) => void;
  toggleWidgetCollapse: (widgetId: string) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      layout: DEFAULT_LAYOUT,
      activeWidgetId: null,
      isEditMode: false,
      collapsedWidgets: {},

      setLayout: (layout) => set({ layout }),

      setActiveWidget: (id) => set({ activeWidgetId: id }),

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      resetLayout: () => set({ layout: DEFAULT_LAYOUT, collapsedWidgets: {} }),

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

    }),
    {
      name: 'habitarcade-dashboard',
    }
  )
);

export { DEFAULT_LAYOUT, COLLAPSED_HEIGHT };
