import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Habit, Task, Project, Category, TimeBlock, TaskStatusEntity } from '../types';

type ModalType =
  | 'habit-form'
  | 'habit-detail'
  | 'task-form'
  | 'project-form'
  | 'category-form'
  | 'tag-form'
  | 'time-block-form'
  | 'icon-picker'
  | 'settings'
  | 'confirm-delete'
  | 'widget-catalog'
  | 'parking-lot-item'
  | 'status-form'
  | 'dashboard-page-form'
  | null;

export type PageType = 'today' | 'dashboard' | 'habits' | 'tasks' | 'kanban' | 'kanban-day' | 'kanban-status' | 'kanban-project' | 'kanban-category' | 'projects' | 'analytics' | 'manage' | 'manage-habits' | 'manage-categories' | 'manage-projects' | 'manage-tags' | 'manage-priorities' | 'manage-quotes' | 'manage-videos' | 'manage-tasks' | 'manage-statuses' | 'settings' | 'targets' | 'time-blocks';

// Right sidebar module types
export type RightSidebarModuleType =
  | 'todays-todos'
  | 'parking-lot'
  | 'priorities'
  | 'quick-entry'
  | 'task-backlog'
  | 'components';

// Default modules for right sidebar
export const DEFAULT_RIGHT_SIDEBAR_MODULES: RightSidebarModuleType[] = [
  'todays-todos',
  'parking-lot',
];

interface UIStore {
  // Modal state
  activeModal: ModalType;
  modalData: unknown;

  // Previous modal state (for nested modals like icon picker)
  previousModal: ModalType;
  previousModalData: unknown;

  // Selected items for editing
  selectedHabit: Habit | null;
  selectedTask: Task | null;
  selectedProject: Project | null;
  selectedCategory: Category | null;
  selectedTimeBlock: TimeBlock | null;
  selectedStatus: TaskStatusEntity | null;

  // View state
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month';
  sidebarOpen: boolean;
  currentPage: PageType;

  // Right sidebar state (permanent fixture, no overlay)
  rightSidebarOpen: boolean;
  rightSidebarModules: RightSidebarModuleType[];
  rightSidebarExpandedModules: Set<RightSidebarModuleType>;

  // Legacy right drawer state (keeping for compatibility)
  rightDrawerOpen: boolean;
  rightDrawerContent: RightSidebarModuleType | null;

  // Icon picker callback
  onIconSelect: ((icon: string, color: string) => void) | null;

  // Actions
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;

  setSelectedHabit: (habit: Habit | null) => void;
  setSelectedTask: (task: Task | null) => void;
  setSelectedProject: (project: Project | null) => void;
  setSelectedCategory: (category: Category | null) => void;
  setSelectedTimeBlock: (block: TimeBlock | null) => void;
  setSelectedStatus: (status: TaskStatusEntity | null) => void;

  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  toggleSidebar: () => void;
  setCurrentPage: (page: PageType) => void;

  // Right sidebar actions (permanent fixture)
  toggleRightSidebar: () => void;
  setRightSidebarModules: (modules: RightSidebarModuleType[]) => void;
  addRightSidebarModule: (module: RightSidebarModuleType) => void;
  removeRightSidebarModule: (module: RightSidebarModuleType) => void;
  toggleModuleExpanded: (module: RightSidebarModuleType) => void;

  // Legacy right drawer actions (keeping for compatibility)
  toggleRightDrawer: () => void;
  openRightDrawer: (content?: RightSidebarModuleType | null) => void;
  closeRightDrawer: () => void;
  setRightDrawerContent: (content: RightSidebarModuleType | null) => void;

  openIconPicker: (onSelect: (icon: string, color: string) => void) => void;
  closeIconPicker: () => void;
}

