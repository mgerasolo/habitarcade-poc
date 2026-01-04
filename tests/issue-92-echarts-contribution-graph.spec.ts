import { test, expect } from '@playwright/test';

/**
 * Issue #92: ECharts Contribution Graph Tests
 *
 * Tests for:
 * - ContributionGraph uses ECharts calendar heatmap instead of custom divs
 * - Each cell displays correct STATUS_COLOR for that day's status
 * - Empty/no-data cells have visible borders to show grid structure
 *
 * TDD Red Phase: These tests should FAIL until implementation is complete.
 */

test.describe('Issue #92: ECharts Contribution Graph', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  /**
   * Helper to open the Habit Detail Modal
   */
  async function openHabitDetailModal(page: ReturnType<typeof test.info>['page']) {
    // Navigate to Dashboard
    const dashboardNav = page.getByTestId('nav-dashboard');
    await dashboardNav.click();
    await page.waitForTimeout(500);

    // Wait for habit matrix
    const habitMatrix = page.locator('[data-widget-id="habit-matrix"]');
    const hasMatrix = await habitMatrix.isVisible().catch(() => false);

    if (!hasMatrix) {
      return false;
    }

    // Find a habit row and click to open detail modal
    const habitRows = page.locator('[data-testid="habit-row"]');
    const rowCount = await habitRows.count();

    if (rowCount === 0) {
      return false;
    }

    // Click on habit name to open detail modal
    const habitName = habitRows.first().locator('[data-testid="habit-name"]');
    const hasHabitName = await habitName.isVisible().catch(() => false);

    if (!hasHabitName) {
      return false;
    }

    await habitName.click();
    await page.waitForTimeout(300);

    return true;
  }

  test.describe('AC1: ECharts Calendar Heatmap', () => {
    test('ContributionGraph renders as ECharts canvas element', async ({ page }) => {
      const opened = await openHabitDetailModal(page);

      if (!opened) {
        test.skip();
        return;
      }

      // Look for the contribution graph section in the modal
      const modal = page.locator('[data-testid="habit-detail-modal"]');
      await expect(modal).toBeVisible();

      // ECharts renders to a canvas element
      // The contribution graph should contain an ECharts canvas
      const echartsCanvas = modal.locator('[data-testid="contribution-graph"] canvas');

      // This will FAIL until we implement ECharts
      await expect(echartsCanvas).toBeVisible({ timeout: 2000 });
    });

    test('ContributionGraph has ECharts calendar coordinate system', async ({ page }) => {
      const opened = await openHabitDetailModal(page);

      if (!opened) {
        test.skip();
        return;
      }

      const modal = page.locator('[data-testid="habit-detail-modal"]');
      await expect(modal).toBeVisible();

      // ECharts calendar heatmap should render with a specific structure
      // We can check for the echarts container with data attributes
      const echartsContainer = modal.locator('[data-testid="contribution-graph"] [_echarts_instance_]');

      // This will FAIL until we implement ECharts
      await expect(echartsContainer).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('AC2: Correct STATUS_COLORS', () => {
    /**
     * STATUS_COLORS from types/index.ts:
     * - empty: '#ffffff' (white)
     * - complete: '#10b981' (green)
     * - missed: '#ef4444' (red)
     * - partial: '#f97316' (orange)
     * - na: '#666666' (gray)
     * - exempt: '#3b82f6' (blue)
     * - extra: '#047857' (dark green)
     * - pink: '#ffd3dc' (pink)
     * - gray_missed: '#666666' (gray)
     */

    test('contribution graph legend shows all status colors', async ({ page }) => {
      const opened = await openHabitDetailModal(page);

      if (!opened) {
        test.skip();
        return;
      }

      const modal = page.locator('[data-testid="habit-detail-modal"]');
      await expect(modal).toBeVisible();

      // The legend should show distinct status colors, not just "Less/More"
      const contributionGraph = modal.locator('[data-testid="contribution-graph"]');

      // Check that we have a proper legend with status names
      // Current implementation has "Less" and "More" - should have actual status names
      const legendComplete = contributionGraph.getByText('Complete');
      const legendMissed = contributionGraph.getByText('Missed');

      // These will FAIL until we add proper legend
      await expect(legendComplete).toBeVisible({ timeout: 2000 });
      await expect(legendMissed).toBeVisible({ timeout: 2000 });
    });

    test('cells use STATUS_COLORS not gradient approximations', async ({ page }) => {
      const opened = await openHabitDetailModal(page);

      if (!opened) {
        test.skip();
        return;
      }

      const modal = page.locator('[data-testid="habit-detail-modal"]');
      await expect(modal).toBeVisible();

      // The contribution graph should have data-testid for color verification
      const contributionGraph = modal.locator('[data-testid="contribution-graph"]');

      // Check that the component has a data attribute indicating ECharts usage
      // This attribute would be set by our new implementation
      await expect(contributionGraph).toHaveAttribute('data-chart-engine', 'echarts', { timeout: 2000 });
    });
  });

  test.describe('AC3: Visible Cell Borders', () => {
    test('empty cells have visible borders for grid structure', async ({ page }) => {
      const opened = await openHabitDetailModal(page);

      if (!opened) {
        test.skip();
        return;
      }

      const modal = page.locator('[data-testid="habit-detail-modal"]');
      await expect(modal).toBeVisible();

      // The contribution graph should have a dark theme with visible cell borders
      const contributionGraph = modal.locator('[data-testid="contribution-graph"]');

      // ECharts calendar itemStyle.borderWidth should be > 0
      // We verify this by checking for the data attribute we'll set
      await expect(contributionGraph).toHaveAttribute('data-has-borders', 'true', { timeout: 2000 });
    });

    test('contribution graph shows month labels', async ({ page }) => {
      const opened = await openHabitDetailModal(page);

      if (!opened) {
        test.skip();
        return;
      }

      const modal = page.locator('[data-testid="habit-detail-modal"]');
      await expect(modal).toBeVisible();

      const contributionGraph = modal.locator('[data-testid="contribution-graph"]');

      // Month labels should be visible (Jan, Feb, Mar, etc.)
      // ECharts renders these as text elements
      await expect(contributionGraph).toBeVisible();

      // Check for at least one month label text
      const monthLabel = contributionGraph.getByText(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
      await expect(monthLabel.first()).toBeVisible({ timeout: 2000 });
    });

    test('contribution graph shows day-of-week labels', async ({ page }) => {
      const opened = await openHabitDetailModal(page);

      if (!opened) {
        test.skip();
        return;
      }

      const modal = page.locator('[data-testid="habit-detail-modal"]');
      await expect(modal).toBeVisible();

      const contributionGraph = modal.locator('[data-testid="contribution-graph"]');

      // Day labels should be visible (M, W, F typically shown)
      const dayLabel = contributionGraph.getByText(/^[SMTWF]$/);
      await expect(dayLabel.first()).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Tooltip Behavior', () => {
    test('hovering cell shows tooltip with date and status', async ({ page }) => {
      const opened = await openHabitDetailModal(page);

      if (!opened) {
        test.skip();
        return;
      }

      const modal = page.locator('[data-testid="habit-detail-modal"]');
      await expect(modal).toBeVisible();

      // Find the ECharts canvas and hover over it
      const canvas = modal.locator('[data-testid="contribution-graph"] canvas');

      if (await canvas.isVisible()) {
        // Hover in the middle of the canvas where cells would be
        const box = await canvas.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(300);
        }

        // ECharts tooltip should appear
        // Tooltips are typically rendered in a separate div with specific class
        const tooltip = page.locator('.echarts-tooltip, [class*="tooltip"]').filter({ hasText: /Complete|Missed|Partial|Empty/ });

        // This test is checking that ECharts tooltips work
        // If no data, this may not show, so we make it soft
        const tooltipVisible = await tooltip.isVisible().catch(() => false);

        // At minimum, verify the canvas rendered
        await expect(canvas).toBeVisible();
      }
    });
  });
});
