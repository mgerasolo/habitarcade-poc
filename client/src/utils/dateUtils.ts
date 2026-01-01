/**
 * Client-side Date Utilities for HabitArcade
 *
 * Mirrors the server-side dateUtils for consistent date handling
 * with day boundary support (e.g., 6 AM day boundary)
 */

import { format, subDays, parse } from 'date-fns';

/**
 * Get the effective date based on the day boundary hour.
 *
 * If the current hour is before the boundary hour, we consider it
 * as part of the previous day.
 *
 * @param date - The actual date/time (default: now)
 * @param dayBoundaryHour - Hour when the day starts (0-23, default 6)
 * @returns The effective date as YYYY-MM-DD string
 */
export function getEffectiveDate(date: Date = new Date(), dayBoundaryHour: number = 6): string {
  const effectiveDate = new Date(date);

  // If current hour is before the boundary, treat as previous day
  if (effectiveDate.getHours() < dayBoundaryHour) {
    effectiveDate.setDate(effectiveDate.getDate() - 1);
  }

  return format(effectiveDate, 'yyyy-MM-dd');
}

/**
 * Get the effective date as a Date object (set to midnight)
 *
 * @param date - The actual date/time (default: now)
 * @param dayBoundaryHour - Hour when the day starts (0-23, default 6)
 * @returns The effective date as a Date object
 */
export function getEffectiveDateObject(date: Date = new Date(), dayBoundaryHour: number = 6): Date {
  const effectiveDate = new Date(date);

  // If current hour is before the boundary, treat as previous day
  if (effectiveDate.getHours() < dayBoundaryHour) {
    effectiveDate.setDate(effectiveDate.getDate() - 1);
  }

  // Set to midnight
  effectiveDate.setHours(0, 0, 0, 0);

  return effectiveDate;
}

/**
 * Check if a date string is effectively today
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param dayBoundaryHour - Hour when the day starts
 * @returns True if the date is effectively today
 */
export function isEffectivelyToday(dateStr: string, dayBoundaryHour: number = 6): boolean {
  const effectiveToday = getEffectiveDate(new Date(), dayBoundaryHour);
  return dateStr === effectiveToday;
}

/**
 * Check if a date is in the past (before effective today)
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param dayBoundaryHour - Hour when the day starts
 * @returns True if the date is before effective today
 */
export function isDateInPast(dateStr: string, dayBoundaryHour: number = 6): boolean {
  const effectiveToday = getEffectiveDate(new Date(), dayBoundaryHour);
  return dateStr < effectiveToday;
}

/**
 * Generate an array of date columns for the habit matrix
 *
 * @param daysToShow - Number of days to show
 * @param dayBoundaryHour - Hour when the day starts
 * @returns Array of date column objects
 */
export function generateDateColumns(
  daysToShow: number,
  dayBoundaryHour: number = 6
): Array<{
  date: string;
  dayOfWeek: string;
  dayOfMonth: string;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
}> {
  const effectiveToday = getEffectiveDateObject(new Date(), dayBoundaryHour);
  const effectiveTodayStr = format(effectiveToday, 'yyyy-MM-dd');

  return Array.from({ length: daysToShow }, (_, i) => {
    const date = subDays(effectiveToday, daysToShow - 1 - i);
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');

    return {
      date: dateStr,
      dayOfWeek: format(date, 'EEE'),
      dayOfMonth: format(date, 'd'),
      isToday: dateStr === effectiveTodayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isPast: dateStr < effectiveTodayStr,
    };
  });
}

/**
 * Parse a YYYY-MM-DD date string to a Date object
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object set to midnight
 */
export function parseISODate(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

/**
 * Get the start and end dates for a date range
 *
 * @param daysToShow - Number of days to show
 * @param dayBoundaryHour - Hour when the day starts
 * @returns Object with startDate and endDate strings
 */
export function getDateRangeForDisplay(
  daysToShow: number,
  dayBoundaryHour: number = 6
): { startDate: string; endDate: string } {
  const effectiveToday = getEffectiveDateObject(new Date(), dayBoundaryHour);
  const startDate = subDays(effectiveToday, daysToShow - 1);

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(effectiveToday, 'yyyy-MM-dd'),
  };
}
