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

interface DashboardStore {
  // State
  layout: DashboardLayoutItem[];
  activeWidgetId: string | null;
  isEditMode: boolean;

  // Actions
  setLayout: (layout: DashboardLayoutItem[]) => void;
  setActiveWidget: (id: string | null) => void;
  toggleEditMode: () => void;
  resetLayout: () => void;
  updateWidgetPosition: (id: string, updates: Partial<DashboardLayoutItem>) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      layout: DEFAULT_LAYOUT,
      activeWidgetId: null,
      isEditMode: false,

      setLayout: (layout) => set({ layout }),

      setActiveWidget: (id) => set({ activeWidgetId: id }),

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      resetLayout: () => set({ layout: DEFAULT_LAYOUT }),

      updateWidgetPosition: (id, updates) => set((state) => ({
        layout: state.layout.map((item) =>
          item.i === id ? { ...item, ...updates } : item
        ),
      })),
    }),
    {
      name: 'habitarcade-dashboard',
    }
  )
);

export { DEFAULT_LAYOUT };
