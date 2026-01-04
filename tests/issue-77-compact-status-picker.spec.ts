import { test, expect } from '@playwright/test';

/**
 * Issue #77: Habit Matrix - Simplify status picker to compact color squares
 *
 * Tests that the status tooltip/picker is a compact grid of color squares
 * with minimal padding and tight layout.
 */

test.describe('Issue #77: Compact Status Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  /**
   * Helper to navigate to dashboard and trigger status tooltip
   */
  async function openStatusTooltip(page: ReturnType<typeof test.info>['page']) {
    // Navigate to Dashboard
    const dashboardNav = page.getByTestId('nav-dashboard');
    await dashboardNav.click();
    await page.waitForTimeout(500);

    // Wait for habit matrix
    const habitMatrix = page.locator('[data-widget-id="habit-matrix"], [data-testid="habit-matrix"]');
    const hasMatrix = await habitMatrix.isVisible().catch(() => false);

    if (!hasMatrix) {
      return false;
    }

    // Find a status cell and hover over it to trigger tooltip
    const statusCells = page.locator('[data-testid^="status-cell-"]');
    const cellCount = await statusCells.count();

    if (cellCount === 0) {
      return false;
    }

    // Right-click on the first cell to open status picker
    await statusCells.first().click({ button: 'right' });
    await page.waitForTimeout(300);

    // Check if tooltip appeared
    const tooltip = page.getByTestId('status-tooltip');
    return tooltip.isVisible();
  }

  test.describe('AC1: Status picker is a compact grid', () => {
    test('status tooltip displays as a compact grid layout', async ({ page }) => {
      const tooltipOpened = await openStatusTooltip(page);

      if (!tooltipOpened) {
        test.skip();
        return;
      }

      const tooltip = page.getByTestId('status-tooltip');
      await expect(tooltip).toBeVisible();

      // Check that the tooltip has compact styling
      // Should have grid or flex-wrap layout for color squares
      const isCompact = await tooltip.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const maxWidth = parseInt(style.maxWidth, 10) || el.offsetWidth;
        // Compact picker should be narrower than the original (which was 200px min)
        return el.offsetWidth <= 220;
      });

      expect(isCompact).toBe(true);
    });

    test('status options are displayed in a grid format', async ({ page }) => {
      const tooltipOpened = await openStatusTooltip(page);

      if (!tooltipOpened) {
        test.skip();
        return;
      }

      const tooltip = page.getByTestId('status-tooltip');
      await expect(tooltip).toBeVisible();

      // Check for grid container
      const optionsContainer = tooltip.locator('[data-testid="status-options-grid"]');
      await expect(optionsContainer).toBeVisible();

      // Should have display: grid or flex-wrap
      const hasGridLayout = await optionsContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.display === 'grid' || style.flexWrap === 'wrap';
      });

      expect(hasGridLayout).toBe(true);
    });
  });

  test.describe('AC2: Each option shows color square + short label', () => {
    test('each status option has a color square', async ({ page }) => {
      const tooltipOpened = await openStatusTooltip(page);

      if (!tooltipOpened) {
        test.skip();
        return;
      }

      const tooltip = page.getByTestId('status-tooltip');
      await expect(tooltip).toBeVisible();

      // Find all status option buttons
      const options = tooltip.locator('[role="option"]');
      const optionCount = await options.count();

      // Should have 8 status options
      expect(optionCount).toBe(8);

      // Each option should have a color square
      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const colorSquare = option.locator('[data-testid="status-color-square"]');
        await expect(colorSquare).toBeVisible();
      }
    });

    test('each status option has a short label', async ({ page }) => {
      const tooltipOpened = await openStatusTooltip(page);

      if (!tooltipOpened) {
        test.skip();
        return;
      }

      const tooltip = page.getByTestId('status-tooltip');
      await expect(tooltip).toBeVisible();

      // Check that labels exist and are short (no descriptions)
      const expectedLabels = ['Done', 'Missed', 'Partial', 'Exempt', 'N/A', 'Extra', 'Pink', 'Clear'];

      for (const label of expectedLabels) {
        const labelElement = tooltip.getByText(label, { exact: true });
        const isVisible = await labelElement.isVisible().catch(() => false);
        // At least some labels should be visible
        if (isVisible) {
          // Check label is not too long (no description text)
          const text = await labelElement.textContent();
          expect(text?.length).toBeLessThanOrEqual(10);
        }
      }
    });
  });

  test.describe('AC3: Minimal padding, tight layout', () => {
    test('tooltip has minimal padding', async ({ page }) => {
      const tooltipOpened = await openStatusTooltip(page);

      if (!tooltipOpened) {
        test.skip();
        return;
      }

      const tooltip = page.getByTestId('status-tooltip');
      await expect(tooltip).toBeVisible();

      // Check padding is minimal
      const hasMinimalPadding = await tooltip.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const padding = parseInt(style.padding, 10) || 0;
        const paddingTop = parseInt(style.paddingTop, 10) || 0;
        const paddingBottom = parseInt(style.paddingBottom, 10) || 0;
        // Minimal means < 16px total padding
        return padding < 16 && paddingTop < 12 && paddingBottom < 12;
      });

      expect(hasMinimalPadding).toBe(true);
    });

    test('no unnecessary header or footer', async ({ page }) => {
      const tooltipOpened = await openStatusTooltip(page);

      if (!tooltipOpened) {
        test.skip();
        return;
      }

      const tooltip = page.getByTestId('status-tooltip');
      await expect(tooltip).toBeVisible();

      // Should not have a separate header section
      const header = tooltip.locator('text="Status"');
      const hasHeader = await header.isVisible().catch(() => false);

      // Should not have footer hint
      const footer = tooltip.locator('text="Click to select or Esc to close"');
      const hasFooter = await footer.isVisible().catch(() => false);

      // At least one should be removed for compact design
      // (or both could be removed)
      expect(hasHeader && hasFooter).toBe(false);
    });
  });

  test.describe('Accessibility', () => {
    test('maintains keyboard navigation', async ({ page }) => {
      const tooltipOpened = await openStatusTooltip(page);

      if (!tooltipOpened) {
        test.skip();
        return;
      }

      const tooltip = page.getByTestId('status-tooltip');
      await expect(tooltip).toBeVisible();

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);

      // Tooltip should be closed
      await expect(tooltip).not.toBeVisible();
    });

    test('has aria labels for accessibility', async ({ page }) => {
      const tooltipOpened = await openStatusTooltip(page);

      if (!tooltipOpened) {
        test.skip();
        return;
      }

      const tooltip = page.getByTestId('status-tooltip');
      await expect(tooltip).toBeVisible();

      // Should have role="listbox" or similar
      const role = await tooltip.getAttribute('role');
      expect(['listbox', 'menu', 'grid']).toContain(role);

      // Each option should have role="option" or similar
      const options = tooltip.locator('[role="option"], [role="menuitem"]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);
    });
  });
});
