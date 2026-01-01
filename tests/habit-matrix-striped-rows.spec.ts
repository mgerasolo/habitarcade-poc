import { test, expect } from '@playwright/test';

/**
 * HabitMatrix Striped Rows Tests
 *
 * Tests for Issue #20: Add alternating row colors (zebra striping) to Habit Matrix
 *
 * These tests verify:
 * - Odd rows have a different background color than even rows
 * - Striping is applied to both regular and compact habit rows
 * - Striping persists across categories
 */

test.describe('HabitMatrix Striped Rows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard (uses baseURL from playwright.config.ts)
    await page.goto('/');

    // Wait for the habit matrix widget to load (any state: normal, loading, empty, or error)
    await page.waitForSelector('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]', {
      timeout: 10000,
    });
  });

  test('habit rows have alternating background colors', async ({ page }) => {
    // Find the habit matrix widget container
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // Find all habit rows within the matrix
    const habitRows = habitMatrixContainer.locator('.flex.items-center.gap-0\\.5, .flex.items-center.gap-1');
    const rowCount = await habitRows.count();

    // Skip test if no habit rows are present (empty state)
    if (rowCount < 2) {
      test.skip();
      return;
    }

    // Check that odd rows (index 1, 3, 5...) have the striped background class
    for (let i = 0; i < Math.min(rowCount, 4); i++) {
      const row = habitRows.nth(i);
      const classList = await row.getAttribute('class');

      if (i % 2 === 1) {
        // Odd rows should have the striped background
        expect(classList).toContain('bg-slate-800/30');
      } else {
        // Even rows should have transparent background
        expect(classList).toContain('bg-transparent');
      }
    }
  });

  test('striping applies visual distinction between rows', async ({ page }) => {
    // Find the habit matrix widget
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // Find habit rows
    const habitRows = habitMatrixContainer.locator('.flex.items-center.gap-0\\.5, .flex.items-center.gap-1');
    const rowCount = await habitRows.count();

    if (rowCount < 2) {
      test.skip();
      return;
    }

    // Get computed background color for first two rows
    const evenRow = habitRows.nth(0);
    const oddRow = habitRows.nth(1);

    const evenBg = await evenRow.evaluate((el) => getComputedStyle(el).backgroundColor);
    const oddBg = await oddRow.evaluate((el) => getComputedStyle(el).backgroundColor);

    // The backgrounds should be different (odd rows have subtle striping)
    // Note: bg-transparent renders as rgba(0, 0, 0, 0)
    // bg-slate-800/30 renders as a slightly visible color
    expect(evenBg).not.toBe(oddBg);
  });
});
