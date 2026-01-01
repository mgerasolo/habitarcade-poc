import { test, expect } from '@playwright/test';

/**
 * Today Screen Tests
 *
 * Tests for the Today page feature (Issue #15)
 * Verifies navigation, page rendering, and section visibility
 */

test.describe('Today Screen', () => {
  test('Today screen acceptance criteria', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // ACCEPTANCE CRITERIA 1: "Today" nav item appears in left sidebar
    const todayNavItem = page.getByRole('button', { name: /today/i });
    await expect(todayNavItem).toBeVisible();

    // Verify Today is first in navigation
    const navButtons = page.locator('aside nav button');
    const firstNavButton = navButtons.first();
    await expect(firstNavButton).toContainText('Today');

    // ACCEPTANCE CRITERIA 2: Today page is default landing page
    const todayPage = page.getByTestId('today-page');
    await expect(todayPage).toBeVisible();

    // ACCEPTANCE CRITERIA 3: Today screen shows today's habits with completion status
    const habitsSection = page.getByTestId('today-habits-section');
    await expect(habitsSection).toBeVisible();
    await expect(page.getByText("Today's Habits")).toBeVisible();

    // ACCEPTANCE CRITERIA 4: Today screen shows today's tasks grouped by priority/status
    const tasksSection = page.getByTestId('today-tasks-section');
    await expect(tasksSection).toBeVisible();
    await expect(page.getByText("Today's Tasks")).toBeVisible();

    // ACCEPTANCE CRITERIA 5: Today screen shows today's time blocks
    const timeBlocksSection = page.getByTestId('today-timeblocks-section');
    await expect(timeBlocksSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Time Blocks' })).toBeVisible();

    // ACCEPTANCE CRITERIA 6: Quick add functionality for tasks and habits
    await expect(page.getByRole('button', { name: /quick task/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /quick habit/i })).toBeVisible();

    // Verify greeting is displayed
    const greetingPattern = /Good (Morning|Afternoon|Evening)/;
    await expect(page.getByRole('heading', { name: greetingPattern })).toBeVisible();

    // Verify current date is displayed (check for any day of week)
    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/;
    await expect(page.getByTestId('today-page').locator('header')).toContainText(dayPattern);
  });

  test('Navigation to Today page works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Dashboard first
    const dashboardNavItem = page.getByRole('button', { name: /dashboard/i });
    await dashboardNavItem.click();

    // Wait for page change
    await page.waitForTimeout(500);

    // Now click Today nav item
    const todayNavItem = page.getByRole('button', { name: /today/i });
    await todayNavItem.click();

    // Today page should be visible
    const todayPage = page.getByTestId('today-page');
    await expect(todayPage).toBeVisible();
  });
});
