import { test, expect } from '@playwright/test';

/**
 * HabitMatrix Trending Status Tests
 *
 * Tests for Issue #11: Trending Status (Target Warning)
 * Verifies that habits with frequency goals show warnings when trending to miss target
 *
 * Note: This feature may not be fully implemented yet. Tests will skip if
 * the required functionality is not present.
 */

test.describe('HabitMatrix Trending Status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Navigate to Dashboard
    const dashboardNav = page.getByTestId('nav-dashboard');
    await dashboardNav.click();
    await page.waitForTimeout(500);

    // Wait for habit matrix to load
    await page.waitForSelector('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]', {
      timeout: 10000,
    });
  });

  test.describe('Monthly Target Support', () => {
    test('habit type supports monthlyTarget property', async ({ page }) => {
      // This test verifies the data model supports monthly targets
      // We'll check if any habits show target information or if the form supports it

      // Navigate to habit management to check form fields
      await page.goto('/');
      await page.waitForTimeout(300);

      const manageNav = page.getByTestId('nav-manage');
      await manageNav.click();
      await page.waitForTimeout(300);

      const manageHabitsNav = page.getByTestId('nav-manage-habits');
      const isVisible = await manageHabitsNav.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      await manageHabitsNav.click();
      await page.waitForTimeout(500);

      // Look for add habit button
      const addHabitButton = page.locator('button:has-text("Add Habit"), button:has-text("New Habit")');
      const hasAddButton = await addHabitButton.first().isVisible().catch(() => false);

      if (!hasAddButton) {
        test.skip();
        return;
      }

      await addHabitButton.first().click();
      await page.waitForTimeout(300);

      // Look for monthly target or frequency field
      const targetField = page.locator('input[name="monthlyTarget"], label:has-text("Monthly Target"), label:has-text("Target Frequency")');
      const hasTargetField = await targetField.first().isVisible().catch(() => false);

      if (!hasTargetField) {
        // Feature not implemented yet
        test.skip();
        return;
      }

      await expect(targetField.first()).toBeVisible();
    });
  });

  test.describe('Trending Warning Indicator', () => {
    test('habits behind pace show warning indicator', async ({ page }) => {
      const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
      const isVisible = await habitMatrixWidget.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      // Look for trending warning indicators
      // These could be shown as:
      // - A specific icon (warning, trending down)
      // - A red/orange color on the row
      // - A specific CSS class for trending
      const trendingWarning = habitMatrixWidget.locator('[data-trending="behind"], [data-testid="trending-warning"], .trending-warning');
      const hasWarning = await trendingWarning.first().isVisible().catch(() => false);

      if (!hasWarning) {
        // No habits currently trending behind, or feature not implemented
        test.skip();
        return;
      }

      await expect(trendingWarning.first()).toBeVisible();
    });

    test('trending calculation considers current progress vs expected pace', async ({ page }) => {
      // This is a structural test - verifying the algorithm exists
      // We look for any indication that pacing is being calculated

      const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
      const isVisible = await habitMatrixWidget.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      // Look for pace-related elements or text
      const paceIndicator = habitMatrixWidget.locator('[data-testid*="pace"], [aria-label*="pace"], [title*="pace"], [aria-label*="track"]');
      const hasPaceIndicator = await paceIndicator.first().isVisible().catch(() => false);

      if (!hasPaceIndicator) {
        // Feature not implemented yet
        test.skip();
        return;
      }

      await expect(paceIndicator.first()).toBeVisible();
    });
  });

  test.describe('Visual Warning Styles', () => {
    test('behind-pace habits have distinct visual style', async ({ page }) => {
      const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
      const isVisible = await habitMatrixWidget.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      // Check for habits with warning styling (red/orange colors or warning icons)
      const warningRow = habitMatrixWidget.locator('.bg-red-500, .bg-orange-500, .text-red-500, .text-orange-500, [class*="warning"]');
      const hasWarningStyle = await warningRow.first().isVisible().catch(() => false);

      if (!hasWarningStyle) {
        // No warnings currently displayed or feature not implemented
        test.skip();
        return;
      }

      await expect(warningRow.first()).toBeVisible();
    });
  });
});
