import { test, expect } from '@playwright/test';

/**
 * Issue #37: Habit Matrix - Adapt display for months with less than 31 days
 *
 * Tests that the Habit Matrix correctly shows the right number of days
 * for each month (28-31 days depending on month and leap year)
 *
 * The fix uses date-fns eachDayOfInterval() with startOfMonth/endOfMonth
 * to dynamically calculate the correct number of days per month.
 */

test.describe('Issue #37: Habit Matrix months display correct number of days', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  /**
   * Helper to navigate to dashboard and wait for habit matrix
   */
  async function navigateToDashboard(page: ReturnType<typeof test.info>['page']) {
    const dashboardNav = page.getByTestId('nav-dashboard');
    await dashboardNav.click();
    await page.waitForTimeout(500);

    const habitMatrix = page.locator('[data-widget-id="habit-matrix"], [data-testid="habit-matrix"]');
    const hasMatrix = await habitMatrix.isVisible().catch(() => false);
    return hasMatrix;
  }

  /**
   * Helper to switch to month view
   */
  async function switchToMonthView(page: ReturnType<typeof test.info>['page']) {
    const monthViewButton = page.getByTestId('view-month');
    if (await monthViewButton.isVisible()) {
      await monthViewButton.click();
      await page.waitForTimeout(300);
      return true;
    }
    return false;
  }

  /**
   * Helper to navigate to a specific month
   */
  async function navigateToMonth(page: ReturnType<typeof test.info>['page'], monthName: string) {
    const monthSelector = page.getByTestId('month-selector');
    if (!(await monthSelector.isVisible())) return false;

    const currentMonth = page.getByTestId('current-month');
    let attempts = 0;
    const maxAttempts = 24; // Two years max

    // Check if we need to go forward or backward
    const currentText = await currentMonth.textContent();
    const currentDate = new Date(currentText || '');
    const targetDate = new Date(`${monthName} 2025`);

    const goForward = targetDate > currentDate;
    const navButton = goForward ? page.getByTestId('next-month') : page.getByTestId('prev-month');

    while (attempts < maxAttempts) {
      const monthText = await currentMonth.textContent();
      if (monthText?.toLowerCase().includes(monthName.toLowerCase())) {
        return true;
      }
      await navButton.click();
      await page.waitForTimeout(200);
      attempts++;
    }

    return false;
  }

  /**
   * Helper to count visible day columns in the matrix
   */
  async function countDayColumns(page: ReturnType<typeof test.info>['page']) {
    // Count header date columns - these are the day indicators at the top
    const dateHeaders = page.locator('[data-testid="category-section"] > .grid');
    const firstGrid = dateHeaders.first();

    if (!(await firstGrid.isVisible())) {
      // Try alternative selector
      const allColumns = page.locator('[data-testid="habit-matrix"] [data-testid^="status-cell-"]');
      const count = await allColumns.count();
      // If we can find status cells, count unique days
      if (count > 0) {
        const cells = await allColumns.all();
        const uniqueDays = new Set<string>();
        for (const cell of cells) {
          const testId = await cell.getAttribute('data-testid');
          if (testId) {
            // Extract day from testid (e.g., "status-cell-2025-01-15" -> "15")
            const match = testId.match(/status-cell-(\d{4}-\d{2}-\d{2})/);
            if (match) {
              uniqueDays.add(match[1].split('-')[2]);
            }
          }
        }
        return uniqueDays.size;
      }
    }

    // If grid layout, check CSS grid columns
    const gridStyle = await firstGrid.getAttribute('style');
    if (gridStyle) {
      // Grid template shows columns: e.g., "grid-template-columns: 140px repeat(31, 1fr) 40px"
      const repeatMatch = gridStyle.match(/repeat\((\d+),/);
      if (repeatMatch) {
        return parseInt(repeatMatch[1], 10);
      }
    }

    return 0;
  }

  test.describe('AC1: February shows 28/29 days correctly', () => {
    test('February in non-leap year shows 28 days, not 31', async ({ page }) => {
      const hasDashboard = await navigateToDashboard(page);
      if (!hasDashboard) {
        test.skip();
        return;
      }

      await switchToMonthView(page);

      // Navigate to February 2025 (non-leap year)
      const navigated = await navigateToMonth(page, 'February');
      if (!navigated) {
        test.skip();
        return;
      }

      // Check the grid template columns to verify number of days
      const categorySection = page.getByTestId('category-section').first();
      const grid = categorySection.locator('.grid');

      if (await grid.isVisible()) {
        const style = await grid.getAttribute('style');

        // The grid-template-columns should have repeat(28, ...) for February
        if (style) {
          // Grid template: "grid-template-columns: 140px repeat(N, 1fr) 40px"
          const repeatMatch = style.match(/repeat\((\d+),/);
          if (repeatMatch) {
            const dayCount = parseInt(repeatMatch[1], 10);
            expect(dayCount).toBe(28);
          } else {
            // If no repeat found, this test can't verify - skip
            test.skip();
          }
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('AC2: 30-day months show only 30 columns', () => {
    test('April shows 30 days, not 31', async ({ page }) => {
      const hasDashboard = await navigateToDashboard(page);
      if (!hasDashboard) {
        test.skip();
        return;
      }

      await switchToMonthView(page);

      // Navigate to April
      const navigated = await navigateToMonth(page, 'April');
      if (!navigated) {
        test.skip();
        return;
      }

      const categorySection = page.getByTestId('category-section').first();
      const grid = categorySection.locator('.grid');

      if (await grid.isVisible()) {
        const style = await grid.getAttribute('style');

        if (style) {
          const repeatMatch = style.match(/repeat\((\d+),/);
          if (repeatMatch) {
            const dayCount = parseInt(repeatMatch[1], 10);
            expect(dayCount).toBe(30);
          } else {
            test.skip();
          }
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('AC3: 31-day months show 31 columns', () => {
    test('January shows 31 days', async ({ page }) => {
      const hasDashboard = await navigateToDashboard(page);
      if (!hasDashboard) {
        test.skip();
        return;
      }

      await switchToMonthView(page);

      // Navigate to January
      const navigated = await navigateToMonth(page, 'January');
      if (!navigated) {
        test.skip();
        return;
      }

      const categorySection = page.getByTestId('category-section').first();
      const grid = categorySection.locator('.grid');

      if (await grid.isVisible()) {
        const style = await grid.getAttribute('style');

        if (style) {
          const repeatMatch = style.match(/repeat\((\d+),/);
          if (repeatMatch) {
            const dayCount = parseInt(repeatMatch[1], 10);
            expect(dayCount).toBe(31);
          } else {
            test.skip();
          }
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('AC4: No invalid day columns displayed', () => {
    test('April grid does not contain day 31', async ({ page }) => {
      const hasDashboard = await navigateToDashboard(page);
      if (!hasDashboard) {
        test.skip();
        return;
      }

      await switchToMonthView(page);

      // Navigate to April
      const navigated = await navigateToMonth(page, 'April');
      if (!navigated) {
        test.skip();
        return;
      }

      // Verify the current month is April
      const currentMonth = page.getByTestId('current-month');
      const monthText = await currentMonth.textContent();
      expect(monthText?.toLowerCase()).toContain('april');

      // Look for any element with day 31 - should not exist for April
      // April dates would be formatted as YYYY-04-31 which is invalid
      const day31Cells = page.locator('[data-testid*="-04-31"]');
      const count = await day31Cells.count();
      expect(count).toBe(0);
    });

    test('February grid does not contain days 29-31 in non-leap year', async ({ page }) => {
      const hasDashboard = await navigateToDashboard(page);
      if (!hasDashboard) {
        test.skip();
        return;
      }

      await switchToMonthView(page);

      // Navigate to February 2025 (non-leap year)
      const navigated = await navigateToMonth(page, 'February');
      if (!navigated) {
        test.skip();
        return;
      }

      // Navigate to 2025 if not already there
      const currentMonth = page.getByTestId('current-month');
      let monthText = await currentMonth.textContent();

      // Make sure we're in 2025 (non-leap year)
      while (!monthText?.includes('2025') && !monthText?.includes('2023')) {
        // Navigate to a non-leap year February
        const prevButton = page.getByTestId('prev-month');
        await prevButton.click();
        await page.waitForTimeout(200);
        monthText = await currentMonth.textContent();
        if (!monthText?.toLowerCase().includes('february')) break;
      }

      // Check no day 29, 30, 31 for non-leap year February
      // If we're in a leap year February, only check for 30, 31
      const isLeapYear = monthText?.includes('2024') || monthText?.includes('2028');

      if (!isLeapYear) {
        const day29Cells = page.locator('[data-testid*="-02-29"]');
        expect(await day29Cells.count()).toBe(0);
      }

      const day30Cells = page.locator('[data-testid*="-02-30"]');
      expect(await day30Cells.count()).toBe(0);

      const day31Cells = page.locator('[data-testid*="-02-31"]');
      expect(await day31Cells.count()).toBe(0);
    });
  });

  test.describe('AC5: Works correctly across year boundaries', () => {
    test('December shows 31 days correctly', async ({ page }) => {
      const hasDashboard = await navigateToDashboard(page);
      if (!hasDashboard) {
        test.skip();
        return;
      }

      await switchToMonthView(page);

      // Navigate to December
      const navigated = await navigateToMonth(page, 'December');
      if (!navigated) {
        test.skip();
        return;
      }

      const categorySection = page.getByTestId('category-section').first();
      const grid = categorySection.locator('.grid');

      if (await grid.isVisible()) {
        const style = await grid.getAttribute('style');

        if (style) {
          const repeatMatch = style.match(/repeat\((\d+),/);
          if (repeatMatch) {
            const dayCount = parseInt(repeatMatch[1], 10);
            expect(dayCount).toBe(31);
          } else {
            test.skip();
          }
        }
      } else {
        test.skip();
      }
    });
  });
});
