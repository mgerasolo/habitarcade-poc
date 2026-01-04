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
      localStorage.removeItem('habitarcade-ui');
    });

    // Navigate to the dashboard after clearing storage
    await page.reload();

    // Wait for the page to load
    await page.waitForSelector('[data-testid="right-sidebar-toggle"]', { timeout: 10000 });
  });

  // Helper function to open parking lot module
  async function openParkingLotModule(page: import('@playwright/test').Page) {
    const sidebar = page.locator('[data-testid="right-sidebar"]');

    // Check if sidebar is already open (has w-80 class)
    const sidebarClass = await sidebar.getAttribute('class');
    const isSidebarOpen = sidebarClass?.includes('w-80');

    // Only click toggle if sidebar is closed
    if (!isSidebarOpen) {
      const toggleButton = page.locator('[data-testid="right-sidebar-toggle"]');
      await toggleButton.click();
      await expect(sidebar).toHaveClass(/w-80/, { timeout: 5000 });
    }

    // Click on the Parking Lot module header to expand it (if not already expanded)
    const moduleHeader = page.locator('[data-testid="module-header-parking-lot"]');
    await expect(moduleHeader).toBeVisible({ timeout: 5000 });

    // Check if content is already visible
    const parkingLotContent = page.locator('[data-testid="parking-lot-content"]');
    const isContentVisible = await parkingLotContent.isVisible();

    if (!isContentVisible) {
      await moduleHeader.click({ force: true });
      await expect(parkingLotContent).toBeVisible({ timeout: 5000 });
    }
  }

  test('should open right sidebar and show Parking Lot content', async ({ page }) => {
    // Open the parking lot module
    await openParkingLotModule(page);

    // Verify the Parking Lot content is visible
    const parkingLotContent = page.locator('[data-testid="parking-lot-content"]');
    await expect(parkingLotContent).toBeVisible();

    // Verify the input field is visible
    const input = page.locator('[data-testid="parking-lot-input"]');
    await expect(input).toBeVisible();
  });

  test('should add item when typing and pressing Enter', async ({ page }) => {
    // Open the parking lot module
    await openParkingLotModule(page);

    // Type a test idea
    const input = page.locator('[data-testid="parking-lot-input"]');
    await input.fill('Test parking lot idea');
    await input.press('Enter');

    // Verify the item was added
    const itemText = page.locator('[data-testid="parking-lot-item-text"]');
    await expect(itemText).toContainText('Test parking lot idea');
  });

  test('should add item when clicking the add button', async ({ page }) => {
    // Open the parking lot module
    await openParkingLotModule(page);

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
    // Open the parking lot module
    await openParkingLotModule(page);

    // Add an item first
    const input = page.locator('[data-testid="parking-lot-input"]');
    await input.fill('Item to delete');
    await input.press('Enter');

    // Wait for item to appear
    const item = page.locator('[data-testid="parking-lot-item"]');
    await expect(item).toBeVisible({ timeout: 5000 });

    // Hover over item to reveal delete button
    await item.hover();

    // Click delete button
    const deleteButton = page.locator('[data-testid="parking-lot-delete-button"]');
    await deleteButton.click();

    // Verify item was removed
    await expect(item).not.toBeVisible();
  });

  test('should persist items in localStorage', async ({ page }) => {
    // Open the parking lot module
    await openParkingLotModule(page);

    // Add an item
    const input = page.locator('[data-testid="parking-lot-input"]');
    await input.fill('Persistent idea');
    await input.press('Enter');

    // Verify item was added
    await expect(page.locator('[data-testid="parking-lot-item-text"]')).toContainText('Persistent idea');

    // Reload the page
    await page.reload();

    // Open parking lot module again
    await openParkingLotModule(page);

    // Verify item persists
    await expect(page.locator('[data-testid="parking-lot-item-text"]')).toContainText('Persistent idea');
  });
});
