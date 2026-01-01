import { test, expect } from '@playwright/test';

/**
 * HabitMatrix Unified Header Tests
 *
 * Tests for Issue #24: Merge duplicate headers into single collapsible title bar
 *
 * These tests verify:
 * - Single unified header is displayed (no duplicate headers)
 * - Month navigation works correctly
 * - View mode selector works (3D, 7D, Mo)
 * - Collapse/expand functionality works
 */

test.describe('HabitMatrix Unified Header', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard (uses baseURL from playwright.config.ts)
    await page.goto('/');

    // Wait for the habit matrix widget to load (any state: normal, loading, empty, or error)
    await page.waitForSelector('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]', {
      timeout: 10000,
    });
  });

  test('displays single unified header', async ({ page }) => {
    // Find the habit matrix widget container
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // There should be only one header in the habit matrix widget container
    const headerCount = await habitMatrixContainer.locator('[data-testid="widget-header"]').count();
    expect(headerCount).toBe(1);

    // The header should contain the widget title "Habit Matrix"
    const headerText = await habitMatrixContainer.locator('[data-testid="widget-header"]').textContent();
    expect(headerText).toContain('Habit Matrix');
  });

  test('header includes month selector', async ({ page }) => {
    // Find the habit matrix widget
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // The header should contain the month selector
    const monthSelector = habitMatrixContainer.locator('[data-testid="month-selector"]');
    await expect(monthSelector).toBeVisible();

    // Month selector should have prev/next buttons
    await expect(habitMatrixContainer.locator('[data-testid="prev-month"]')).toBeVisible();
    await expect(habitMatrixContainer.locator('[data-testid="next-month"]')).toBeVisible();
    await expect(habitMatrixContainer.locator('[data-testid="current-month"]')).toBeVisible();
  });

  test('month navigation works correctly', async ({ page }) => {
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // Get the current month text
    const currentMonthText = await habitMatrixContainer.locator('[data-testid="current-month"]').textContent();

    // Click previous month
    await habitMatrixContainer.locator('[data-testid="prev-month"]').click();

    // Wait for the month to update
    await page.waitForTimeout(100);

    // Get the new month text
    const newMonthText = await habitMatrixContainer.locator('[data-testid="current-month"]').textContent();

    // The month should have changed
    expect(newMonthText).not.toBe(currentMonthText);

    // Click next month twice to go forward
    await habitMatrixContainer.locator('[data-testid="next-month"]').click();
    await page.waitForTimeout(100);

    // Should be back to original month
    const restoredMonthText = await habitMatrixContainer.locator('[data-testid="current-month"]').textContent();
    expect(restoredMonthText).toBe(currentMonthText);
  });

  test('header includes view mode selector', async ({ page }) => {
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // View toggle should be visible
    const viewToggle = habitMatrixContainer.locator('[data-testid="view-toggle"]');
    await expect(viewToggle).toBeVisible();

    // All three view options should be present
    await expect(habitMatrixContainer.locator('[data-testid="view-3d"]')).toBeVisible();
    await expect(habitMatrixContainer.locator('[data-testid="view-7d"]')).toBeVisible();
    await expect(habitMatrixContainer.locator('[data-testid="view-month"]')).toBeVisible();
  });

  test('view mode selector changes view', async ({ page }) => {
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // Click 3D view
    await habitMatrixContainer.locator('[data-testid="view-3d"]').click();
    await page.waitForTimeout(100);

    // The 3D button should have the active class (bg-teal-600)
    const view3dClasses = await habitMatrixContainer.locator('[data-testid="view-3d"]').getAttribute('class');
    expect(view3dClasses).toContain('bg-teal-600');

    // Click 7D view
    await habitMatrixContainer.locator('[data-testid="view-7d"]').click();
    await page.waitForTimeout(100);

    // The 7D button should now have the active class
    const view7dClasses = await habitMatrixContainer.locator('[data-testid="view-7d"]').getAttribute('class');
    expect(view7dClasses).toContain('bg-teal-600');

    // 3D should no longer be active
    const view3dClassesAfter = await habitMatrixContainer.locator('[data-testid="view-3d"]').getAttribute('class');
    expect(view3dClassesAfter).not.toContain('bg-teal-600');
  });

  test('collapse/expand toggle works', async ({ page }) => {
    // First, find the habit matrix widget container while it's expanded
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // Find the collapse toggle button
    const collapseToggle = habitMatrixContainer.locator('[data-testid="collapse-toggle"]');
    await expect(collapseToggle).toBeVisible();

    // Get the content area within this container
    const contentArea = habitMatrixContainer.locator('[data-testid="widget-content"]');
    await expect(contentArea).toBeVisible();
    const initialClasses = await contentArea.getAttribute('class');
    expect(initialClasses).toContain('p-3');
    expect(initialClasses).not.toContain('h-0');

    // Use nth-match to get a stable index reference to the widget wrapper
    // Find which index the habit-matrix wrapper is
    const allWrappers = page.locator('.widget-wrapper');
    const wrapperCount = await allWrappers.count();
    let habitMatrixIndex = -1;
    for (let i = 0; i < wrapperCount; i++) {
      const wrapper = allWrappers.nth(i);
      const hasHabitMatrix = await wrapper.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]').count() > 0;
      if (hasHabitMatrix) {
        habitMatrixIndex = i;
        break;
      }
    }
    expect(habitMatrixIndex).toBeGreaterThanOrEqual(0);

    // Now use the stable index-based locator
    const stableWrapper = allWrappers.nth(habitMatrixIndex);
    const stableToggle = stableWrapper.locator('[data-testid="collapse-toggle"]');
    const stableContent = stableWrapper.locator('[data-testid="widget-content"]');

    // Click to collapse
    await stableToggle.click();

    // Wait for the transition and check collapsed state
    await expect(stableContent).toHaveClass(/h-0/, { timeout: 5000 });
    const collapsedClasses = await stableContent.getAttribute('class');
    expect(collapsedClasses).toContain('h-0');
    expect(collapsedClasses).toContain('p-0');

    // Click to expand
    await stableToggle.click();

    // Wait for the transition and check expanded state
    await expect(stableContent).not.toHaveClass(/h-0/, { timeout: 5000 });
    const expandedClasses = await stableContent.getAttribute('class');
    expect(expandedClasses).not.toContain('h-0');
    expect(expandedClasses).toContain('p-3');
  });

  test('header controls are in unified header, not duplicated', async ({ page }) => {
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // There should be only ONE month selector in the entire widget
    const monthSelectorCount = await habitMatrixContainer.locator('[data-testid="month-selector"]').count();
    expect(monthSelectorCount).toBe(1);

    // There should be only ONE view toggle in the entire widget
    const viewToggleCount = await habitMatrixContainer.locator('[data-testid="view-toggle"]').count();
    expect(viewToggleCount).toBe(1);

    // The month selector and view toggle should be inside the widget header
    const headerMonthSelector = habitMatrixContainer.locator('[data-testid="widget-header"] [data-testid="month-selector"]');
    await expect(headerMonthSelector).toBeVisible();

    const headerViewToggle = habitMatrixContainer.locator('[data-testid="widget-header"] [data-testid="view-toggle"]');
    await expect(headerViewToggle).toBeVisible();
  });

  test('widget menu button is present', async ({ page }) => {
    const habitMatrixContainer = page.locator('.widget-wrapper').filter({
      has: page.locator('[data-testid="habit-matrix"], [data-testid="habit-matrix-loading"], [data-testid="habit-matrix-empty"], [data-testid="habit-matrix-error"]'),
    });

    // Widget menu button should be present in the header
    const widgetMenu = habitMatrixContainer.locator('[data-testid="widget-menu"]');
    await expect(widgetMenu).toBeVisible();
  });
});
