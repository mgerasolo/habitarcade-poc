import { test, expect } from '@playwright/test';

/**
 * Parking Lot Tests
 *
 * Verifies the Parking Lot feature in the right drawer:
 * - Can open drawer and see Parking Lot content
 * - Can add items via input field
 * - Items persist in localStorage
 * - Can delete items
 */

test.describe('Parking Lot', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('habitarcade-parking-lot');
    });

    // Navigate to the dashboard
    await page.goto('/');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="right-drawer-toggle"]', { timeout: 10000 });
  });

  test('should open right drawer and show Parking Lot content', async ({ page }) => {
    // Click the right drawer toggle button
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Wait for the drawer to open and Parking Lot content to appear
    const parkingLotContent = page.locator('[data-testid="parking-lot-content"]');
    await expect(parkingLotContent).toBeVisible({ timeout: 5000 });

    // Verify the input field is visible
    const input = page.locator('[data-testid="parking-lot-input"]');
    await expect(input).toBeVisible();
  });

  test('should add item when typing and pressing Enter', async ({ page }) => {
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Wait for content
    await expect(page.locator('[data-testid="parking-lot-content"]')).toBeVisible({ timeout: 5000 });

    // Type a test idea
    const input = page.locator('[data-testid="parking-lot-input"]');
    await input.fill('Test parking lot idea');
    await input.press('Enter');

    // Verify the item was added
    const itemText = page.locator('[data-testid="parking-lot-item-text"]');
    await expect(itemText).toContainText('Test parking lot idea');
  });

  test('should add item when clicking the add button', async ({ page }) => {
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Wait for content
    await expect(page.locator('[data-testid="parking-lot-content"]')).toBeVisible({ timeout: 5000 });

    // Type a test idea
    const input = page.locator('[data-testid="parking-lot-input"]');
    await input.fill('Another test idea');

    // Click the add button
    const addButton = page.locator('[data-testid="parking-lot-add-button"]');
    await addButton.click();

    // Verify the item was added
    const itemText = page.locator('[data-testid="parking-lot-item-text"]');
    await expect(itemText).toContainText('Another test idea');
  });

  test('should delete item when clicking delete button', async ({ page }) => {
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Wait for content
    await expect(page.locator('[data-testid="parking-lot-content"]')).toBeVisible({ timeout: 5000 });

    // Add an item first
    const input = page.locator('[data-testid="parking-lot-input"]');
    await input.fill('Item to delete');
    await input.press('Enter');

    // Verify item exists
    const item = page.locator('[data-testid="parking-lot-item"]');
    await expect(item).toBeVisible();

    // Hover over item to reveal delete button
    await item.hover();

    // Click delete button
    const deleteButton = page.locator('[data-testid="parking-lot-delete-button"]');
    await deleteButton.click();

    // Verify item was removed
    await expect(item).not.toBeVisible();
  });

  test('should persist items in localStorage', async ({ page }) => {
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Wait for content
    await expect(page.locator('[data-testid="parking-lot-content"]')).toBeVisible({ timeout: 5000 });

    // Add an item
    const input = page.locator('[data-testid="parking-lot-input"]');
    await input.fill('Persistent idea');
    await input.press('Enter');

    // Verify item was added
    await expect(page.locator('[data-testid="parking-lot-item-text"]')).toContainText('Persistent idea');

    // Reload the page
    await page.reload();

    // Open drawer again
    await page.locator('[data-testid="right-drawer-toggle"]').click();
    await expect(page.locator('[data-testid="parking-lot-content"]')).toBeVisible({ timeout: 5000 });

    // Verify item persists
    await expect(page.locator('[data-testid="parking-lot-item-text"]')).toContainText('Persistent idea');
  });
});
