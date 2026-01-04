/**
 * Issue #79: Status picker doesn't close when hovering to next cell
 *
 * Bug: Menu stays open when user moves mouse to another cell without selecting a value.
 *
 * Test cases:
 * 1. Menu closes when mouse leaves cell without selection
 * 2. Menu closes when hovering over a different cell
 * 3. No stuck menus on the screen
 * 4. Don't break the 1-second hover delay to open
 * 5. Keep right-click functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Issue #79: Status picker closes properly on cell change', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard with Habit Matrix
    await page.goto('/');
    // Wait for Habit Matrix to load
    await page.waitForSelector('[data-testid="habit-matrix"]', { timeout: 10000 });
  });

  test('menu closes when mouse leaves cell area after opening', async ({ page }) => {
    // Find first habit row with cells
    const cells = page.locator('[data-testid="habit-matrix"] [role="button"]');
    const firstCell = cells.first();

    // Hover for 1+ second to open tooltip
    await firstCell.hover();
    await page.waitForTimeout(1100);

    // Verify tooltip is visible
    const tooltip = page.locator('[data-testid="status-tooltip"]');
    await expect(tooltip).toBeVisible();

    // Move mouse away from cell and tooltip
    await page.mouse.move(0, 0);

    // Wait for close timer (500ms + buffer)
    await page.waitForTimeout(600);

    // Tooltip should be closed
    await expect(tooltip).not.toBeVisible();
  });

  test('menu closes when hovering over a different cell', async ({ page }) => {
    const cells = page.locator('[data-testid="habit-matrix"] [role="button"]');
    const firstCell = cells.nth(0);
    const secondCell = cells.nth(1);

    // Hover first cell for 1+ second to open tooltip
    await firstCell.hover();
    await page.waitForTimeout(1100);

    // Verify tooltip opened for first cell
    const tooltip = page.locator('[data-testid="status-tooltip"]');
    await expect(tooltip).toBeVisible();

    // Move to second cell
    await secondCell.hover();

    // Wait for close timer (500ms + buffer)
    await page.waitForTimeout(600);

    // Original tooltip should be closed
    await expect(tooltip).not.toBeVisible();
  });

  test('only one tooltip visible at a time (no stuck menus)', async ({ page }) => {
    const cells = page.locator('[data-testid="habit-matrix"] [role="button"]');

    // Rapidly hover multiple cells, opening menus
    for (let i = 0; i < 3; i++) {
      await cells.nth(i).hover();
      await page.waitForTimeout(1100);
    }

    // Only one tooltip should be visible
    const tooltips = page.locator('[data-testid="status-tooltip"]');
    await expect(tooltips).toHaveCount(1);
  });

  test('1-second hover delay still works to open menu', async ({ page }) => {
    const cells = page.locator('[data-testid="habit-matrix"] [role="button"]');
    const firstCell = cells.first();
    const tooltip = page.locator('[data-testid="status-tooltip"]');

    // Hover for less than 1 second
    await firstCell.hover();
    await page.waitForTimeout(500);

    // Tooltip should NOT be visible yet
    await expect(tooltip).not.toBeVisible();

    // Wait remaining time
    await page.waitForTimeout(600);

    // Now tooltip should be visible
    await expect(tooltip).toBeVisible();
  });

  test('right-click opens menu immediately', async ({ page }) => {
    const cells = page.locator('[data-testid="habit-matrix"] [role="button"]');
    const firstCell = cells.first();
    const tooltip = page.locator('[data-testid="status-tooltip"]');

    // Right-click should open immediately
    await firstCell.click({ button: 'right' });

    // Tooltip should be visible immediately
    await expect(tooltip).toBeVisible();
  });

  test('menu stays open when hovering from cell to tooltip and back', async ({ page }) => {
    const cells = page.locator('[data-testid="habit-matrix"] [role="button"]');
    const firstCell = cells.first();
    const tooltip = page.locator('[data-testid="status-tooltip"]');

    // Hover cell to open tooltip
    await firstCell.hover();
    await page.waitForTimeout(1100);
    await expect(tooltip).toBeVisible();

    // Move to tooltip
    await tooltip.hover();
    await page.waitForTimeout(100);

    // Tooltip should still be visible
    await expect(tooltip).toBeVisible();

    // Move back to cell
    await firstCell.hover();
    await page.waitForTimeout(100);

    // Tooltip should still be visible
    await expect(tooltip).toBeVisible();
  });
});