// Helper to serialize Set for persistence
const serializeSet = (set: Set<RightSidebarModuleType>) => Array.from(set);
const deserializeSet = (arr: RightSidebarModuleType[]) => new Set(arr);

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Initial state
      activeModal: null,
      modalData: null,
      previousModal: null,
      previousModalData: null,
      selectedHabit: null,
      selectedTask: null,
      selectedProject: null,
      selectedCategory: null,
      selectedTimeBlock: null,
      selectedStatus: null,
      currentDate: new Date(),
      viewMode: 'week',
      sidebarOpen: true,
      currentPage: 'dashboard',

      // Right sidebar state (permanent fixture)
      rightSidebarOpen: true, // Open by default
      rightSidebarModules: DEFAULT_RIGHT_SIDEBAR_MODULES,
      rightSidebarExpandedModules: new Set(DEFAULT_RIGHT_SIDEBAR_MODULES),

      // Legacy right drawer state
      rightDrawerOpen: false,
      rightDrawerContent: 'parking-lot',
      onIconSelect: null,

      // Actions
      openModal: (type, data) => set({ activeModal: type, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null, onIconSelect: null }),

      setSelectedHabit: (habit) => set({ selectedHabit: habit }),
      setSelectedTask: (task) => set({ selectedTask: task }),
      setSelectedProject: (project) => set({ selectedProject: project }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setSelectedTimeBlock: (block) => set({ selectedTimeBlock: block }),
      setSelectedStatus: (status) => set({ selectedStatus: status }),

      setCurrentDate: (date) => set({ currentDate: date }),
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setCurrentPage: (page) => set({ currentPage: page }),

      // Right sidebar actions (permanent fixture)
      toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      setRightSidebarModules: (modules) => set({ rightSidebarModules: modules }),
      addRightSidebarModule: (module) => set((state) => {
        if (state.rightSidebarModules.includes(module)) return state;
        return {
          rightSidebarModules: [...state.rightSidebarModules, module],
          rightSidebarExpandedModules: new Set([...state.rightSidebarExpandedModules, module]),
        };
      }),
      removeRightSidebarModule: (module) => set((state) => {
        const newModules = state.rightSidebarModules.filter(m => m !== module);
        const newExpanded = new Set(state.rightSidebarExpandedModules);
        newExpanded.delete(module);
        return {
          rightSidebarModules: newModules,
          rightSidebarExpandedModules: newExpanded,
        };
      }),
      toggleModuleExpanded: (module) => set((state) => {
        const newExpanded = new Set(state.rightSidebarExpandedModules);
        if (newExpanded.has(module)) {
          newExpanded.delete(module);
        } else {
          newExpanded.add(module);
        }
        return { rightSidebarExpandedModules: newExpanded };
      }),

      // Legacy right drawer actions (keeping for compatibility)
      toggleRightDrawer: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
      openRightDrawer: (content) => set((state) => ({
        rightSidebarOpen: true,
        rightDrawerContent: content || state.rightDrawerContent || 'parking-lot'
      })),
      closeRightDrawer: () => set({ rightSidebarOpen: false }),
      setRightDrawerContent: (content) => set({ rightDrawerContent: content }),

      openIconPicker: (onSelect) => set((state) => ({
        // Save current modal state before opening icon picker
        previousModal: state.activeModal,
        previousModalData: state.modalData,
        activeModal: 'icon-picker',
        onIconSelect: onSelect
      })),

      closeIconPicker: () => set((state) => ({
        // Restore previous modal state
        activeModal: state.previousModal,
        modalData: state.previousModalData,
        previousModal: null,
        previousModalData: null,
        onIconSelect: null
      })),
    }),
    {
      name: 'habitarcade-ui',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        rightSidebarModules: state.rightSidebarModules,
        rightSidebarExpandedModules: serializeSet(state.rightSidebarExpandedModules),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<UIStore> & { rightSidebarExpandedModules?: RightSidebarModuleType[] };
        return {
          ...currentState,
          ...persisted,
          rightSidebarExpandedModules: persisted.rightSidebarExpandedModules
            ? deserializeSet(persisted.rightSidebarExpandedModules)
            : currentState.rightSidebarExpandedModules,
        };
      },
    }
  )
);
