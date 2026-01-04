import { test, expect } from '@playwright/test';

/**
 * Issue #96 - Add Manage Icons page for custom icon codes and uploaded images
 *
 * Acceptance Criteria:
 * - AC1: New 'Icons' menu item appears under Manage in sidebar
 * - AC2: Page shows list of user-added custom icon codes with preview
 * - AC3: Page shows list of uploaded images with preview and delete option
 * - AC4: Can add new icon code (e.g., `material:CustomIcon`) with preview
 */

test.describe('Issue #96 - Manage Icons Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Manage Icons page
    await page.goto('/manage/icons');
    // Wait for page to load
    await page.waitForSelector('[data-testid="manage-icons-page"]', { timeout: 10000 });
  });

  test('AC1: Icons menu item appears in sidebar under Manage', async ({ page }) => {
    // Navigate to home first to see sidebar
    await page.goto('/');
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });

    // Find and expand Manage section
    const manageNav = page.locator('[data-testid="nav-manage"]');
    await expect(manageNav).toBeVisible();
    await manageNav.click();

    // Wait for expansion
    await page.waitForTimeout(300);

    // Look for Icons menu item (use text selector since it's a child item)
    const iconsMenuItem = page.locator('text=Icons').first();
    await expect(iconsMenuItem).toBeVisible();
  });

  test('Page loads with correct title and tabs', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1:has-text("Manage Icons")')).toBeVisible();

    // Check tabs exist
    await expect(page.locator('button:has-text("Custom Icons")')).toBeVisible();
    await expect(page.locator('button:has-text("Uploaded Images")')).toBeVisible();
    await expect(page.locator('button:has-text("Recently Used")')).toBeVisible();
  });

  test('Add Icon button is visible and opens modal', async ({ page }) => {
    // Check Add Icon button exists
    const addButton = page.locator('[data-testid="add-icon-button"]');
    await expect(addButton).toBeVisible();

    // Click to open modal
    await addButton.click();

    // Modal should appear
    await expect(page.locator('h2:has-text("Add Custom Icon")')).toBeVisible({ timeout: 5000 });

    // Check modal has input fields
    await expect(page.locator('input[placeholder*="material:Home"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="My Custom Icon"]')).toBeVisible();
  });

  test('AC4: Can add a new icon code with preview', async ({ page }) => {
    // Open add modal
    const addButton = page.locator('[data-testid="add-icon-button"]');
    await addButton.click();

    // Wait for modal
    await expect(page.locator('h2:has-text("Add Custom Icon")')).toBeVisible({ timeout: 5000 });

    // Enter icon code
    const codeInput = page.locator('input[placeholder*="material:Home"]');
    await codeInput.fill('material:Star');

    // Enter label
    const labelInput = page.locator('input[placeholder*="My Custom Icon"]');
    await labelInput.fill('Favorite Star');

    // Submit - use the modal's Add Icon button (inside the dialog)
    await page.locator('[role="dialog"] button:has-text("Add Icon"), .fixed.inset-0 button:has-text("Add Icon")').first().click();

    // Modal should close and icon should appear in list (use specific selector to avoid toast)
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Favorite Star")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="manage-icons-page"] .font-mono:has-text("material:Star")')).toBeVisible();
  });

  test('Tabs switch content correctly', async ({ page }) => {
    // Custom Icons tab is active by default
    const customTab = page.locator('button:has-text("Custom Icons")');
    await expect(customTab).toHaveClass(/bg-teal-600/);

    // Click Uploaded Images tab
    const uploadedTab = page.locator('button:has-text("Uploaded Images")');
    await uploadedTab.click();

    // Wait for tab to become active
    await expect(uploadedTab).toHaveClass(/bg-teal-600/);

    // Custom tab should no longer be active
    await expect(customTab).not.toHaveClass(/bg-teal-600/);

    // Click Recently Used tab
    const recentTab = page.locator('button:has-text("Recently Used")');
    await recentTab.click();

    // Wait for tab to become active
    await expect(recentTab).toHaveClass(/bg-teal-600/);
  });

  test('Search input filters results', async ({ page }) => {
    // First add an icon so we have something to search
    const addButton = page.locator('[data-testid="add-icon-button"]');
    await addButton.click();
    await page.locator('input[placeholder*="material:Home"]').fill('material:Home');
    await page.locator('input[placeholder*="My Custom Icon"]').fill('Home Icon');
    await page.locator('.fixed.inset-0 button:has-text("Add Icon")').first().click();

    // Wait for icon to be added (use specific selector to avoid toast)
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Home Icon")')).toBeVisible({ timeout: 5000 });

    // Add another icon
    await addButton.click();
    await page.locator('input[placeholder*="material:Home"]').fill('material:Settings');
    await page.locator('input[placeholder*="My Custom Icon"]').fill('Settings Icon');
    await page.locator('.fixed.inset-0 button:has-text("Add Icon")').first().click();

    // Wait for toast to disappear
    await page.waitForTimeout(500);

    // Both should be visible (use specific selector)
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Home Icon")')).toBeVisible();
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Settings Icon")')).toBeVisible();

    // Search for "Home"
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Home');

    // Only Home Icon should be visible
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Home Icon")')).toBeVisible();
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Settings Icon")')).not.toBeVisible();
  });

  test('Empty state shows helpful message', async ({ page }) => {
    // Clear any existing icons first by going to a fresh session
    await page.evaluate(() => {
      localStorage.removeItem('habitarcade-icons');
    });
    await page.reload();
    await page.waitForSelector('[data-testid="manage-icons-page"]', { timeout: 10000 });

    // Should show empty state for custom icons
    await expect(page.locator('text=No custom icons yet')).toBeVisible();

    // Click on Uploaded Images tab
    await page.locator('button:has-text("Uploaded Images")').click();
    await expect(page.locator('text=No uploaded images yet')).toBeVisible();

    // Click on Recently Used tab
    await page.locator('button:has-text("Recently Used")').click();
    await expect(page.locator('text=No recently used icons')).toBeVisible();
  });

  test('Can copy icon code to clipboard', async ({ page }) => {
    // Add an icon first
    const addButton = page.locator('[data-testid="add-icon-button"]');
    await addButton.click();
    await page.locator('input[placeholder*="material:Home"]').fill('material:ContentCopy');
    await page.locator('input[placeholder*="My Custom Icon"]').fill('Copy Icon');
    await page.locator('.fixed.inset-0 button:has-text("Add Icon")').first().click();

    // Wait for icon to appear (use specific selector to avoid toast)
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Copy Icon")')).toBeVisible({ timeout: 5000 });

    // Click copy button (look for ContentCopy icon button)
    const copyButton = page.locator('button[title="Copy code"]').first();
    await copyButton.click();

    // Should show toast notification
    await expect(page.locator('text=Copied icon code')).toBeVisible({ timeout: 3000 });
  });

  test('Icons persist across page reload', async ({ page }) => {
    // Add an icon
    const addButton = page.locator('[data-testid="add-icon-button"]');
    await addButton.click();
    await page.locator('input[placeholder*="material:Home"]').fill('material:Save');
    await page.locator('input[placeholder*="My Custom Icon"]').fill('Persistent Icon');
    await page.locator('.fixed.inset-0 button:has-text("Add Icon")').first().click();

    // Wait for icon to appear (use specific selector to avoid toast)
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Persistent Icon")')).toBeVisible({ timeout: 5000 });

    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="manage-icons-page"]', { timeout: 10000 });

    // Icon should still be there
    await expect(page.locator('[data-testid="manage-icons-page"] .text-white:has-text("Persistent Icon")')).toBeVisible();
  });
});
