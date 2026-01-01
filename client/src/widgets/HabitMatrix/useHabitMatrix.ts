import { useMemo } from 'react';
import { useHabits, useCategories, useSettings } from '../../api';
import { generateDateColumns, isDateInPast } from '../../utils/dateUtils';
import type { Habit, HabitEntry, Category, HabitStatus } from '../../types';

// Responsive breakpoints for days to show
export const DAYS_CONFIG = {
  desktop: 31, // Full month view
  tablet: 7,   // Week view
  mobile: 3,   // Last 3 days
} as const;

export interface DateColumn {
  date: string;      // YYYY-MM-DD format
  dayOfWeek: string; // Mon, Tue, etc.
  dayOfMonth: string; // 1-31
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;   // Is this date in the past (for auto-fill logic)
}

export interface MatrixHabit extends Habit {
  entriesByDate: Map<string, HabitEntry>;
}

export interface CategoryGroup {
  category: Category | null;
  habits: MatrixHabit[];
}

export interface HabitMatrixData {
  dateColumns: DateColumn[];
  categoryGroups: CategoryGroup[];
  isLoading: boolean;
  isError: boolean;
  dayBoundaryHour: number;
}

/**
 * Custom hook for managing Habit Matrix data
 * Handles date generation, habit grouping, and entry mapping
 * Now supports day boundary (e.g., 6 AM) for determining "today"
 */
export function useHabitMatrix(daysToShow: number = DAYS_CONFIG.desktop): HabitMatrixData {
  const { data: habitsResponse, isLoading: habitsLoading, isError: habitsError } = useHabits();
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();
  const { data: settingsResponse } = useSettings();

  const habits = habitsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const dayBoundaryHour = settingsResponse?.data?.dayBoundaryHour ?? 6;

  // Generate date columns for the matrix using day boundary
  const dateColumns = useMemo<DateColumn[]>(() => {
    return generateDateColumns(daysToShow, dayBoundaryHour);
  }, [daysToShow, dayBoundaryHour]);

  // Transform habits with entry lookup maps
  const matrixHabits = useMemo<MatrixHabit[]>(() => {
    return habits
      .filter(habit => !habit.isDeleted)
      .map(habit => {
        const entriesByDate = new Map<string, HabitEntry>();
        (habit.entries || []).forEach(entry => {
          entriesByDate.set(entry.date, entry);
        });
        return {
          ...habit,
          entriesByDate,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [habits]);

  // Group habits by category
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const groupMap = new Map<string | null, MatrixHabit[]>();

    // Initialize with sorted categories
    const sortedCategories = [...categories]
      .filter(c => !c.isDeleted)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Pre-create category groups in order
    sortedCategories.forEach(cat => {
      groupMap.set(cat.id, []);
    });
    groupMap.set(null, []); // Uncategorized at the end

    // Distribute habits into groups
    matrixHabits.forEach(habit => {
      const categoryId = habit.categoryId || null;
      if (!groupMap.has(categoryId)) {
        groupMap.set(categoryId, []);
      }
      groupMap.get(categoryId)!.push(habit);
    });

    // Build result array maintaining category order
    const result: CategoryGroup[] = [];

    sortedCategories.forEach(cat => {
      const categoryHabits = groupMap.get(cat.id) || [];
      if (categoryHabits.length > 0) {
        result.push({
          category: cat,
          habits: categoryHabits,
        });
      }
    });

    // Add uncategorized at the end if it has habits
    const uncategorized = groupMap.get(null) || [];
    if (uncategorized.length > 0) {
      result.push({
        category: null,
        habits: uncategorized,
      });
    }

    return result;
  }, [matrixHabits, categories]);

  return {
    dateColumns,
    categoryGroups,
    isLoading: habitsLoading || categoriesLoading,
    isError: habitsError,
    dayBoundaryHour,
  };
}

/**
 * Get status for a specific habit on a specific date
 * Returns 'empty' for unfilled entries, or the actual status if filled
 */
export function getHabitStatus(habit: MatrixHabit, date: string): HabitStatus {
  const entry = habit.entriesByDate.get(date);
  return entry?.status || 'empty';
}

/**
 * Check if a habit entry should be shown as "missed" (pink)
 * This is for past dates with no entry (empty status)
 */
export function shouldShowAsMissed(
  habit: MatrixHabit,
  date: string,
  dayBoundaryHour: number = 6
): boolean {
  const entry = habit.entriesByDate.get(date);
  const status = entry?.status || 'empty';

  // Only show as missed if:
  // 1. The date is in the past
  // 2. The status is 'empty' (no entry recorded)
  return status === 'empty' && isDateInPast(date, dayBoundaryHour);
}

/**
 * Get the display status for a habit cell
 * Accounts for auto-missed logic for past unfilled days
 */
export function getDisplayStatus(
  habit: MatrixHabit,
  date: string,
  dayBoundaryHour: number = 6,
  autoShowMissed: boolean = false
): HabitStatus {
  const actualStatus = getHabitStatus(habit, date);

  // If auto-show missed is enabled and this is an empty past day, show as pink
  if (autoShowMissed && actualStatus === 'empty' && isDateInPast(date, dayBoundaryHour)) {
    return 'pink';
  }

  return actualStatus;
}

/**
 * Determine responsive days to show based on window width
 */
export function getResponsiveDays(width: number): number {
  if (width < 640) return DAYS_CONFIG.mobile;    // < sm
  if (width < 1024) return DAYS_CONFIG.tablet;   // sm-md
  return DAYS_CONFIG.desktop;                     // lg+
}
