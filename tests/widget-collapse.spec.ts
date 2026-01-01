import { test, expect } from '@playwright/test';

/**
 * Widget Collapse Tests
 *
 * Verifies that the widget collapse functionality works correctly:
 * - Collapsed widgets show only title bar
 * - Collapsed widgets take minimal vertical space
 * - Widgets can be expanded back to full height
 */

test.describe('Widget Collapse', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('habitarcade-dashboard');
    });

    // Navigate to the dashboard
    await page.goto('/');

    // Wait for the dashboard grid to load
    await page.waitForSelector('.layout', { timeout: 10000 });
  });

  test('should collapse widget when clicking minimize button', async ({ page }) => {
    // Find the Habit Matrix widget
    const habitMatrixWidget = page.locator('.widget-wrapper').filter({ hasText: 'Habit Matrix' });
    await expect(habitMatrixWidget).toBeVisible();

    // Get the initial height of the widget
    const initialBoundingBox = await habitMatrixWidget.boundingBox();
    expect(initialBoundingBox).not.toBeNull();
    const initialHeight = initialBoundingBox!.height;

    // Find the minimize button - it could be titled "Minimize" or "Collapse"
    let minimizeButton = habitMatrixWidget.locator('button[title="Minimize"]');
    if (!(await minimizeButton.count())) {
      minimizeButton = habitMatrixWidget.locator('button[title="Collapse"]');
    }
    await expect(minimizeButton).toBeVisible({ timeout: 5000 });
    await minimizeButton.click();

    // Wait for the layout to update
    await page.waitForTimeout(500);

    // Get the collapsed height
    const collapsedBoundingBox = await habitMatrixWidget.boundingBox();
    expect(collapsedBoundingBox).not.toBeNull();
    const collapsedHeight = collapsedBoundingBox!.height;

    // Collapsed height should be significantly less than initial height
    // The title bar is approximately 60-100px depending on styling
    expect(collapsedHeight).toBeLessThan(initialHeight * 0.5);

    // The maximize/expand button should now be visible
    let maximizeButton = habitMatrixWidget.locator('button[title="Maximize"]');
    if (!(await maximizeButton.count())) {
      maximizeButton = habitMatrixWidget.locator('button[title="Expand"]');
    }
    await expect(maximizeButton).toBeVisible();
  });

  test('should show only title bar when collapsed', async ({ page }) => {
    // Find the Weekly Tasks widget
    const weeklyKanbanWidget = page.locator('.widget-wrapper').filter({ hasText: 'Weekly Tasks' });
    await expect(weeklyKanbanWidget).toBeVisible();

    // Find and click the minimize button
    let minimizeButton = weeklyKanbanWidget.locator('button[title="Minimize"]');
    if (!(await minimizeButton.count())) {
      minimizeButton = weeklyKanbanWidget.locator('button[title="Collapse"]');
    }
    await minimizeButton.click();

    // Wait for animation
    await page.waitForTimeout(500);

    // Title should still be visible
    const title = weeklyKanbanWidget.locator('h3', { hasText: 'Weekly Tasks' });
    await expect(title).toBeVisible();

    // Content area should be hidden or have minimal height (close to zero)
    // The widget container uses h-0 on the content area when collapsed
    const contentArea = weeklyKanbanWidget.locator('.flex-1.overflow-auto, .flex-1.overflow-hidden');
    if (await contentArea.count()) {
      const contentHeight = await contentArea.evaluate((el) => el.clientHeight);
      // Allow small non-zero heights due to CSS transitions or padding
      expect(contentHeight).toBeLessThan(50);
    }
  });

  test('should expand widget back to full height', async ({ page }) => {
    // Find the Time Blocks widget
    const timeBlocksWidget = page.locator('.widget-wrapper').filter({ hasText: 'Time Blocks' });
    await expect(timeBlocksWidget).toBeVisible();

    // Get initial height
    const initialBoundingBox = await timeBlocksWidget.boundingBox();
    const initialHeight = initialBoundingBox!.height;

    // Find and click the minimize button
    let minimizeButton = timeBlocksWidget.locator('button[title="Minimize"]');
    if (!(await minimizeButton.count())) {
      minimizeButton = timeBlocksWidget.locator('button[title="Collapse"]');
    }
    await minimizeButton.click();
    await page.waitForTimeout(500);

    // Verify it's collapsed
    const collapsedBoundingBox = await timeBlocksWidget.boundingBox();
    expect(collapsedBoundingBox!.height).toBeLessThan(initialHeight * 0.5);

    // Find and click the maximize button to expand
    let maximizeButton = timeBlocksWidget.locator('button[title="Maximize"]');
    if (!(await maximizeButton.count())) {
      maximizeButton = timeBlocksWidget.locator('button[title="Expand"]');
    }
    await expect(maximizeButton).toBeVisible();
    await maximizeButton.click();
    await page.waitForTimeout(500);

    // Get the expanded height
    const expandedBoundingBox = await timeBlocksWidget.boundingBox();
    const expandedHeight = expandedBoundingBox!.height;

    // Expanded height should be close to the original (within 10% tolerance for any slight variations)
    expect(expandedHeight).toBeGreaterThan(initialHeight * 0.9);
    expect(expandedHeight).toBeLessThan(initialHeight * 1.1);
  });

  test('should persist collapsed state across page reload', async ({ page }) => {
    // Find and collapse the Quick Capture widget
    const quickCaptureWidget = page.locator('.widget-wrapper').filter({ hasText: 'Quick Capture' });
    await expect(quickCaptureWidget).toBeVisible();

    // Find and click minimize button
    let minimizeButton = quickCaptureWidget.locator('button[title="Minimize"]');
    if (!(await minimizeButton.count())) {
      minimizeButton = quickCaptureWidget.locator('button[title="Collapse"]');
    }
    await minimizeButton.click();
    await page.waitForTimeout(500);

    // Verify it's collapsed
    const collapsedBoundingBox = await quickCaptureWidget.boundingBox();
    const collapsedHeight = collapsedBoundingBox!.height;

    // Reload the page (don't clear localStorage this time to test persistence)
    await page.reload();
    await page.waitForSelector('.layout');

    // Wait a moment for layout to stabilize
    await page.waitForTimeout(500);

    // Find the widget again and check it's still collapsed
    const quickCaptureWidgetAfterReload = page.locator('.widget-wrapper').filter({ hasText: 'Quick Capture' });
    await expect(quickCaptureWidgetAfterReload).toBeVisible();

    const reloadedBoundingBox = await quickCaptureWidgetAfterReload.boundingBox();
    const reloadedHeight = reloadedBoundingBox!.height;

    // Height should still be collapsed (within small tolerance)
    expect(reloadedHeight).toBeLessThan(collapsedHeight * 1.2);
    expect(reloadedHeight).toBeGreaterThan(collapsedHeight * 0.8);

    // Maximize/Expand button should be visible
    let maximizeButton = quickCaptureWidgetAfterReload.locator('button[title="Maximize"]');
    if (!(await maximizeButton.count())) {
      maximizeButton = quickCaptureWidgetAfterReload.locator('button[title="Expand"]');
    }
    await expect(maximizeButton).toBeVisible();
  });

  test('collapsed widgets should take minimal vertical space in grid layout', async ({ page }) => {
    // This test verifies the main bug fix - widgets should reflow when one is collapsed
    // Collapse the Habit Matrix widget (which is a large widget)
    const habitMatrixWidget = page.locator('.widget-wrapper').filter({ hasText: 'Habit Matrix' });
    await expect(habitMatrixWidget).toBeVisible();

    // Get initial position of a widget below Habit Matrix (Progress Tracker is below it in default layout)
    const progressTrackerWidget = page.locator('.widget-wrapper').filter({ hasText: 'Progress Tracker' });
    await expect(progressTrackerWidget).toBeVisible();

    const initialTrackerBox = await progressTrackerWidget.boundingBox();
    const initialTrackerY = initialTrackerBox!.y;

    // Find and click minimize button
    let minimizeButton = habitMatrixWidget.locator('button[title="Minimize"]');
    if (!(await minimizeButton.count())) {
      minimizeButton = habitMatrixWidget.locator('button[title="Collapse"]');
    }
    await minimizeButton.click();

    // Wait for layout reflow
    await page.waitForTimeout(1000);

    // Check that Progress Tracker has moved up (y position should be smaller/higher on screen)
    const afterCollapseTrackerBox = await progressTrackerWidget.boundingBox();
    const afterCollapseTrackerY = afterCollapseTrackerBox!.y;

    // The Progress Tracker should have moved up significantly due to vertical compaction
    expect(afterCollapseTrackerY).toBeLessThan(initialTrackerY);
  });
});
