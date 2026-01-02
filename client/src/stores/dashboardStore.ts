import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardLayoutItem } from '../types';

// Default layout for the main dashboard page
// Layout: Wide modules (Habit Matrix, Weekly Tasks) on left, narrow modules on right
const DEFAULT_MAIN_LAYOUT: DashboardLayoutItem[] = [
  // Left column (wide) - 18 columns
  { i: 'habit-matrix', x: 0, y: 0, w: 18, h: 10, minW: 8, minH: 6 },
  { i: 'weekly-kanban', x: 0, y: 10, w: 18, h: 8, minW: 6, minH: 4 },
  // Right column (narrow) - 6 columns: Priorities, Time Blocks, Quick Capture
  { i: 'priorities', x: 18, y: 0, w: 6, h: 6, minW: 4, minH: 4 },
  { i: 'time-blocks', x: 18, y: 6, w: 6, h: 6, minW: 4, minH: 4 },
  { i: 'parking-lot', x: 18, y: 12, w: 6, h: 6, minW: 4, minH: 3 },
];

// Default layout for the Today page
const DEFAULT_TODAY_LAYOUT: DashboardLayoutItem[] = [
  { i: 'priorities', x: 0, y: 0, w: 8, h: 8, minW: 4, minH: 4 },
  { i: 'time-blocks', x: 8, y: 0, w: 8, h: 8, minW: 4, minH: 4 },
  { i: 'parking-lot', x: 16, y: 0, w: 8, h: 8, minW: 4, minH: 3 },
  { i: 'quotes', x: 0, y: 8, w: 12, h: 6, minW: 4, minH: 4 },
  { i: 'habit-matrix', x: 12, y: 8, w: 12, h: 6, minW: 8, minH: 6 },
];

// Height for collapsed widgets (title bar only - approximately 40px at 30px row height)
const COLLAPSED_HEIGHT = 2;

// Dashboard page type
export interface DashboardPage {
  id: string;
  name: string;
  icon: string;
  layout: DashboardLayoutItem[];
  collapsedWidgets: Record<string, number>;
  isDefault?: boolean;
  sortOrder: number;
}

// Default pages
const DEFAULT_PAGES: DashboardPage[] = [
  {
    id: 'today',
    name: 'Today',
    icon: 'Today',
    layout: DEFAULT_TODAY_LAYOUT,
    collapsedWidgets: {},
    isDefault: true,
    sortOrder: 0,
  },
  {
    id: 'main',
    name: 'Overview',
    icon: 'Dashboard',
    layout: DEFAULT_MAIN_LAYOUT,
    collapsedWidgets: {},
    isDefault: true,
    sortOrder: 1,
  },
];

interface DashboardStore {
  // Multi-page state
  pages: DashboardPage[];
  activePageId: string;

  // Legacy single layout support (for current page)
  layout: DashboardLayoutItem[];
  activeWidgetId: string | null;
  isEditMode: boolean;
  collapsedWidgets: Record<string, number>;

  // Page actions
  setActivePageId: (pageId: string) => void;
  createPage: (name: string, icon?: string) => void;
  deletePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  updatePageIcon: (pageId: string, icon: string) => void;
  reorderPages: (orderedIds: string[]) => void;

  // Layout actions (operate on current page)
  setLayout: (layout: DashboardLayoutItem[]) => void;
  setActiveWidget: (id: string | null) => void;
  toggleEditMode: () => void;
  resetLayout: () => void;
  updateWidgetPosition: (id: string, updates: Partial<DashboardLayoutItem>) => void;
  toggleWidgetCollapse: (widgetId: string) => void;
  addWidget: (widgetId: string, defaultSize: { w: number; h: number }, minSize: { w: number; h: number }) => void;
  removeWidget: (widgetId: string) => void;
  isWidgetOnDashboard: (widgetId: string) => boolean;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Initialize with default pages
      pages: DEFAULT_PAGES,
      activePageId: 'today',

