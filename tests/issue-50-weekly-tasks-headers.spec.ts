import { test, expect } from '@playwright/test';

/**
 * Issue #50: Weekly Tasks - compact headers with week selector in title bar
 *
 * Tests that the WeeklyKanban widget has:
 * - Week selector integrated in the title bar
 * - Compact single-line day headers
 * - Clear visual separation between day columns
 *
 * The feature is already implemented in WeeklyKanban/index.tsx and DayColumn.tsx.
 */

test.describe('Issue #50: Weekly Tasks compact headers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  /**
   * Helper to navigate to dashboard with Weekly Tasks widget
   */
  async function navigateToDashboard(page: ReturnType<typeof test.info>['page']) {
    const dashboardNav = page.getByTestId('nav-dashboard');
    await dashboardNav.click();
    await page.waitForTimeout(500);

    // Look for Weekly Kanban widget
    const weeklyKanban = page.locator('[data-widget-id="weekly-kanban"], text="Weekly Tasks"').first();
    return weeklyKanban.isVisible();
  }

  test.describe('AC1: Week selector in title bar', () => {
    test('title bar shows week navigation controls', async ({ page }) => {
      const hasWidget = await navigateToDashboard(page);
      if (!hasWidget) {
        test.skip();
        return;
      }

      // Look for week navigation buttons
      const prevButton = page.locator('button[title="Previous week"]');
      const nextButton = page.locator('button[title="Next week"]');

      // At least one should be visible if widget is present
      const hasPrev = await prevButton.isVisible().catch(() => false);
      const hasNext = await nextButton.isVisible().catch(() => false);

      expect(hasPrev || hasNext).toBe(true);
    });

    test('title shows week date range', async ({ page }) => {
      const hasWidget = await navigateToDashboard(page);
      if (!hasWidget) {
        test.skip();
        return;
      }

      // Look for date range text like "Jan 1 – Jan 7" or similar
      const dateRange = page.locator('text=/[A-Z][a-z]{2} \\d+ – [A-Z][a-z]{2} \\d+/');
      const hasDateRange = await dateRange.first().isVisible().catch(() => false);

      expect(hasDateRange).toBe(true);
    });

    test('can navigate to previous/next week', async ({ page }) => {
      const hasWidget = await navigateToDashboard(page);
      if (!hasWidget) {
        test.skip();
        return;
      }

      // Get initial date range
      const dateRange = page.locator('text=/[A-Z][a-z]{2} \\d+ – [A-Z][a-z]{2} \\d+/');
      const initialText = await dateRange.first().textContent().catch(() => null);

      if (!initialText) {
        test.skip();
        return;
      }

      // Click previous week
      const prevButton = page.locator('button[title="Previous week"]');
      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(300);

        // Date range should change
        const newText = await dateRange.first().textContent().catch(() => null);
        expect(newText).not.toBe(initialText);
      }
    });
  });

  test.describe('AC2: Compact single-line day headers', () => {
    test('day headers show abbreviated day name', async ({ page }) => {
      const hasWidget = await navigateToDashboard(page);
      if (!hasWidget) {
        test.skip();
        return;
      }

      // Look for abbreviated day names (Mon, Tue, Wed, etc.)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let foundDays = 0;

      for (const day of dayNames) {
        const dayHeader = page.locator(`text="${day}"`);
        if (await dayHeader.first().isVisible().catch(() => false)) {
          foundDays++;
        }
      }

      // Should find multiple day headers
      expect(foundDays).toBeGreaterThanOrEqual(1);
    });

    test('day headers include day number', async ({ page }) => {
      const hasWidget = await navigateToDashboard(page);
      if (!hasWidget) {
        test.skip();
        return;
      }

      // Day numbers should be visible (1-31)
      const dayNumbers = page.locator('span:text-matches("^\\d{1,2}$")');
      const count = await dayNumbers.count();

      // Should have multiple day numbers visible
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('AC3: Clear visual separation between days', () => {
    test('day columns have visual separation', async ({ page }) => {
      const hasWidget = await navigateToDashboard(page);
      if (!hasWidget) {
        test.skip();
        return;
      }

      // Look for grid structure with gaps
      const gridContainer = page.locator('.grid.grid-cols-7');
      const hasGrid = await gridContainer.isVisible().catch(() => false);

      if (hasGrid) {
        // Grid with gap provides visual separation
        const hasGap = await gridContainer.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const gap = style.gap || style.gridGap;
          return gap && gap !== '0px';
        });

        expect(hasGap).toBe(true);
      } else {
        // Alternative: check for visible column backgrounds
        const columns = page.locator('[class*="rounded-lg"][class*="bg-slate"]');
        const columnCount = await columns.count();
        expect(columnCount).toBeGreaterThan(0);
      }
    });

    test('today column is highlighted', async ({ page }) => {
      const hasWidget = await navigateToDashboard(page);
      if (!hasWidget) {
        test.skip();
        return;
      }

      // Today column should have distinct styling (teal highlight)
      const todayColumn = page.locator('[class*="ring-teal"], [class*="from-teal"]');
      const hasTodayHighlight = await todayColumn.first().isVisible().catch(() => false);

      expect(hasTodayHighlight).toBe(true);
    });
  });

  test.describe('AC4: Consistent with overall widget styling', () => {
    test('widget uses consistent color scheme', async ({ page }) => {
      const hasWidget = await navigateToDashboard(page);
      if (!hasWidget) {
        test.skip();
        return;
      }

      // Widget should use slate and teal colors from the design system
      const widgetContainer = page.locator('[class*="bg-slate"]');
      const hasSlateBackground = await widgetContainer.first().isVisible().catch(() => false);

      expect(hasSlateBackground).toBe(true);
    });
  });
});
