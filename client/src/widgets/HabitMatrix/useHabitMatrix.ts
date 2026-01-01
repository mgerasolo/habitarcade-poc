import { useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, subHours, isSameDay } from 'date-fns';
import { useHabits, useCategories, useSettings } from '../../api';
import type { Habit, HabitEntry, Category, HabitStatus } from '../../types';

// Responsive breakpoints for days to show
// Note: desktop value is just a marker for "month view" - actual days calculated from currentMonth
export const DAYS_CONFIG = {
  desktop: 31, // Full month view (actual days calculated dynamically)
  tablet: 7,   // Week view
  mobile: 3,   // Last 3 days
} as const;

/**
 * Get the effective date based on day boundary hour.
 * If current hour is before the boundary, treat it as the previous day.
 *
 * Example: At 3 AM with dayBoundaryHour=6, returns yesterday's date.
 * Example: At 8 AM with dayBoundaryHour=6, returns today's date.
 */
export function getEffectiveDate(now: Date = new Date(), dayBoundaryHour: number = 0): Date {
  const currentHour = now.getHours();

  if (currentHour < dayBoundaryHour) {
    // Treat as previous day - subtract the difference to get to the boundary hour of previous day
    return subHours(now, currentHour + (24 - dayBoundaryHour));
  }

  return now;
}

/**
 * Check if a date is "today" considering the day boundary offset.
 * For example, at 3 AM with dayBoundaryHour=6, "today" would be yesterday's date.
 */
export function isEffectiveToday(date: Date, now: Date = new Date(), dayBoundaryHour: number = 0): boolean {
  const effectiveNow = getEffectiveDate(now, dayBoundaryHour);
  return isSameDay(date, effectiveNow);
}

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

export interface CompletionScore {
  percentage: number;
  completed: number;
  partial: number;
  total: number;
  excluded: number; // exempt + na
}

export interface HabitMatrixData {
  dateColumns: DateColumn[];
  categoryGroups: CategoryGroup[];
  todayScore: CompletionScore;
  monthScore: CompletionScore;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Custom hook for managing Habit Matrix data
 * Handles date generation, habit grouping, and entry mapping
 *
 * @param daysToShow - Number of days to display (3, 7, or 31 for month view)
 * @param currentMonth - The month to display when in month view (daysToShow >= 31)
 */
export function useHabitMatrix(
  daysToShow: number = DAYS_CONFIG.desktop,
  currentMonth?: Date
): HabitMatrixData {
  const { data: habitsResponse, isLoading: habitsLoading, isError: habitsError } = useHabits();
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories();
  const { data: settingsResponse } = useSettings();

  const habits = habitsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const dayBoundaryHour = settingsResponse?.data?.dayBoundaryHour ?? 0;

  // Generate date columns for the matrix
  const dateColumns = useMemo<DateColumn[]>(() => {
    const now = new Date();
    const effectiveToday = getEffectiveDate(now, dayBoundaryHour);

    // For month view (daysToShow >= DAYS_CONFIG.desktop), show the actual days in the month
    if (daysToShow >= DAYS_CONFIG.desktop && currentMonth) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Generate columns for all days in the month
      return eachDayOfInterval({ start: monthStart, end: monthEnd }).map(date => {
        const dayOfWeek = date.getDay();
        return {
          date: format(date, 'yyyy-MM-dd'),
          dayOfWeek: format(date, 'EEE'),
          dayOfMonth: format(date, 'd'),
          isToday: isEffectiveToday(date, now, dayBoundaryHour),
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        };
      });
    }

    // For week/3-day view, show last N days ending on effective today
    return Array.from({ length: daysToShow }, (_, i) => {
      const date = subDays(effectiveToday, daysToShow - 1 - i);
      const dayOfWeek = date.getDay();
      return {
        date: format(date, 'yyyy-MM-dd'),
        dayOfWeek: format(date, 'EEE'),
        dayOfMonth: format(date, 'd'),
        isToday: isEffectiveToday(date, now, dayBoundaryHour),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      };
    });
  }, [daysToShow, currentMonth, dayBoundaryHour]);

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

  // Calculate today's completion score (using effective date based on day boundary)
  const todayScore = useMemo<CompletionScore>(() => {
    const effectiveToday = getEffectiveDate(new Date(), dayBoundaryHour);
    const todayStr = format(effectiveToday, 'yyyy-MM-dd');
    return calculateCompletionScore(matrixHabits, [todayStr]);
  }, [matrixHabits, dayBoundaryHour]);

  // Calculate current month's completion score (up to effective today)
  const monthScore = useMemo<CompletionScore>(() => {
    const now = new Date();
    const effectiveToday = getEffectiveDate(now, dayBoundaryHour);
    const monthStart = startOfMonth(effectiveToday);
    const monthDates = eachDayOfInterval({ start: monthStart, end: effectiveToday })
      .map(d => format(d, 'yyyy-MM-dd'));
    return calculateCompletionScore(matrixHabits, monthDates);
  }, [matrixHabits, dayBoundaryHour]);

  return {
    dateColumns,
    categoryGroups,
    todayScore,
    monthScore,
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
 * Get effective status for a habit on a specific date, considering auto-pink for past unfilled days.
 *
 * @param habit - The habit with entries map
 * @param date - The date string (YYYY-MM-DD format)
 * @param isToday - Whether this date is effectively "today" (considering day boundary)
 * @param autoMarkPink - Whether to auto-mark unfilled past days as pink
 */
export function getEffectiveHabitStatus(
  habit: MatrixHabit,
  date: string,
  isToday: boolean,
  autoMarkPink: boolean
): HabitStatus {
  const status = getHabitStatus(habit, date);

  // If autoMarkPink is enabled and status is 'empty' and this is NOT today (a past day),
  // return 'pink' instead of 'empty'
  if (autoMarkPink && status === 'empty' && !isToday) {
    return 'pink';
  }

  return status;
}

/**
 * Calculate completion score for habits on given dates
 * Formula: (completed + partial*0.5) / (total - exempt - na)
 */
export function calculateCompletionScore(
  habits: MatrixHabit[],
  dates: string[]
): CompletionScore {
  let completed = 0;
  let partial = 0;
  let exempt = 0;
  let na = 0;
  const total = habits.length * dates.length;

  for (const habit of habits) {
    for (const date of dates) {
      const status = getHabitStatus(habit, date);
      switch (status) {
        case 'complete':
        case 'extra':
          completed++;
          break;
        case 'partial':
        case 'trending':
          partial++;
          break;
        case 'exempt':
          exempt++;
          break;
        case 'na':
          na++;
          break;
        // 'empty', 'missed', 'pink' count as incomplete (not excluded)
      }
    }
  }

  const excluded = exempt + na;
  const effectiveTotal = total - excluded;
  const percentage = effectiveTotal > 0
    ? Math.round(((completed + partial * 0.5) / effectiveTotal) * 100)
    : 0;

  return { percentage, completed, partial, total, excluded };
}

/**
 * Determine responsive days to show based on window width
 */
export function getResponsiveDays(width: number): number {
  if (width < 640) return DAYS_CONFIG.mobile;    // < sm
  if (width < 1024) return DAYS_CONFIG.tablet;   // sm-md
  return DAYS_CONFIG.desktop;                     // lg+
}
