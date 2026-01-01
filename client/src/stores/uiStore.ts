import { create } from 'zustand';
import type { Habit, Task, Project, Category, TimeBlock } from '../types';

type ModalType =
  | 'habit-form'
  | 'task-form'
  | 'project-form'
  | 'category-form'
  | 'time-block-form'
  | 'icon-picker'
  | 'settings'
  | 'confirm-delete'
  | null;

type RightDrawerContent = 'parking-lot' | 'priorities' | 'quick-entry' | 'properties' | null;

interface UIStore {
  // Modal state
  activeModal: ModalType;
  modalData: unknown;

  // Selected items for editing
  selectedHabit: Habit | null;
  selectedTask: Task | null;
  selectedProject: Project | null;
  selectedCategory: Category | null;
  selectedTimeBlock: TimeBlock | null;

  // View state
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month';
  sidebarOpen: boolean;

  // Right drawer state
  rightDrawerOpen: boolean;
  rightDrawerContent: RightDrawerContent;

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

  setCurrentDate: (date: Date) => void;
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  toggleSidebar: () => void;

  // Right drawer actions
  toggleRightDrawer: () => void;
  openRightDrawer: (content?: RightDrawerContent) => void;
  closeRightDrawer: () => void;
  setRightDrawerContent: (content: RightDrawerContent) => void;

  openIconPicker: (onSelect: (icon: string, color: string) => void) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  activeModal: null,
  modalData: null,
  selectedHabit: null,
  selectedTask: null,
  selectedProject: null,
  selectedCategory: null,
  selectedTimeBlock: null,
  currentDate: new Date(),
  viewMode: 'week',
  sidebarOpen: true,
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

  setCurrentDate: (date) => set({ currentDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Right drawer actions
  toggleRightDrawer: () => set((state) => ({ rightDrawerOpen: !state.rightDrawerOpen })),
  openRightDrawer: (content) => set((state) => ({
    rightDrawerOpen: true,
    rightDrawerContent: content || state.rightDrawerContent || 'parking-lot'
  })),
  closeRightDrawer: () => set({ rightDrawerOpen: false }),
  setRightDrawerContent: (content) => set({ rightDrawerContent: content }),

  openIconPicker: (onSelect) => set({
    activeModal: 'icon-picker',
    onIconSelect: onSelect
  }),
}));
