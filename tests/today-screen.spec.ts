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

    // Wait for sidebar to render
    await page.waitForTimeout(500);

    // ACCEPTANCE CRITERIA 1: "Today" nav item appears in left sidebar (using testid)
    // Use .first() as there may be multiple elements with nav-today (one in main nav, one in dashboard children)
    const todayNavItem = page.getByTestId('nav-today').first();
    await expect(todayNavItem).toBeVisible();

    // Verify Today is first in navigation (it should be first button in nav)
    const leftSidebar = page.locator('aside').first();
    const firstNavButton = leftSidebar.locator('nav button').first();
    await expect(firstNavButton).toContainText('Today');

    // Click on Today to navigate (it's the default page but make sure it's active)
    await todayNavItem.click();
    await page.waitForTimeout(300);

    // ACCEPTANCE CRITERIA 2: Today page is the landing page
    const todayPage = page.getByTestId('today-page');
    await expect(todayPage).toBeVisible({ timeout: 5000 });

    // ACCEPTANCE CRITERIA 3: Today screen shows today's habits section
    const habitsSection = page.getByTestId('today-habits-section');
    await expect(habitsSection).toBeVisible();
    await expect(todayPage.getByText("Today's Habits")).toBeVisible();

    // ACCEPTANCE CRITERIA 4: Today screen shows today's tasks section
    const tasksSection = page.getByTestId('today-tasks-section');
    await expect(tasksSection).toBeVisible();
    await expect(todayPage.getByText("Today's Tasks")).toBeVisible();

    // ACCEPTANCE CRITERIA 5: Today screen shows today's time blocks
    const timeBlocksSection = page.getByTestId('today-timeblocks-section');
    await expect(timeBlocksSection).toBeVisible();
    await expect(todayPage.getByRole('heading', { name: 'Time Blocks' })).toBeVisible();

    // Verify greeting is displayed (header contains greeting text)
    const headerGreeting = todayPage.locator('header');
    await expect(headerGreeting).toContainText(/Good (Morning|Afternoon|Evening)/);

    // Verify current date is displayed (check for any day of week)
    const dayPattern = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/;
    await expect(headerGreeting).toContainText(dayPattern);
  });

  test('Navigation to Today page works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for sidebar to render
    await page.waitForTimeout(500);

    // Navigate to Dashboard first using testid
    const dashboardNavItem = page.getByTestId('nav-dashboard');
    await dashboardNavItem.click();
    await page.waitForTimeout(500);

    // Dashboard should be visible
    const dashboardPage = page.getByTestId('dashboard-page');
    await expect(dashboardPage).toBeVisible({ timeout: 5000 });

    // Now click Today nav item (use .first() due to duplicate testids)
    const todayNavItem = page.getByTestId('nav-today').first();
    await todayNavItem.click();
    await page.waitForTimeout(300);

    // Today page should be visible
    const todayPage = page.getByTestId('today-page');
    await expect(todayPage).toBeVisible({ timeout: 5000 });
  });
});
