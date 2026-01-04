import { test, expect } from '@playwright/test';

/**
 * Header Date Selector Tests
 *
 * Tests for Issue #14: Remove global date selector from top nav bar
 * Verifies that the date navigation has been removed from the header
 */

test.describe('Header: No Global Date Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test('header does not contain date navigation buttons', async ({ page }) => {
    const header = page.getByTestId('main-header');
    await expect(header).toBeVisible();

    // Check there are no prev/next date buttons
    const prevDateButton = header.locator('button[aria-label*="previous"]').first();
    const nextDateButton = header.locator('button[aria-label*="next"]').first();

    const hasPrev = await prevDateButton.isVisible().catch(() => false);
    const hasNext = await nextDateButton.isVisible().catch(() => false);

    expect(hasPrev).toBeFalsy();
    expect(hasNext).toBeFalsy();
  });

  test('header does not contain Today button for date navigation', async ({ page }) => {
    const header = page.getByTestId('main-header');
    await expect(header).toBeVisible();

    // The "Today" button for date navigation should not be in header
    // Note: "Today" nav item in sidebar is different
    const todayDateButton = header.locator('button:has-text("Today")');
    const hasTodayButton = await todayDateButton.isVisible().catch(() => false);

    expect(hasTodayButton).toBeFalsy();
  });

  test('header does not show current date display', async ({ page }) => {
    const header = page.getByTestId('main-header');
    await expect(header).toBeVisible();

    // Check there is no date display element in header
    const dateDisplay = header.getByTestId('current-date');
    const hasDateDisplay = await dateDisplay.isVisible().catch(() => false);

    expect(hasDateDisplay).toBeFalsy();
  });

  test('header contains only expected elements', async ({ page }) => {
    const header = page.getByTestId('main-header');
    await expect(header).toBeVisible();

    // Header should contain these elements
    const sidebarToggle = header.getByTestId('sidebar-toggle');
    const logo = header.getByTestId('header-logo');
    const rightSidebarToggle = header.getByTestId('right-sidebar-toggle');

    await expect(sidebarToggle).toBeVisible();
    await expect(logo).toBeVisible();
    await expect(rightSidebarToggle).toBeVisible();
  });

  test('header has edit mode button when on dashboard', async ({ page }) => {
    // Navigate to dashboard
    const dashboardNav = page.getByTestId('nav-dashboard');
    await dashboardNav.click();
    await page.waitForTimeout(500);

    const header = page.getByTestId('main-header');

    // Edit mode toggle should be visible on dashboard
    const editModeToggle = header.getByTestId('edit-mode-toggle');
    await expect(editModeToggle).toBeVisible();
  });
});
