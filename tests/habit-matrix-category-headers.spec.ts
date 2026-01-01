import { test, expect } from '@playwright/test';

/**
 * HabitMatrix Category Headers Tests
 *
 * Tests for Issue #21: Make category header rows more visually distinct
 *
 * These tests verify:
 * - Category sections have distinct divider lines
 * - Category headers have proper styling (background, borders)
 * - Category names are bold and prominent
 * - Collapse/expand functionality for categories still works
 */

test.describe('HabitMatrix Category Headers', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');

    // Wait for the habit matrix widget to load
    await page.waitForSelector('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]', {
      timeout: 10000,
    });
  });

  test('category sections have divider lines', async ({ page }) => {
    // Find category sections
    const categorySections = page.locator('[data-testid="category-section"], [data-testid="category-section-flat"]');
    const sectionCount = await categorySections.count();

    // If there are categories, check for dividers
    if (sectionCount > 0) {
      const dividers = page.locator('[data-testid="category-divider"]');
      const dividerCount = await dividers.count();

      // Each category section should have a divider
      expect(dividerCount).toBeGreaterThanOrEqual(1);

      // First divider should have border styling
      const firstDivider = dividers.first();
      const classes = await firstDivider.getAttribute('class');
      expect(classes).toContain('border-t-2');
    }
  });

  test('category headers have distinct background styling', async ({ page }) => {
    // Find category headers
    const categoryHeaders = page.locator('[data-testid="category-header"], [data-testid="category-header-flat"]');
    const headerCount = await categoryHeaders.count();

    // If there are category headers, verify styling
    if (headerCount > 0) {
      const firstHeader = categoryHeaders.first();
      const classes = await firstHeader.getAttribute('class');

      // Should have the distinct background color
      expect(classes).toContain('bg-slate-700');

      // Should have border styling
      expect(classes).toContain('border');
    }
  });

  test('category names are bold and prominent', async ({ page }) => {
    // Find category name elements
    const categoryNames = page.locator('[data-testid="category-name"]');
    const nameCount = await categoryNames.count();

    // If there are category names, verify styling
    if (nameCount > 0) {
      const firstName = categoryNames.first();
      const classes = await firstName.getAttribute('class');

      // Should have bold font weight
      expect(classes).toContain('font-bold');

      // Should have larger text size (text-sm instead of text-xs)
      expect(classes).toContain('text-sm');

      // Should have lighter text color (slate-100 instead of slate-200)
      expect(classes).toContain('text-slate-100');
    }
  });

  test('category headers are clickable for collapse/expand', async ({ page }) => {
    // Find collapsible category headers (not the flat variant)
    const categoryHeader = page.locator('[data-testid="category-header"]').first();

    // Check if header exists
    const headerExists = await categoryHeader.count() > 0;

    if (headerExists) {
      // Header should be a button element (collapsible)
      const tagName = await categoryHeader.evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('button');

      // Should have aria-expanded attribute
      const ariaExpanded = await categoryHeader.getAttribute('aria-expanded');
      expect(ariaExpanded).not.toBeNull();
    }
  });

  test('category collapse indicator rotates on click', async ({ page }) => {
    // Find a collapsible category header
    const categoryHeader = page.locator('[data-testid="category-header"]').first();

    const headerExists = await categoryHeader.count() > 0;

    if (headerExists) {
      // Get initial aria-expanded state
      const initialState = await categoryHeader.getAttribute('aria-expanded');

      // Click to toggle
      await categoryHeader.click();
      await page.waitForTimeout(200);

      // State should have changed
      const newState = await categoryHeader.getAttribute('aria-expanded');
      expect(newState).not.toBe(initialState);
    }
  });
});