      // Derive layout from current page
      get layout() {
        const state = get();
        const currentPage = state.pages.find(p => p.id === state.activePageId);
        return currentPage?.layout ?? DEFAULT_MAIN_LAYOUT;
      },
      activeWidgetId: null,
      isEditMode: false,
      get collapsedWidgets() {
        const state = get();
        const currentPage = state.pages.find(p => p.id === state.activePageId);
        return currentPage?.collapsedWidgets ?? {};
      },

      // Page actions
      setActivePageId: (pageId) => {
        set({ activePageId: pageId, isEditMode: false });
      },

      createPage: (name, icon = 'Article') => {
        const state = get();
        const newId = `page-${Date.now()}`;
        const maxSortOrder = Math.max(...state.pages.map(p => p.sortOrder), 0);

        const newPage: DashboardPage = {
          id: newId,
          name,
          icon,
          layout: [],
          collapsedWidgets: {},
          sortOrder: maxSortOrder + 1,
        };

        set({
          pages: [...state.pages, newPage],
          activePageId: newId,
        });
      },

      deletePage: (pageId) => {
        const state = get();
        // Don't delete if it's the last page or a default page
        const page = state.pages.find(p => p.id === pageId);
        if (state.pages.length <= 1 || page?.isDefault) return;

        const newPages = state.pages.filter(p => p.id !== pageId);
        const newActiveId = state.activePageId === pageId
          ? newPages[0]?.id ?? 'today'
          : state.activePageId;

        set({
          pages: newPages,
          activePageId: newActiveId,
        });
      },

      renamePage: (pageId, name) => {
        set((state) => ({
          pages: state.pages.map(p =>
            p.id === pageId ? { ...p, name } : p
          ),
        }));
      },

      updatePageIcon: (pageId, icon) => {
        set((state) => ({
          pages: state.pages.map(p =>
            p.id === pageId ? { ...p, icon } : p
          ),
        }));
      },

      reorderPages: (orderedIds) => {
        set((state) => ({
          pages: state.pages.map(p => ({
            ...p,
            sortOrder: orderedIds.indexOf(p.id),
          })).sort((a, b) => a.sortOrder - b.sortOrder),
        }));
      },

      // Layout actions - operate on current page
      setLayout: (layout) => {
        const state = get();
        set({
          pages: state.pages.map(p =>
            p.id === state.activePageId ? { ...p, layout } : p
          ),
        });
      },

      setActiveWidget: (id) => set({ activeWidgetId: id }),

      toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),

      resetLayout: () => {
        const state = get();
        const currentPage = state.pages.find(p => p.id === state.activePageId);
        if (!currentPage) return;

        // Get default layout for this page
        const defaultLayout = currentPage.id === 'today'
          ? DEFAULT_TODAY_LAYOUT
          : currentPage.id === 'main'
          ? DEFAULT_MAIN_LAYOUT
          : [];

        set({
          pages: state.pages.map(p =>
            p.id === state.activePageId
              ? { ...p, layout: defaultLayout, collapsedWidgets: {} }
              : p
          ),
        });
      },

      updateWidgetPosition: (id, updates) => {
        const state = get();
        set({
          pages: state.pages.map(p =>
            p.id === state.activePageId
              ? {
                  ...p,
                  layout: p.layout.map(item =>
                    item.i === id ? { ...item, ...updates } : item
                  ),
                }
              : p
          ),
        });
      },

      toggleWidgetCollapse: (widgetId: string) => {
        const state = get();
        const currentPage = state.pages.find(p => p.id === state.activePageId);
        if (!currentPage) return;

        const isCurrentlyCollapsed = widgetId in currentPage.collapsedWidgets;

        if (isCurrentlyCollapsed) {
          // Expand: restore original height
          const originalHeight = currentPage.collapsedWidgets[widgetId];
          const newCollapsedWidgets = { ...currentPage.collapsedWidgets };
          delete newCollapsedWidgets[widgetId];

          set({
            pages: state.pages.map(p =>
              p.id === state.activePageId
                ? {
                    ...p,
                    collapsedWidgets: newCollapsedWidgets,
                    layout: p.layout.map(item =>
                      item.i === widgetId ? { ...item, h: originalHeight } : item
                    ),
                  }
                : p
            ),
          });
        } else {
          // Collapse: save original height and set to collapsed height
          const widget = currentPage.layout.find(item => item.i === widgetId);
          if (widget) {
            set({
              pages: state.pages.map(p =>
                p.id === state.activePageId
                  ? {
                      ...p,
                      collapsedWidgets: { ...p.collapsedWidgets, [widgetId]: widget.h },
                      layout: p.layout.map(item =>
                        item.i === widgetId ? { ...item, h: COLLAPSED_HEIGHT } : item
                      ),
                    }
                  : p
              ),
            });
          }
        }
      },

      addWidget: (widgetId: string, defaultSize: { w: number; h: number }, minSize: { w: number; h: number }) => {
        const state = get();
        const currentPage = state.pages.find(p => p.id === state.activePageId);
        if (!currentPage) return;

        // Check if widget already exists
        if (currentPage.layout.some(item => item.i === widgetId)) {
          return;
        }

        // Find the lowest y position to add widget below existing ones
        const maxY = currentPage.layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);

        const newWidget: DashboardLayoutItem = {
          i: widgetId,
          x: 0,
          y: maxY,
          w: defaultSize.w,
          h: defaultSize.h,
          minW: minSize.w,
          minH: minSize.h,
        };

        set({
          pages: state.pages.map(p =>
            p.id === state.activePageId
              ? { ...p, layout: [...p.layout, newWidget] }
              : p
          ),
        });
      },

      removeWidget: (widgetId: string) => {
        const state = get();
        const currentPage = state.pages.find(p => p.id === state.activePageId);
        if (!currentPage) return;

        const newCollapsedWidgets = { ...currentPage.collapsedWidgets };
        delete newCollapsedWidgets[widgetId];

        set({
          pages: state.pages.map(p =>
            p.id === state.activePageId
              ? {
                  ...p,
                  layout: p.layout.filter(item => item.i !== widgetId),
                  collapsedWidgets: newCollapsedWidgets,
                }
              : p
          ),
          activeWidgetId: state.activeWidgetId === widgetId ? null : state.activeWidgetId,
        });
      },

      isWidgetOnDashboard: (widgetId: string) => {
        const state = get();
        const currentPage = state.pages.find(p => p.id === state.activePageId);
        return currentPage?.layout.some(item => item.i === widgetId) ?? false;
      },
    }),
    {
      name: 'habitarcade-dashboard',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          // Migrate from single layout to multi-page structure
          const oldState = persistedState as {
            layout?: DashboardLayoutItem[];
            collapsedWidgets?: Record<string, number>;
          };

          return {
            pages: [
              {
                id: 'today',
                name: 'Today',
                icon: 'Today',
                layout: DEFAULT_TODAY_LAYOUT,
                collapsedWidgets: {},
                isDefault: true,
                sortOrder: 0,
              },
              {
                id: 'main',
                name: 'Overview',
                icon: 'Dashboard',
                layout: oldState.layout ?? DEFAULT_MAIN_LAYOUT,
                collapsedWidgets: oldState.collapsedWidgets ?? {},
                isDefault: true,
                sortOrder: 1,
              },
            ],
            activePageId: 'today',
            activeWidgetId: null,
            isEditMode: false,
          };
        }
        return persistedState;
      },
    }
  )
);

// For backwards compatibility
const DEFAULT_LAYOUT = DEFAULT_MAIN_LAYOUT;
export { DEFAULT_LAYOUT, COLLAPSED_HEIGHT, DEFAULT_MAIN_LAYOUT, DEFAULT_TODAY_LAYOUT };
