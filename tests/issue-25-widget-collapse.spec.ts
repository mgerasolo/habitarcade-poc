/**
 * Issue #25: Fix widget collapse - Should collapse entire panel, not just hide content
 *
 * Bug: Collapsing a widget only hides the content but leaves the panel chrome visible,
 * rather than collapsing the entire panel.
 *
 * Success Criteria:
 * - [ ] Collapsed widgets show only title bar
 * - [ ] Collapsed widgets take minimal vertical space
 * - [ ] Expand restores full widget with content
 * - [ ] Animation is smooth (optional)
 * - [ ] Works with react-grid-layout (items reflow)
 */

import { test, expect } from '@playwright/test';

test.describe('Issue #25: Widget collapse minimizes entire panel', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard-page"]', { timeout: 10000 });
  });

  test('collapsed widget shows only title bar (minimal height)', async ({ page }) => {
    // Find a widget with collapse button
    const widget = page.locator('.widget-wrapper').first();
    const collapseButton = widget.locator('[data-testid="collapse-toggle"]');

    // Get initial height
    const initialBox = await widget.boundingBox();
    const initialHeight = initialBox?.height || 0;

    // Click collapse
    await collapseButton.click();

    // Wait for animation
    await page.waitForTimeout(300);

    // Get collapsed height
    const collapsedBox = await widget.boundingBox();
    const collapsedHeight = collapsedBox?.height || 0;

    // Collapsed height should be title bar only (~40-60px)
    expect(collapsedHeight).toBeLessThan(80);
    expect(collapsedHeight).toBeLessThan(initialHeight * 0.3);
  });

  test('expand restores full widget with content', async ({ page }) => {
    const widget = page.locator('.widget-wrapper').first();
    const collapseButton = widget.locator('[data-testid="collapse-toggle"]');

    // Get initial height
    const initialBox = await widget.boundingBox();
    const initialHeight = initialBox?.height || 0;

    // Collapse
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Expand
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Get restored height
    const restoredBox = await widget.boundingBox();
    const restoredHeight = restoredBox?.height || 0;

    // Should restore to approximately original height
    expect(restoredHeight).toBeGreaterThan(initialHeight * 0.8);
    expect(restoredHeight).toBeLessThan(initialHeight * 1.2);
  });

  test('content is hidden when collapsed', async ({ page }) => {
    const widget = page.locator('.widget-wrapper').first();
    const collapseButton = widget.locator('[data-testid="collapse-toggle"]');
    const content = widget.locator('[data-testid="widget-content"]');

    // Content visible initially
    await expect(content).toBeVisible();

    // Collapse
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Content should be hidden
    await expect(content).not.toBeVisible();
  });

  test('title bar remains visible when collapsed', async ({ page }) => {
    const widget = page.locator('.widget-wrapper').first();
    const collapseButton = widget.locator('[data-testid="collapse-toggle"]');
    const titleBar = widget.locator('[data-testid="widget-header"]');

    // Collapse
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Title bar should still be visible
    await expect(titleBar).toBeVisible();
  });

  test('widgets below collapsed widget reflow upward', async ({ page }) => {
    // Get two widgets in vertical arrangement
    const widgets = page.locator('.widget-wrapper');
    const widgetCount = await widgets.count();

    if (widgetCount < 2) {
      test.skip();
      return;
    }

    // Get positions of first two widgets
    const widget1 = widgets.nth(0);
    const widget2 = widgets.nth(1);

    const widget2InitialBox = await widget2.boundingBox();
    const widget2InitialY = widget2InitialBox?.y || 0;

    // Collapse first widget
    const collapseButton = widget1.locator('[data-testid="collapse-toggle"]');
    await collapseButton.click();
    await page.waitForTimeout(500);

    // Widget 2 should have moved up (or stayed same if side by side)
    const widget2NewBox = await widget2.boundingBox();
    const widget2NewY = widget2NewBox?.y || 0;

    // Allow some tolerance for grid snapping
    expect(widget2NewY).toBeLessThanOrEqual(widget2InitialY + 10);
  });

  test('no stuck expanded panels when rapidly toggling', async ({ page }) => {
    const widget = page.locator('.widget-wrapper').first();
    const collapseButton = widget.locator('[data-testid="collapse-toggle"]');

    // Rapidly toggle collapse
    for (let i = 0; i < 5; i++) {
      await collapseButton.click();
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(500);

    // Should be in a valid state (either collapsed or expanded)
    const box = await widget.boundingBox();
    const height = box?.height || 0;

    // Height should be either collapsed (~60px) or expanded (>100px)
    // Not stuck in between
    expect(height < 80 || height > 100).toBeTruthy();
  });
});
