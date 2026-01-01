import { test, expect } from '@playwright/test';

/**
 * Kanban Views Tests
 *
 * Tests for the Kanban view options under Tasks menu (Issue #17)
 * Verifies expandable Tasks section with Kanban sub-views in sidebar
 */

test.describe('Kanban Views Navigation', () => {
  test('Tasks menu is expandable with Kanban sub-views', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // ACCEPTANCE CRITERIA 1: Tasks nav item appears in left sidebar
    const tasksNavItem = page.getByTestId('nav-tasks');
    await expect(tasksNavItem).toBeVisible();

    // ACCEPTANCE CRITERIA 2: Tasks section is expandable (should show children container)
    const tasksChildren = page.getByTestId('nav-tasks-children');
    await expect(tasksChildren).toBeVisible();

    // ACCEPTANCE CRITERIA 3: Kanban sub-views are visible when Tasks is expanded
    await expect(page.getByTestId('nav-kanban-day')).toBeVisible();
    await expect(page.getByTestId('nav-kanban-status')).toBeVisible();
    await expect(page.getByTestId('nav-kanban-project')).toBeVisible();
    await expect(page.getByTestId('nav-kanban-category')).toBeVisible();

    // Verify the sub-view labels are correct
    await expect(page.getByText('Day View')).toBeVisible();
    await expect(page.getByText('Status View')).toBeVisible();
    await expect(page.getByText('Project View')).toBeVisible();
    await expect(page.getByText('Category View')).toBeVisible();
  });

  test('Tasks menu can be collapsed and expanded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const tasksNavItem = page.getByTestId('nav-tasks');
    const tasksChildren = page.getByTestId('nav-tasks-children');

    // Tasks should be expanded by default
    await expect(tasksChildren).toBeVisible();

    // Click Tasks to collapse
    await tasksNavItem.click();
    await expect(tasksChildren).not.toBeVisible();

    // Click Tasks again to expand
    await tasksNavItem.click();
    await expect(tasksChildren).toBeVisible();
  });

  test('Kanban sub-view navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click on Day View
    const dayViewNav = page.getByTestId('nav-kanban-day');
    await dayViewNav.click();

    // Verify Day View nav is active (has active styling)
    await expect(dayViewNav).toHaveClass(/bg-slate-700/);

    // Click on Status View
    const statusViewNav = page.getByTestId('nav-kanban-status');
    await statusViewNav.click();

    // Verify Status View nav is active
    await expect(statusViewNav).toHaveClass(/bg-slate-700/);
  });

  test('Sidebar shows expand/collapse arrow on Tasks item', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // The Tasks nav item should have an expand/collapse indicator
    const tasksNavItem = page.getByTestId('nav-tasks');

    // Look for the ExpandMore icon inside the Tasks button
    const expandIcon = tasksNavItem.locator('svg').last();
    await expect(expandIcon).toBeVisible();
  });
});
