import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardLayoutItem, DashboardPage } from '../types';

// Default layout for the dashboard
// Layout: Wide modules (Habit Matrix, Weekly Tasks) on left, narrow utility modules on right
// Per issue #40: Left (wide) = Habit Matrix + Weekly Tasks, Right (narrow) = Priorities/Time Blocks + Quick Capture
const DEFAULT_LAYOUT: DashboardLayoutItem[] = [
  // Left column (wide) - 18 columns
  { i: 'habit-matrix', x: 0, y: 0, w: 18, h: 10, minW: 8, minH: 6 },
  { i: 'weekly-kanban', x: 0, y: 10, w: 18, h: 8, minW: 6, minH: 4 },
  // Right column (narrow) - 6 columns: Priorities/Time Blocks, Quick Capture, Progress Tracker
  { i: 'time-blocks', x: 18, y: 0, w: 6, h: 7, minW: 4, minH: 4 },
  { i: 'parking-lot', x: 18, y: 7, w: 6, h: 5, minW: 4, minH: 3 },
  { i: 'target-graph', x: 18, y: 12, w: 6, h: 6, minW: 4, minH: 4 },
];

// Default "Today" page
const DEFAULT_TODAY_PAGE: DashboardPage = {
  id: 'today',
  name: 'Today',
  icon: 'Today',
  iconColor: '#14b8a6',
  layout: DEFAULT_LAYOUT,
  collapsedWidgets: {},
  sortOrder: 0,
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Height for collapsed widgets (title bar only - approximately 40px at 30px row height)
const COLLAPSED_HEIGHT = 2;

// Maximum number of undo states to keep
const MAX_UNDO_HISTORY = 20;

interface LayoutSnapshot {
  layout: DashboardLayoutItem[];
  collapsedWidgets: Record<string, number>;
}

interface DashboardStore {
  // State
  layout: DashboardLayoutItem[];
  activeWidgetId: string | null;
  isEditMode: boolean;
  // Map of widget id to original height (before collapse)
  collapsedWidgets: Record<string, number>;
  // Undo history - stores previous layout states
  layoutHistory: LayoutSnapshot[];
  // Flag to track if there are unsaved changes
  hasUnsavedChanges: boolean;

  // Dashboard pages state (issue #59)
  pages: DashboardPage[];
  activePageId: string;

  // Actions
  setLayout: (layout: DashboardLayoutItem[]) => void;
  setActiveWidget: (id: string | null) => void;
  toggleEditMode: () => void;
  resetLayout: () => void;
  updateWidgetPosition: (id: string, updates: Partial<DashboardLayoutItem>) => void;
  toggleWidgetCollapse: (widgetId: string) => void;
  addWidget: (widgetId: string, defaultSize: { w: number; h: number }, minSize: { w: number; h: number }) => void;
  removeWidget: (widgetId: string) => void;
  isWidgetOnDashboard: (widgetId: string) => boolean;
  // Undo functionality
  undoLayoutChange: () => void;
  canUndo: () => boolean;
  saveLayoutSnapshot: () => void;
  clearHistory: () => void;

  // Dashboard pages actions (issue #59)
  setActivePage: (pageId: string) => void;
  createPage: (name: string, icon?: string, iconColor?: string) => DashboardPage;
  updatePage: (pageId: string, updates: Partial<DashboardPage>) => void;
  deletePage: (pageId: string) => void;
  reorderPages: (pageIds: string[]) => void;
  getActivePage: () => DashboardPage;
  getPageById: (pageId: string) => DashboardPage | undefined;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      layout: DEFAULT_LAYOUT,
      activeWidgetId: null,
      isEditMode: false,
      collapsedWidgets: {},
      layoutHistory: [],
      hasUnsavedChanges: false,

      // Dashboard pages state (issue #59)
      pages: [DEFAULT_TODAY_PAGE],
      activePageId: 'today',

      setLayout: (layout) => {
        const state = get();
        // Save current state to history before changing
        const newHistory = [
          ...state.layoutHistory,
          { layout: state.layout, collapsedWidgets: state.collapsedWidgets }
        ].slice(-MAX_UNDO_HISTORY);
        set({ layout, layoutHistory: newHistory, hasUnsavedChanges: true });
      },

      setActiveWidget: (id) => set({ activeWidgetId: id }),

      toggleEditMode: () => set((state) => {
        // When exiting edit mode, clear undo history and mark as saved
        if (state.isEditMode) {
          return { isEditMode: false, layoutHistory: [], hasUnsavedChanges: false };
        }
        // When entering edit mode, save initial snapshot for potential undo
        return {
          isEditMode: true,
          layoutHistory: [{ layout: state.layout, collapsedWidgets: state.collapsedWidgets }]
        };
      }),

      resetLayout: () => {
        const state = get();
        // Save current state to history before resetting
        const newHistory = [
          ...state.layoutHistory,
          { layout: state.layout, collapsedWidgets: state.collapsedWidgets }
        ].slice(-MAX_UNDO_HISTORY);
        set({ layout: DEFAULT_LAYOUT, collapsedWidgets: {}, layoutHistory: newHistory, hasUnsavedChanges: true });
      },

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

      // Undo functionality
      undoLayoutChange: () => {
        const state = get();
        if (state.layoutHistory.length <= 1) return; // Keep at least the initial snapshot

        const newHistory = [...state.layoutHistory];
        const previousSnapshot = newHistory.pop();

        if (previousSnapshot) {
          set({
            layout: previousSnapshot.layout,
            collapsedWidgets: previousSnapshot.collapsedWidgets,
            layoutHistory: newHistory,
            hasUnsavedChanges: newHistory.length > 1,
          });
        }
      },

      canUndo: () => {
        const state = get();
        return state.layoutHistory.length > 1;
      },

      saveLayoutSnapshot: () => {
        const state = get();
        const newHistory = [
          ...state.layoutHistory,
          { layout: state.layout, collapsedWidgets: state.collapsedWidgets }
        ].slice(-MAX_UNDO_HISTORY);
        set({ layoutHistory: newHistory });
      },

      clearHistory: () => set({ layoutHistory: [], hasUnsavedChanges: false }),

      // Dashboard pages actions (issue #59)
      setActivePage: (pageId: string) => {
        const state = get();
        const page = state.pages.find(p => p.id === pageId);
        if (!page) return;

        // Save current page layout before switching
        const updatedPages = state.pages.map(p =>
          p.id === state.activePageId
            ? { ...p, layout: state.layout, collapsedWidgets: state.collapsedWidgets, updatedAt: new Date().toISOString() }
            : p
        );

        set({
          pages: updatedPages,
          activePageId: pageId,
          layout: page.layout,
          collapsedWidgets: page.collapsedWidgets,
          layoutHistory: [],
          hasUnsavedChanges: false,
        });
      },

      createPage: (name: string, icon?: string, iconColor?: string) => {
        const state = get();
        const newPage: DashboardPage = {
          id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          icon: icon || 'Dashboard',
          iconColor: iconColor || '#6366f1',
          layout: [], // Start with empty layout
          collapsedWidgets: {},
          sortOrder: state.pages.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ pages: [...state.pages, newPage] });
        return newPage;
      },

      updatePage: (pageId: string, updates: Partial<DashboardPage>) => {
        const state = get();
        const updatedPages = state.pages.map(p =>
          p.id === pageId
            ? { ...p, ...updates, updatedAt: new Date().toISOString() }
            : p
        );
        set({ pages: updatedPages });

        // If updating the active page's layout, also update the current layout
        if (pageId === state.activePageId && updates.layout) {
          set({ layout: updates.layout });
        }
        if (pageId === state.activePageId && updates.collapsedWidgets) {
          set({ collapsedWidgets: updates.collapsedWidgets });
        }
      },

      deletePage: (pageId: string) => {
        const state = get();
        // Cannot delete the default page
        const page = state.pages.find(p => p.id === pageId);
        if (!page || page.isDefault) return;

        const updatedPages = state.pages.filter(p => p.id !== pageId);

        // If deleting the active page, switch to the default page
        if (state.activePageId === pageId) {
          const defaultPage = updatedPages.find(p => p.isDefault) || updatedPages[0];
          set({
            pages: updatedPages,
            activePageId: defaultPage.id,
            layout: defaultPage.layout,
            collapsedWidgets: defaultPage.collapsedWidgets,
          });
        } else {
          set({ pages: updatedPages });
        }
      },

      reorderPages: (pageIds: string[]) => {
        const state = get();
        const reorderedPages = pageIds.map((id, index) => {
          const page = state.pages.find(p => p.id === id);
          return page ? { ...page, sortOrder: index } : null;
        }).filter(Boolean) as DashboardPage[];

        set({ pages: reorderedPages });
      },

      getActivePage: () => {
        const state = get();
        return state.pages.find(p => p.id === state.activePageId) || DEFAULT_TODAY_PAGE;
      },

      getPageById: (pageId: string) => {
        const state = get();
        return state.pages.find(p => p.id === pageId);
      },

    }),
    {
      name: 'habitarcade-dashboard',
    }
  )
);

export { DEFAULT_LAYOUT, COLLAPSED_HEIGHT, DEFAULT_TODAY_PAGE };
