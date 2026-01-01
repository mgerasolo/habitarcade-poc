/**
 * Tests for Date Utilities
 */

import {
  getEffectiveDate,
  getEffectiveDateObject,
  formatDateToISO,
  parseISODate,
  getDateRange,
  isDateInPast,
  isEffectivelyToday,
} from '../../server/src/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDateToISO', () => {
    it('should format date correctly', () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatDateToISO(date)).toBe('2024-01-15');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2024, 0, 5); // Jan 5, 2024
      expect(formatDateToISO(date)).toBe('2024-01-05');
    });
  });

  describe('parseISODate', () => {
    it('should parse ISO date string correctly', () => {
      const date = parseISODate('2024-01-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(0);
    });
  });

  describe('getEffectiveDate', () => {
    it('should return same date when hour is after boundary', () => {
      // 10 AM on Jan 15 with 6 AM boundary -> Jan 15
      const date = new Date(2024, 0, 15, 10, 0, 0);
      expect(getEffectiveDate(date, 6)).toBe('2024-01-15');
    });

    it('should return previous date when hour is before boundary', () => {
      // 3 AM on Jan 15 with 6 AM boundary -> Jan 14
      const date = new Date(2024, 0, 15, 3, 0, 0);
      expect(getEffectiveDate(date, 6)).toBe('2024-01-14');
    });

    it('should return same date when hour equals boundary', () => {
      // 6 AM on Jan 15 with 6 AM boundary -> Jan 15
      const date = new Date(2024, 0, 15, 6, 0, 0);
      expect(getEffectiveDate(date, 6)).toBe('2024-01-15');
    });

    it('should handle midnight boundary', () => {
      // 11 PM on Jan 15 with 0 (midnight) boundary -> Jan 15
      const date = new Date(2024, 0, 15, 23, 0, 0);
      expect(getEffectiveDate(date, 0)).toBe('2024-01-15');
    });

    it('should handle different boundary hours', () => {
      const date = new Date(2024, 0, 15, 4, 0, 0);
      expect(getEffectiveDate(date, 3)).toBe('2024-01-15'); // After 3 AM
      expect(getEffectiveDate(date, 5)).toBe('2024-01-14'); // Before 5 AM
      expect(getEffectiveDate(date, 4)).toBe('2024-01-15'); // At 4 AM
    });
  });

  describe('getEffectiveDateObject', () => {
    it('should return Date object set to midnight', () => {
      const date = new Date(2024, 0, 15, 10, 30, 45);
      const effective = getEffectiveDateObject(date, 6);

      expect(effective.getHours()).toBe(0);
      expect(effective.getMinutes()).toBe(0);
      expect(effective.getSeconds()).toBe(0);
      expect(effective.getMilliseconds()).toBe(0);
    });

    it('should adjust date when before boundary', () => {
      const date = new Date(2024, 0, 15, 3, 0, 0);
      const effective = getEffectiveDateObject(date, 6);

      expect(effective.getDate()).toBe(14);
      expect(effective.getMonth()).toBe(0);
    });
  });

  describe('getDateRange', () => {
    it('should return array of dates inclusive of start and end', () => {
      const range = getDateRange('2024-01-10', '2024-01-13');
      expect(range).toEqual(['2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13']);
    });

    it('should return single date when start equals end', () => {
      const range = getDateRange('2024-01-15', '2024-01-15');
      expect(range).toEqual(['2024-01-15']);
    });

    it('should handle Date objects', () => {
      const start = new Date(2024, 0, 10);
      const end = new Date(2024, 0, 12);
      const range = getDateRange(start, end);
      expect(range).toEqual(['2024-01-10', '2024-01-11', '2024-01-12']);
    });

    it('should return empty array when start is after end', () => {
      const range = getDateRange('2024-01-15', '2024-01-10');
      expect(range).toEqual([]);
    });
  });

  describe('isDateInPast', () => {
    it('should return true for past dates', () => {
      // Create a date that's definitely in the past
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = formatDateToISO(yesterday);

      expect(isDateInPast(dateStr, 6)).toBe(true);
    });

    it('should return false for today', () => {
      const today = formatDateToISO(new Date());
      // This test depends on current time - may fail around day boundary
      const currentHour = new Date().getHours();
      if (currentHour >= 6) {
        expect(isDateInPast(today, 6)).toBe(false);
      }
    });

    it('should return false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = formatDateToISO(tomorrow);

      expect(isDateInPast(dateStr, 6)).toBe(false);
    });
  });

  describe('isEffectivelyToday', () => {
    it('should handle current date correctly', () => {
      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 6) {
        // After 6 AM, today is today
        const today = formatDateToISO(now);
        expect(isEffectivelyToday(today, 6)).toBe(true);
      } else {
        // Before 6 AM, yesterday is effectively today
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDateToISO(yesterday);
        expect(isEffectivelyToday(yesterdayStr, 6)).toBe(true);
      }
    });
  });
});
