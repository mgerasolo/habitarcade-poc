import { test, expect } from '@playwright/test';

/**
 * Sidebar Navigation Tests
 *
 * Tests for sidebar navigation features:
 * - Issue #13: Manage Section in Sidebar
 * - Issue #16: Manage section (Categories, Projects, Tags, Priorities)
 * - Issue #19: Habits page from left menu
 */

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test.describe('Issue #13/#16: Manage Section', () => {
    test('Manage section is visible in sidebar', async ({ page }) => {
      const manageNav = page.getByTestId('nav-manage');
      await expect(manageNav).toBeVisible();
    });

    test('Manage section expands to show children on click', async ({ page }) => {
      const manageNav = page.getByTestId('nav-manage');
      await expect(manageNav).toBeVisible();

      // Click to expand (Manage is collapsed by default)
      await manageNav.click();
      await page.waitForTimeout(300);

      const manageChildren = page.getByTestId('nav-manage-children');
      await expect(manageChildren).toBeVisible();
    });

    test('Manage section contains Categories option', async ({ page }) => {
      // First expand Manage
      const manageNav = page.getByTestId('nav-manage');
      await manageNav.click();
      await page.waitForTimeout(300);

      const categoriesNav = page.getByTestId('nav-manage-categories');
      await expect(categoriesNav).toBeVisible();
    });

    test('Manage section contains Projects option', async ({ page }) => {
      const manageNav = page.getByTestId('nav-manage');
      await manageNav.click();
      await page.waitForTimeout(300);

      const projectsNav = page.getByTestId('nav-manage-projects');
      await expect(projectsNav).toBeVisible();
    });

    test('Manage section contains Tags option', async ({ page }) => {
      const manageNav = page.getByTestId('nav-manage');
      await manageNav.click();
      await page.waitForTimeout(300);

      const tagsNav = page.getByTestId('nav-manage-tags');
      await expect(tagsNav).toBeVisible();
    });

    test('Manage section contains Priorities option', async ({ page }) => {
      const manageNav = page.getByTestId('nav-manage');
      await manageNav.click();
      await page.waitForTimeout(300);

      const prioritiesNav = page.getByTestId('nav-manage-priorities');
      await expect(prioritiesNav).toBeVisible();
    });

    test('Manage section contains Habits option', async ({ page }) => {
      const manageNav = page.getByTestId('nav-manage');
      await manageNav.click();
      await page.waitForTimeout(300);

      const habitsNav = page.getByTestId('nav-manage-habits');
      await expect(habitsNav).toBeVisible();
    });

    test('Manage section contains Settings option', async ({ page }) => {
      const manageNav = page.getByTestId('nav-manage');
      await manageNav.click();
      await page.waitForTimeout(300);

      const settingsNav = page.getByTestId('nav-settings');
      await expect(settingsNav).toBeVisible();
    });

    test('Manage section can be collapsed and expanded', async ({ page }) => {
      const manageNav = page.getByTestId('nav-manage');

      // First expand
      await manageNav.click();
      await page.waitForTimeout(300);
      const manageChildren = page.getByTestId('nav-manage-children');
      await expect(manageChildren).toBeVisible();

      // Click to collapse
      await manageNav.click();
      await page.waitForTimeout(300);
      await expect(manageChildren).not.toBeVisible();

      // Click to expand again
      await manageNav.click();
      await page.waitForTimeout(300);
      await expect(manageChildren).toBeVisible();
    });
  });

  test.describe('Issue #19: Habits Page', () => {
    test('Habits nav item is visible in sidebar', async ({ page }) => {
      const habitsNav = page.getByTestId('nav-habits');
      await expect(habitsNav).toBeVisible();
    });

    test('Clicking Habits navigates to habits page', async ({ page }) => {
      const habitsNav = page.getByTestId('nav-habits');
      await habitsNav.click();
      await page.waitForTimeout(500);

      // Should see the habits page content (Habit Matrix)
      const habitMatrix = page.getByTestId('habit-matrix');
      const isMatrixVisible = await habitMatrix.isVisible({ timeout: 5000 }).catch(() => false);

      // If matrix not visible, check for loading or empty states
      if (!isMatrixVisible) {
        const loading = page.getByTestId('habit-matrix-loading');
        const empty = page.getByTestId('habit-matrix-empty');
        const isLoading = await loading.isVisible().catch(() => false);
        const isEmpty = await empty.isVisible().catch(() => false);
        expect(isMatrixVisible || isLoading || isEmpty).toBeTruthy();
      }
    });

    test('Habits page shows only Habit Matrix (not full dashboard)', async ({ page }) => {
      const habitsNav = page.getByTestId('nav-habits');
      await habitsNav.click();
      await page.waitForTimeout(500);

      // The habits page should NOT show the full dashboard grid
      // It should show only the habit matrix, not other widgets
      const dashboardGrid = page.locator('.react-grid-layout');
      const isDashboardVisible = await dashboardGrid.isVisible().catch(() => false);

      // If dashboard grid is visible, this might be the dashboard page not habits page
      // The habits page should have a specific layout
      const habitsPage = page.getByTestId('habits-page');
      const isHabitsPage = await habitsPage.isVisible().catch(() => false);

      // Either habits-page testid exists OR dashboard is NOT the full grid
      expect(isHabitsPage || !isDashboardVisible).toBeTruthy();
    });
  });

  test.describe('Main Navigation Items', () => {
    test('Today nav item is visible', async ({ page }) => {
      const todayNav = page.getByTestId('nav-today');
      await expect(todayNav.first()).toBeVisible();
    });

    test('Dashboard nav item is visible', async ({ page }) => {
      const dashboardNav = page.getByTestId('nav-dashboard');
      await expect(dashboardNav).toBeVisible();
    });

    test('Tasks nav item is visible', async ({ page }) => {
      const tasksNav = page.getByTestId('nav-tasks');
      await expect(tasksNav).toBeVisible();
    });
  });
});
