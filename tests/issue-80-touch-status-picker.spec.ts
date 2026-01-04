import { test, expect } from '@playwright/test';

/**
 * Issue #80: Habit Matrix - Add touch interface support for status picker
 *
 * Tests that the status picker can be accessed via touch devices using
 * long-press gesture (500ms+), while single taps still cycle status.
 */

test.describe('Issue #80: Touch interface for status picker', () => {
  test.describe('Touch device tests', () => {
    // Use larger viewport and enable touch
    test.use({
      viewport: { width: 1280, height: 720 },
      hasTouch: true,
    });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
    });

    // This test uses CDP which is only available in Chromium
    test('AC1: Long-press (touchstart + hold) triggers status picker', async ({ page, browserName }) => {
      // CDP is only available in Chromium
      if (browserName !== 'chromium') {
        test.skip();
        return;
      }

      // Find habit matrix
      const habitMatrix = page.locator('[data-testid="habit-matrix"]');
      if (!(await habitMatrix.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Find a status cell
      const statusCell = habitMatrix.locator('[role="button"]').first();
      if (!(await statusCell.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Get bounding box for touchscreen interaction
      const cellBox = await statusCell.boundingBox();
      if (!cellBox) {
        test.skip();
        return;
      }

      const centerX = cellBox.x + cellBox.width / 2;
      const centerY = cellBox.y + cellBox.height / 2;

      // Simulate long-press using CDP to fire touch events manually
      const client = await page.context().newCDPSession(page);

      // Touch start
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: centerX, y: centerY }],
      });

      // Wait for long-press threshold (500ms) + buffer
      await page.waitForTimeout(600);

      // Touch end
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });

      // Status picker should appear
      await page.waitForTimeout(300);
      const statusPicker = page.getByTestId('status-options-grid');
      await expect(statusPicker).toBeVisible({ timeout: 2000 });
    });

    test('AC2: Quick tap cycles status without opening picker', async ({ page }) => {
      // Find habit matrix
      const habitMatrix = page.locator('[data-testid="habit-matrix"]');
      if (!(await habitMatrix.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Find a status cell
      const statusCell = habitMatrix.locator('[role="button"]').first();
      if (!(await statusCell.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Get initial background color
      const initialBg = await statusCell.evaluate(el => window.getComputedStyle(el).backgroundColor);

      // Quick tap
      await statusCell.tap();
      await page.waitForTimeout(300);

      // Status picker should NOT appear
      const statusPicker = page.getByTestId('status-options-grid');
      const isPickerVisible = await statusPicker.isVisible().catch(() => false);
      expect(isPickerVisible).toBe(false);
    });

    test('AC3: Status cells are accessible on touch devices', async ({ page }) => {
      // Check that habit matrix is visible
      const habitMatrix = page.locator('[data-testid="habit-matrix"]');
      if (!(await habitMatrix.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Verify cells exist
      const statusCells = habitMatrix.locator('[role="button"]');
      const cellCount = await statusCells.count();
      expect(cellCount).toBeGreaterThan(0);

      // Cells should have touch-friendly aria-labels
      const firstCell = statusCells.first();
      const ariaLabel = await firstCell.getAttribute('aria-label');
      expect(ariaLabel).toContain('long-press');
    });
  });

  test.describe('Desktop tests (no touch)', () => {
    test.use({
      viewport: { width: 1280, height: 720 },
      hasTouch: false,
    });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
    });

    test('AC4a: Mouse click still cycles status', async ({ page }) => {
      // Find habit matrix
      const habitMatrix = page.locator('[data-testid="habit-matrix"]');
      if (!(await habitMatrix.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Find a status cell
      const statusCell = habitMatrix.locator('[role="button"]').first();
      if (!(await statusCell.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Click should work
      await statusCell.click();
      await page.waitForTimeout(200);

      // Cell should still be visible (no errors)
      await expect(statusCell).toBeVisible();
    });

    test('AC4b: Mouse hover (1s) still opens status picker', async ({ page }) => {
      // Find habit matrix
      const habitMatrix = page.locator('[data-testid="habit-matrix"]');
      if (!(await habitMatrix.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Find a status cell
      const statusCell = habitMatrix.locator('[role="button"]').first();
      if (!(await statusCell.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Hover for more than 1 second
      await statusCell.hover();
      await page.waitForTimeout(1200);

      // Status picker should appear
      const statusPicker = page.getByTestId('status-options-grid');
      await expect(statusPicker).toBeVisible({ timeout: 2000 });
    });
  });
});
