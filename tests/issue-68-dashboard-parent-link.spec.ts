/**
 * Issue #68: Dashboard parent link should navigate to main dashboard page
 *
 * Bug: Clicking on "Dashboard" in the sidebar may only expand/collapse children
 * without navigating to the main dashboard page.
 *
 * Success Criteria:
 * - [ ] Clicking "Dashboard" text navigates to /dashboard
 * - [ ] Child pages still accessible via their own links
 * - [ ] Expand/collapse behavior preserved (via chevron or separate control)
 */

import { test, expect } from '@playwright/test';

test.describe('Issue #68: Dashboard parent link navigates to /dashboard', () => {

  test.beforeEach(async ({ page }) => {
    // Start on a non-dashboard page
    await page.goto('/manage/habits');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
  });

  test('clicking Dashboard label navigates to /dashboard', async ({ page }) => {
    // Click on the Dashboard nav item
    const dashboardNav = page.locator('[data-testid="nav-dashboard"]');
    await dashboardNav.click();

    // Should navigate to dashboard (root path)
    await expect(page).toHaveURL('/');

    // Dashboard content should be visible
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
  });

  test('clicking chevron expands/collapses without navigating', async ({ page }) => {
    // Find the chevron in the Dashboard nav item
    const dashboardNav = page.locator('[data-testid="nav-dashboard"]');
    const chevron = dashboardNav.locator('[data-testid="nav-chevron"]');

    // Get current URL
    const initialUrl = page.url();

    // Click chevron to toggle
    await chevron.click();

    // URL should not change
    await expect(page).toHaveURL(initialUrl);

    // Children should be visible (expanded)
    const children = page.locator('[data-testid="nav-dashboard-children"]');
    await expect(children).toBeVisible();

    // Click chevron again to collapse
    await chevron.click();

    // URL still shouldn't change
    await expect(page).toHaveURL(initialUrl);
  });

  test('child pages accessible via their own links', async ({ page }) => {
    // Expand Dashboard children first
    const dashboardNav = page.locator('[data-testid="nav-dashboard"]');
    const chevron = dashboardNav.locator('[data-testid="nav-chevron"]');
    await chevron.click();

    // Wait for children to be visible
    await page.waitForSelector('[data-testid="nav-dashboard-children"]');

    // Click first child page
    const children = page.locator('[data-testid="nav-dashboard-children"] button').first();
    await children.click();

    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
  });

  test('dashboard parent is highlighted when on dashboard page', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    await page.waitForSelector('[data-testid="dashboard-page"]');

    // Dashboard nav item should have active styling
    const dashboardNav = page.locator('[data-testid="nav-dashboard"]');
    await expect(dashboardNav).toHaveClass(/active|bg-teal|selected/);
  });
});
