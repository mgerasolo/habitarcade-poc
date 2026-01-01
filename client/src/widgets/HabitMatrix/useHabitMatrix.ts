import { useMemo } from 'react';
import { format, subDays, isToday as checkIsToday, getDaysInMonth } from 'date-fns';
import { useHabits, useCategories } from '../../api';
import type { Habit, HabitEntry, Category, HabitStatus } from '../../types';

// Responsive breakpoints for days to show
export const DAYS_CONFIG = {
  desktop: 31, // Full month view (adapts to actual days in month)
  tablet: 7,   // Week view
  mobile: 3,   // Last 3 days
} as const;

export interface DateColumn {
  date: string;      // YYYY-MM-DD format
  dayOfWeek: string; // Mon, Tue, etc.
  dayOfMonth: string; // 1-31
  isToday: boolean;
  isWeekend: boolean;
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
  overallScore: number;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Get the number of days to show based on the current month
 * Handles months with 28, 29, 30, or 31 days
 */
export function getDaysForMonth(date: Date = new Date()): number {
  return getDaysInMonth(date);
}

/**
 * Custom hook for managing Habit Matrix data
 * Handles date generation, habit grouping, and entry mapping
 */
export function useHabitMatrix(daysToShow: number = DAYS_CONFIG.desktop): HabitMatrixData {
  const { data: habitsResponse, isLoading: habitsLoading, isError: habitsError } = useHabits();
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();

  const habits = habitsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  // Generate date columns for the matrix
  const dateColumns = useMemo<DateColumn[]>(() => {
    const today = new Date();
    return Array.from({ length: daysToShow }, (_, i) => {
      const date = subDays(today, daysToShow - 1 - i);
      const dayOfWeek = date.getDay();
      return {
        date: format(date, 'yyyy-MM-dd'),
        dayOfWeek: format(date, 'EEE'),
        dayOfMonth: format(date, 'd'),
        isToday: checkIsToday(date),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      };
    });
  }, [daysToShow]);

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

  // Calculate overall score across all habits and dates
  const overallScore = useMemo(() => {
    if (matrixHabits.length === 0) return 0;

    let totalCompleted = 0;
    let totalEligible = 0;

    matrixHabits.forEach(habit => {
      dateColumns.forEach(dateCol => {
        const status = getHabitStatus(habit, dateCol.date);
        // Skip N/A and exempt entries
        if (status === 'na' || status === 'exempt') return;

        totalEligible++;
        // Count complete and extra as completed
        if (status === 'complete' || status === 'extra') {
          totalCompleted++;
        }
      });
    });

    return totalEligible > 0 ? Math.round((totalCompleted / totalEligible) * 100) : 0;
  }, [matrixHabits, dateColumns]);

  return {
    dateColumns,
    categoryGroups,
    overallScore,
    isLoading: habitsLoading || categoriesLoading,
    isError: habitsError,
  };
}

/**
 * Get status for a specific habit on a specific date
 */
export function getHabitStatus(habit: MatrixHabit, date: string): HabitStatus {
  const entry = habit.entriesByDate.get(date);
  return entry?.status || 'empty';
}

/**
 * Determine responsive days to show based on window width
 */
export function getResponsiveDays(width: number): number {
  if (width < 640) return DAYS_CONFIG.mobile;    // < sm
  if (width < 1024) return DAYS_CONFIG.tablet;   // sm-md
  return DAYS_CONFIG.desktop;                     // lg+
}
