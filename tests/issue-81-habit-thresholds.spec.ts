import { test, expect } from '@playwright/test';

/**
 * Issue #81 - Per-Habit Target & Warning Thresholds
 *
 * Acceptance Criteria:
 * - AC1: targetPercentage field exists in Habit model (default: 90)
 * - AC2: warningPercentage field exists in Habit model (default: 75)
 * - AC3: Score color logic uses thresholds (Green >= target, Yellow >= warning, Red < warning)
 * - AC4: UI in Habit Form to configure both thresholds
 * - AC5: Validation: warning must be < target
 */

test.describe('Issue #81 - Per-Habit Target/Warning Thresholds', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to habits page
    await page.goto('/habits');
    // Wait for content to load
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
  });

  test('AC1-AC2: Habit form shows target and warning percentage fields', async ({ page }) => {
    // Open the habit form modal
    const addHabitButton = page.locator('button:has-text("Add Habit")').first();
    await addHabitButton.click();

    // Wait for modal to appear
    await expect(page.locator('[role="dialog"], .fixed.inset-0, [class*="modal"]').first()).toBeVisible({ timeout: 5000 });

    // Look for target percentage input
    const targetInput = page.locator('input[name="targetPercentage"]');
    await expect(targetInput).toBeVisible();

    // Look for warning percentage input
    const warningInput = page.locator('input[name="warningPercentage"]');
    await expect(warningInput).toBeVisible();

    // Verify default values
    await expect(targetInput).toHaveValue('90');
    await expect(warningInput).toHaveValue('75');
  });

  test('AC4: Can modify target and warning percentages', async ({ page }) => {
    // Open the habit form modal
    const addHabitButton = page.locator('button:has-text("Add Habit")').first();
    await addHabitButton.click();

    // Wait for modal
    await expect(page.locator('[role="dialog"], .fixed.inset-0, [class*="modal"]').first()).toBeVisible({ timeout: 5000 });

    // Find and modify target percentage
    const targetInput = page.locator('input[name="targetPercentage"]');
    await targetInput.fill('85');
    await expect(targetInput).toHaveValue('85');

    // Find and modify warning percentage
    const warningInput = page.locator('input[name="warningPercentage"]');
    await warningInput.fill('60');
    await expect(warningInput).toHaveValue('60');
  });

  test('Threshold inputs accept numeric values only', async ({ page }) => {
    // Open the habit form modal
    const addHabitButton = page.locator('button:has-text("Add Habit")').first();
    await addHabitButton.click();

    // Wait for modal
    await expect(page.locator('[role="dialog"], .fixed.inset-0, [class*="modal"]').first()).toBeVisible({ timeout: 5000 });

    // Verify input types are number
    const targetInput = page.locator('input[name="targetPercentage"]');
    await expect(targetInput).toHaveAttribute('type', 'number');

    const warningInput = page.locator('input[name="warningPercentage"]');
    await expect(warningInput).toHaveAttribute('type', 'number');

    // Verify min/max constraints
    await expect(targetInput).toHaveAttribute('min', '1');
    await expect(targetInput).toHaveAttribute('max', '100');
    await expect(warningInput).toHaveAttribute('min', '1');
    await expect(warningInput).toHaveAttribute('max', '100');
  });

  test('Form has threshold labels', async ({ page }) => {
    // Open the habit form modal
    const addHabitButton = page.locator('button:has-text("Add Habit")').first();
    await addHabitButton.click();

    // Wait for modal
    await expect(page.locator('[role="dialog"], .fixed.inset-0, [class*="modal"]').first()).toBeVisible({ timeout: 5000 });

    // Check for "Target:" label (with colon to avoid matching nav "Targets")
    await expect(page.locator('text=Target:')).toBeVisible();

    // Check for "Warning:" label
    await expect(page.locator('text=Warning:')).toBeVisible();
  });

  test('Days conversion inputs exist alongside percentage inputs', async ({ page }) => {
    // Open the habit form modal
    const addHabitButton = page.locator('button:has-text("Add Habit")').first();
    await addHabitButton.click();

    // Wait for modal
    await expect(page.locator('[role="dialog"], .fixed.inset-0, [class*="modal"]').first()).toBeVisible({ timeout: 5000 });

    // Look for "d/mo" text which indicates the days-per-month conversion feature
    const daysText = page.locator('text=d/mo');
    const daysCount = await daysText.count();

    // Should have at least 2 (one for target days, one for warning days)
    expect(daysCount).toBeGreaterThanOrEqual(2);
  });

  test('Habit form can be submitted with custom thresholds', async ({ page }) => {
    // Open the habit form modal
    const addHabitButton = page.locator('button:has-text("Add Habit")').first();
    await addHabitButton.click();

    // Wait for modal
    await expect(page.locator('[role="dialog"], .fixed.inset-0, [class*="modal"]').first()).toBeVisible({ timeout: 5000 });

    // Fill in habit name (required field)
    const nameInput = page.locator('input[name="name"]');
    await nameInput.fill('Test Habit with Thresholds');

    // Set custom thresholds
    const targetInput = page.locator('input[name="targetPercentage"]');
    await targetInput.fill('80');

    const warningInput = page.locator('input[name="warningPercentage"]');
    await warningInput.fill('50');

    // Form should still be valid (submit button should be enabled or form should submit)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });
});
