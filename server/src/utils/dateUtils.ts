/**
 * Date Utilities for HabitArcade
 *
 * Handles day boundary calculations where days can start at a custom hour
 * (default 6 AM). This means if it's 3 AM on January 2nd with a 6 AM boundary,
 * the "effective date" is still January 1st.
 */

/**
 * Get the effective date based on the day boundary hour.
 *
 * If the current hour is before the boundary hour, we consider it
 * as part of the previous day.
 *
 * @param date - The actual date/time
 * @param dayBoundaryHour - Hour when the day starts (0-23, default 6)
 * @returns The effective date as YYYY-MM-DD string
 */
export function getEffectiveDate(date: Date = new Date(), dayBoundaryHour: number = 6): string {
  const effectiveDate = new Date(date);

  // If current hour is before the boundary, treat as previous day
  if (effectiveDate.getHours() < dayBoundaryHour) {
    effectiveDate.setDate(effectiveDate.getDate() - 1);
  }

  return formatDateToISO(effectiveDate);
}

/**
 * Get the effective date as a Date object
 *
 * @param date - The actual date/time
 * @param dayBoundaryHour - Hour when the day starts (0-23, default 6)
 * @returns The effective date as a Date object (set to midnight)
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
 * Format a Date object to ISO date string (YYYY-MM-DD)
 *
 * @param date - The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse an ISO date string (YYYY-MM-DD) to a Date object
 *
 * @param dateString - The date string in YYYY-MM-DD format
 * @returns Date object set to midnight local time
 */
export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Get a range of dates as ISO strings
 *
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getDateRange(startDate: Date | string, endDate: Date | string): string[] {
  const start = typeof startDate === 'string' ? parseISODate(startDate) : new Date(startDate);
  const end = typeof endDate === 'string' ? parseISODate(endDate) : new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDateToISO(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Check if a date is in the past (compared to effective today)
 *
 * @param date - The date to check
 * @param dayBoundaryHour - Hour when the day starts
 * @returns True if the date is before today (effective)
 */
export function isDateInPast(date: string | Date, dayBoundaryHour: number = 6): boolean {
  const checkDate = typeof date === 'string' ? parseISODate(date) : new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const effectiveToday = getEffectiveDateObject(new Date(), dayBoundaryHour);

  return checkDate < effectiveToday;
}

/**
 * Check if a date is today (considering day boundary)
 *
 * @param date - The date to check
 * @param dayBoundaryHour - Hour when the day starts
 * @returns True if the date is effectively today
 */
export function isEffectivelyToday(date: string | Date, dayBoundaryHour: number = 6): boolean {
  const checkDate = typeof date === 'string' ? parseISODate(date) : new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const effectiveToday = getEffectiveDateObject(new Date(), dayBoundaryHour);

  return checkDate.getTime() === effectiveToday.getTime();
}
