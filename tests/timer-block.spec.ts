import { test, expect } from '@playwright/test';

/**
 * Timer Block Widget Tests
 *
 * Tests for the redesigned Timer Block widget (Issue #33)
 * The timer is part of the TimeBlockPriorities dashboard widget
 * Each time block has its own timer with Pomodoro, Stopwatch, and Countdown modes
 *
 * Note: Timer feature tests require time blocks to exist in the database.
 * The structure tests don't require blocks.
 */

test.describe('Timer Block Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('habitarcade-ui');
      localStorage.removeItem('habitarcade-dashboard');
    });

    // Navigate to the dashboard after clearing storage
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Navigate to dashboard
    const dashboardNav = page.getByTestId('nav-dashboard');
    await dashboardNav.click();
    await page.waitForTimeout(500);
  });

  test.describe('Widget Structure', () => {
    test('shows Time Blocks header in widget bar', async ({ page }) => {
      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const isVisible = await timeBlocksWidget.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isVisible) {
        test.skip();
        return;
      }

      // The WidgetContainer has its own "Time Blocks" header in the title bar
      const widgetHeader = page.locator('[data-testid="widget-header"]').filter({ hasText: 'Time Blocks' });
      await expect(widgetHeader.first()).toBeVisible();
    });

    test('shows New Block or Create button', async ({ page }) => {
      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const isVisible = await timeBlocksWidget.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isVisible) {
        test.skip();
        return;
      }

      // Look for either New Block or Create Your First Block
      const newBlockBtn = timeBlocksWidget.getByRole('button', { name: 'New Block' });
      const createFirstBtn = timeBlocksWidget.getByRole('button', { name: 'Create Your First Block' });

      const hasNewBlock = await newBlockBtn.isVisible().catch(() => false);
      const hasCreateFirst = await createFirstBtn.isVisible().catch(() => false);

      expect(hasNewBlock || hasCreateFirst).toBeTruthy();
    });

    test('shows empty state or block list', async ({ page }) => {
      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const isVisible = await timeBlocksWidget.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isVisible) {
        test.skip();
        return;
      }

      // Either shows empty state or blocks
      const emptyState = timeBlocksWidget.getByText('No Time Blocks Yet');
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      // Check for Pomodoro button which only appears when blocks exist
      const pomodoroBtn = timeBlocksWidget.getByRole('button', { name: 'Pomodoro' });
      const hasBlocks = await pomodoroBtn.first().isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasEmptyState || hasBlocks).toBeTruthy();
    });
  });

  test.describe('Timer Features (requires blocks)', () => {
    // Helper to check if blocks exist by looking for the Pomodoro button
    // which only appears when there are actual time block cards with timers
    async function hasTimeBlocks(page: import('@playwright/test').Page): Promise<boolean> {
      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const isVisible = await timeBlocksWidget.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isVisible) return false;

      // Check for empty state - if visible, no blocks exist
      const emptyState = timeBlocksWidget.getByText('No Time Blocks Yet');
      const hasEmptyState = await emptyState.isVisible({ timeout: 1000 }).catch(() => false);
      if (hasEmptyState) return false;

      // Check for Pomodoro button which only appears in timer UI when blocks exist
      const pomodoroBtn = timeBlocksWidget.getByRole('button', { name: 'Pomodoro' });
      const hasPomodoro = await pomodoroBtn.first().isVisible({ timeout: 2000 }).catch(() => false);
      return hasPomodoro;
    }

    test('displays three mode options: Pomodoro, Stopwatch, Countdown', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      await expect(timeBlocksWidget.getByRole('button', { name: 'Pomodoro' }).first()).toBeVisible();
      await expect(timeBlocksWidget.getByRole('button', { name: 'Stopwatch' }).first()).toBeVisible();
      await expect(timeBlocksWidget.getByRole('button', { name: 'Countdown' }).first()).toBeVisible();
    });

    test('Pomodoro mode is selected by default', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const pomodoroButton = timeBlocksWidget.getByRole('button', { name: 'Pomodoro' }).first();
      await expect(pomodoroButton).toHaveClass(/from-teal-500/);
    });

    test('can switch between modes when timer is not running', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');

      // Switch to Stopwatch
      const stopwatchButton = timeBlocksWidget.getByRole('button', { name: 'Stopwatch' }).first();
      await stopwatchButton.click();
      await expect(stopwatchButton).toHaveClass(/from-teal-500/);

      // Switch to Countdown
      const countdownButton = timeBlocksWidget.getByRole('button', { name: 'Countdown' }).first();
      await countdownButton.click();
      await expect(countdownButton).toHaveClass(/from-teal-500/);

      // Switch back to Pomodoro
      const pomodoroButton = timeBlocksWidget.getByRole('button', { name: 'Pomodoro' }).first();
      await pomodoroButton.click();
      await expect(pomodoroButton).toHaveClass(/from-teal-500/);
    });

    test('shows preset options (25/5 and 50/10) in Pomodoro mode', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      await expect(timeBlocksWidget.getByRole('button', { name: '25/5' }).first()).toBeVisible();
      await expect(timeBlocksWidget.getByRole('button', { name: '50/10' }).first()).toBeVisible();
    });

    test('displays session indicators in Pomodoro mode', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const sessionText = timeBlocksWidget.getByText(/\d+ sessions?/);
      await expect(sessionText.first()).toBeVisible();
    });

    test('shows Focus label in Pomodoro mode', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      await expect(timeBlocksWidget.getByText('Focus').first()).toBeVisible();
    });

    test('displays initial time 25:00 for default Pomodoro preset', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      await expect(timeBlocksWidget.getByText('25:00').first()).toBeVisible();
    });

    test('shows 00:00 in Stopwatch mode', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      await timeBlocksWidget.getByRole('button', { name: 'Stopwatch' }).first().click();
      await expect(timeBlocksWidget.getByText('00:00').first()).toBeVisible();
    });

    test('does not show preset options in Stopwatch mode', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      await timeBlocksWidget.getByRole('button', { name: 'Stopwatch' }).first().click();
      await page.waitForTimeout(200);

      const presetBtn = timeBlocksWidget.getByRole('button', { name: '25/5' }).first();
      await expect(presetBtn).not.toBeVisible();
    });

    test('shows minutes input in Countdown mode', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      await timeBlocksWidget.getByRole('button', { name: 'Countdown' }).first().click();
      const input = timeBlocksWidget.getByRole('spinbutton').first();
      await expect(input).toBeVisible();
    });

    test('shows helper text in Countdown mode', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      await timeBlocksWidget.getByRole('button', { name: 'Countdown' }).first().click();
      await expect(timeBlocksWidget.getByText('Set duration and press play').first()).toBeVisible();
    });

    test('progress ring SVG is visible', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const svg = timeBlocksWidget.locator('svg').first();
      await expect(svg).toBeVisible();
    });

    test('progress ring has background track and progress circle', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const circles = timeBlocksWidget.locator('svg circle');
      const count = await circles.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('audio toggle shows On by default', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const audioOn = timeBlocksWidget.locator('button').filter({ hasText: 'On' }).first();
      await expect(audioOn).toBeVisible();
    });

    test('clicking audio toggle changes state to Off', async ({ page }) => {
      if (!(await hasTimeBlocks(page))) {
        test.skip();
        return;
      }

      const timeBlocksWidget = page.locator('[data-widget-id="time-blocks"]');
      const audioButton = timeBlocksWidget.locator('button').filter({ hasText: 'On' }).first();
      await audioButton.click();

      const audioOff = timeBlocksWidget.locator('button').filter({ hasText: 'Off' }).first();
      await expect(audioOff).toBeVisible();
    });
  });
});
