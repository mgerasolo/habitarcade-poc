import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, DefaultView, WeekStartDay } from '../types';

interface SettingsStore {
  // Synced with server settings
  dayBoundaryHour: number;
  theme: ThemeMode;
  defaultView: DefaultView;
  weekStartDay: WeekStartDay;
  showCompletedTasks: boolean;
  showDeletedItems: boolean;
  habitMatrixWeeks: number;
  kanbanDays: number;
  autoSyncInterval: number;
  notificationsEnabled: boolean;

  // Local-only settings
  resolvedTheme: 'dark' | 'light'; // The actual theme after resolving 'auto'

  // Actions
  setTheme: (theme: ThemeMode) => void;
  setDefaultView: (view: DefaultView) => void;
  setWeekStartDay: (day: WeekStartDay) => void;
  setDayBoundaryHour: (hour: number) => void;
  setShowCompletedTasks: (show: boolean) => void;
  setShowDeletedItems: (show: boolean) => void;
  setHabitMatrixWeeks: (weeks: number) => void;
  setKanbanDays: (days: number) => void;
  setAutoSyncInterval: (interval: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Bulk update from server
  syncFromServer: (settings: Partial<SettingsStore>) => void;

  // Helper to resolve auto theme
  updateResolvedTheme: () => void;
}

// Detect system preference
const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark'; // Default to dark
};

// Resolve theme based on setting
const resolveTheme = (theme: ThemeMode): 'dark' | 'light' => {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Default values (match server defaults)
      dayBoundaryHour: 6,
      theme: 'dark',
      defaultView: 'today',
      weekStartDay: 0,
      showCompletedTasks: true,
      showDeletedItems: false,
      habitMatrixWeeks: 4,
      kanbanDays: 7,
      autoSyncInterval: 30000,
      notificationsEnabled: false,
      resolvedTheme: 'dark',

      // Actions
      setTheme: (theme) => {
        set({ theme, resolvedTheme: resolveTheme(theme) });
        applyThemeToDocument(resolveTheme(theme));
      },

      setDefaultView: (view) => set({ defaultView: view }),
      setWeekStartDay: (day) => set({ weekStartDay: day }),
      setDayBoundaryHour: (hour) => set({ dayBoundaryHour: hour }),
      setShowCompletedTasks: (show) => set({ showCompletedTasks: show }),
      setShowDeletedItems: (show) => set({ showDeletedItems: show }),
      setHabitMatrixWeeks: (weeks) => set({ habitMatrixWeeks: weeks }),
      setKanbanDays: (days) => set({ kanbanDays: days }),
      setAutoSyncInterval: (interval) => set({ autoSyncInterval: interval }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      syncFromServer: (settings) => {
        const currentTheme = get().theme;
        set(settings);
        // If theme changed, update resolved theme
        if (settings.theme && settings.theme !== currentTheme) {
          const resolved = resolveTheme(settings.theme);
          set({ resolvedTheme: resolved });
          applyThemeToDocument(resolved);
        }
      },

      updateResolvedTheme: () => {
        const theme = get().theme;
        const resolved = resolveTheme(theme);
        set({ resolvedTheme: resolved });
        applyThemeToDocument(resolved);
      },
    }),
    {
      name: 'habitarcade-settings',
      partialize: (state) => ({
        // Only persist these to localStorage
        theme: state.theme,
        defaultView: state.defaultView,
        resolvedTheme: state.resolvedTheme,
      }),
    }
  )
);

// Apply theme to document (for CSS variable switching)
function applyThemeToDocument(theme: 'dark' | 'light') {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(`theme-${theme}`);
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Listen for system theme changes when using 'auto'
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const store = useSettingsStore.getState();
    if (store.theme === 'auto') {
      store.updateResolvedTheme();
    }
  });
}
