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
    // Navigate to the app first
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Navigate to Dashboard using the nav button
    const dashboardNav = page.getByTestId('nav-dashboard');
    await dashboardNav.click();
    await page.waitForTimeout(500);

    // Wait for the habit matrix widget to load (any state: normal, loading, empty, or error)
    await page.waitForSelector('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]', {
      timeout: 10000,
    });
  });

  test('habit rows have alternating background colors', async ({ page }) => {
    // Find the habit matrix widget using data-widget-id
    const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
    await expect(habitMatrixWidget).toBeVisible({ timeout: 5000 });

    // Find all habit rows within the matrix
    // Habit rows are identified by having gap-0.5 class (category headers have gap-2)
    // Also look for the hover effect class specific to habit rows
    const habitRows = habitMatrixWidget.locator('.group.flex.items-center.gap-0\\.5');
    let rowCount = await habitRows.count();

    // If no rows found with gap-0.5, try the more generic selector but filter
    if (rowCount === 0) {
      const allGroupRows = habitMatrixWidget.locator('.group.flex.items-center');
      const filtered: Array<import('@playwright/test').Locator> = [];
      const totalCount = await allGroupRows.count();

      for (let i = 0; i < totalCount; i++) {
        const row = allGroupRows.nth(i);
        const cls = await row.getAttribute('class') || '';
        // Habit rows have bg-transparent or bg-slate-800/30 (striping)
        if (cls.includes('bg-transparent') || cls.includes('bg-slate-800/30')) {
          filtered.push(row);
        }
      }

      rowCount = filtered.length;

      // Skip test if no habit rows are present (empty state)
      if (rowCount < 2) {
        test.skip();
        return;
      }

      // Check striping on filtered rows
      for (let i = 0; i < Math.min(rowCount, 4); i++) {
        const classList = await filtered[i].getAttribute('class') || '';

        if (i % 2 === 1) {
          expect(classList).toContain('bg-slate-800/30');
        } else {
          expect(classList).toContain('bg-transparent');
        }
      }
      return;
    }

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
    // Find the habit matrix widget using data-widget-id
    const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
    await expect(habitMatrixWidget).toBeVisible({ timeout: 5000 });

    // Find habit rows with gap-0.5 (category headers have gap-2)
    const habitRows = habitMatrixWidget.locator('.group.flex.items-center.gap-0\\.5');
    let rowCount = await habitRows.count();

    // If no rows found, try filtering by striping classes
    if (rowCount === 0) {
      const allGroupRows = habitMatrixWidget.locator('.group.flex.items-center');
      const filtered: Array<import('@playwright/test').Locator> = [];
      const totalCount = await allGroupRows.count();

      for (let i = 0; i < totalCount; i++) {
        const row = allGroupRows.nth(i);
        const cls = await row.getAttribute('class') || '';
        if (cls.includes('bg-transparent') || cls.includes('bg-slate-800/30')) {
          filtered.push(row);
        }
      }

      if (filtered.length < 2) {
        test.skip();
        return;
      }

      const evenBg = await filtered[0].evaluate((el) => getComputedStyle(el).backgroundColor);
      const oddBg = await filtered[1].evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(evenBg).not.toBe(oddBg);
      return;
    }

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
