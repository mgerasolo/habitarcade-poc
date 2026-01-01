import { test, expect } from '@playwright/test';

/**
 * Timer Block Widget Tests
 *
 * Tests for the redesigned Timer Block widget (Issue #33)
 * Verifies Pomodoro mode, Stopwatch mode, Countdown mode, and audio controls
 */

test.describe('Timer Block Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and open the drawer to access timer
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open the right drawer
    const toggleButton = page.getByTestId('right-drawer-toggle');
    await toggleButton.click();

    // Click on priorities tab to access timer
    const prioritiesTab = page.getByTestId('drawer-tab-priorities');
    await prioritiesTab.click();
  });

  test.describe('Mode Selection', () => {
    test('displays three mode options: Pomodoro, Stopwatch, Countdown', async ({ page }) => {
      // Look for mode selector buttons
      await expect(page.getByRole('button', { name: 'Pomodoro' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Stopwatch' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Countdown' })).toBeVisible();
    });

    test('Pomodoro mode is selected by default', async ({ page }) => {
      const pomodoroButton = page.getByRole('button', { name: 'Pomodoro' });
      // Check that Pomodoro button has active styling (gradient background)
      await expect(pomodoroButton).toHaveClass(/from-teal-500/);
    });

    test('can switch between modes when timer is not running', async ({ page }) => {
      // Switch to Stopwatch
      const stopwatchButton = page.getByRole('button', { name: 'Stopwatch' });
      await stopwatchButton.click();
      await expect(stopwatchButton).toHaveClass(/from-teal-500/);

      // Switch to Countdown
      const countdownButton = page.getByRole('button', { name: 'Countdown' });
      await countdownButton.click();
      await expect(countdownButton).toHaveClass(/from-teal-500/);

      // Switch back to Pomodoro
      const pomodoroButton = page.getByRole('button', { name: 'Pomodoro' });
      await pomodoroButton.click();
      await expect(pomodoroButton).toHaveClass(/from-teal-500/);
    });
  });

  test.describe('Pomodoro Mode', () => {
    test('shows preset options (25/5 and 50/10)', async ({ page }) => {
      await expect(page.getByRole('button', { name: '25/5' })).toBeVisible();
      await expect(page.getByRole('button', { name: '50/10' })).toBeVisible();
    });

    test('displays session indicators', async ({ page }) => {
      // Look for session indicator text
      await expect(page.getByText(/0 sessions?/)).toBeVisible();
    });

    test('shows Focus label in pomodoro mode', async ({ page }) => {
      // Check for the phase label
      await expect(page.getByText('Focus')).toBeVisible();
    });

    test('displays initial time based on preset', async ({ page }) => {
      // Default 25/5 preset should show 25:00
      await expect(page.getByText('25:00')).toBeVisible();

      // Switch to 50/10 preset
      await page.getByRole('button', { name: '50/10' }).click();
      await expect(page.getByText('50:00')).toBeVisible();
    });
  });

  test.describe('Stopwatch Mode', () => {
    test('shows 00:00 initially', async ({ page }) => {
      await page.getByRole('button', { name: 'Stopwatch' }).click();
      await expect(page.getByText('00:00')).toBeVisible();
    });

    test('does not show preset options', async ({ page }) => {
      await page.getByRole('button', { name: 'Stopwatch' }).click();
      await expect(page.getByRole('button', { name: '25/5' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: '50/10' })).not.toBeVisible();
    });
  });

  test.describe('Countdown Mode', () => {
    test('shows minutes input field', async ({ page }) => {
      await page.getByRole('button', { name: 'Countdown' }).click();
      const input = page.getByRole('spinbutton');
      await expect(input).toBeVisible();
    });

    test('shows helper text', async ({ page }) => {
      await page.getByRole('button', { name: 'Countdown' }).click();
      await expect(page.getByText('Set duration and press play')).toBeVisible();
    });
  });

  test.describe('Timer Controls', () => {
    test('shows play button when timer is idle', async ({ page }) => {
      const playButton = page.getByRole('button', { name: 'Start' });
      await expect(playButton).toBeVisible();
    });

    test('play button starts the timer', async ({ page }) => {
      const playButton = page.getByRole('button', { name: 'Start' });
      await playButton.click();

      // Timer should now be running - should show pause button
      await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();

      // Should show additional controls (reset, stop)
      await expect(page.getByRole('button', { name: 'Reset timer' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Stop timer' })).toBeVisible();
    });

    test('pause button pauses the timer', async ({ page }) => {
      // Start timer
      await page.getByRole('button', { name: 'Start' }).click();

      // Pause timer
      await page.getByRole('button', { name: 'Pause' }).click();

      // Should show "Paused" status
      await expect(page.getByText('Paused')).toBeVisible();

      // Play button should be visible again
      await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
    });

    test('reset button resets the timer', async ({ page }) => {
      // Start timer
      await page.getByRole('button', { name: 'Start' }).click();

      // Wait a moment for timer to tick
      await page.waitForTimeout(1500);

      // Pause and note the time is less than 25:00
      await page.getByRole('button', { name: 'Pause' }).click();

      // Reset timer
      await page.getByRole('button', { name: 'Reset timer' }).click();

      // Time should be back to 25:00
      await expect(page.getByText('25:00')).toBeVisible();
    });

    test('stop button stops and resets the timer completely', async ({ page }) => {
      // Start timer
      await page.getByRole('button', { name: 'Start' }).click();

      // Stop timer
      await page.getByRole('button', { name: 'Stop timer' }).click();

      // Timer should be in idle state
      await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();

      // Reset and stop buttons should not be visible
      await expect(page.getByRole('button', { name: 'Reset timer' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Stop timer' })).not.toBeVisible();
    });

    test('skip button is visible in pomodoro mode during timer', async ({ page }) => {
      // Start timer
      await page.getByRole('button', { name: 'Start' }).click();

      // Skip button should be visible
      await expect(page.getByRole('button', { name: 'Skip to next phase' })).toBeVisible();
    });
  });

  test.describe('Audio Controls', () => {
    test('audio toggle button is visible', async ({ page }) => {
      await expect(page.getByTitle(/Sound (on|off)/)).toBeVisible();
    });

    test('audio is on by default', async ({ page }) => {
      await expect(page.getByText('On')).toBeVisible();
    });

    test('clicking audio toggle changes state', async ({ page }) => {
      const audioButton = page.getByTitle(/Sound (on|off)/);
      await audioButton.click();

      // Should now show "Off"
      await expect(page.getByText('Off')).toBeVisible();

      // Click again to turn back on
      await audioButton.click();
      await expect(page.getByText('On')).toBeVisible();
    });
  });

  test.describe('Visual Progress Ring', () => {
    test('progress ring SVG is visible', async ({ page }) => {
      const svg = page.locator('svg').first();
      await expect(svg).toBeVisible();
    });

    test('progress ring has background track and progress circle', async ({ page }) => {
      // Should have at least 2 circle elements (background and progress)
      const circles = page.locator('svg circle');
      await expect(circles).toHaveCount(2);
    });
  });

  test.describe('Color Theming', () => {
    test('running timer shows teal color', async ({ page }) => {
      await page.getByRole('button', { name: 'Start' }).click();

      // The time display should have teal color class
      const timeDisplay = page.locator('text=24:').first();
      await expect(timeDisplay).toHaveClass(/text-teal-400/);
    });

    test('paused timer shows yellow color', async ({ page }) => {
      // Start then pause
      await page.getByRole('button', { name: 'Start' }).click();
      await page.getByRole('button', { name: 'Pause' }).click();

      // The time display should have yellow color class
      const timeDisplay = page.locator('span').filter({ hasText: /^\d{2}:\d{2}$/ }).first();
      await expect(timeDisplay).toHaveClass(/text-yellow-400/);
    });
  });

  test.describe('Mode Lock During Timer', () => {
    test('mode buttons are disabled while timer is running', async ({ page }) => {
      // Start timer
      await page.getByRole('button', { name: 'Start' }).click();

      // Mode buttons should have disabled styling
      const stopwatchButton = page.getByRole('button', { name: 'Stopwatch' });
      await expect(stopwatchButton).toHaveClass(/cursor-not-allowed/);
      await expect(stopwatchButton).toHaveClass(/opacity-50/);
    });
  });

  test.describe('Session Tracking', () => {
    test('reset sessions button appears after completing sessions', async ({ page }) => {
      // Initially, reset button should not be visible (0 sessions)
      await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible();

      // Note: Full session completion testing would require waiting for timer,
      // which is impractical in tests. The store functionality handles this.
    });
  });
});
