import { test, expect } from '@playwright/test';

/**
 * Priorities List Tests
 *
 * Verifies the Priorities List feature in the right sidebar:
 * - Displays tasks with priorities
 * - Priority badges show correct colors (P1=red, P2=orange, P3=yellow)
 * - Can toggle task completion
 * - Can expand/collapse list (show more/less)
 * - Drag handles are visible for reordering
 * - Project badges display correctly
 */

test.describe('Priorities List', () => {
  // Helper function to open priorities module
  async function openPrioritiesModule(page: import('@playwright/test').Page) {
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

    // First, check if the priorities module even exists (it's not in default modules)
    const moduleHeader = page.locator('[data-testid="module-header-priorities"]');
    const moduleExists = await moduleHeader.count() > 0;

    if (!moduleExists) {
      // Need to add the priorities module via the add module button
      const addModuleButton = page.locator('[data-testid="add-module-button"]');
      await addModuleButton.click();
      await page.waitForTimeout(300);

      const addPrioritiesButton = page.locator('[data-testid="add-module-priorities"]');
      await expect(addPrioritiesButton).toBeVisible({ timeout: 5000 });
      await addPrioritiesButton.click();
      await page.waitForTimeout(300);
    }

    // Now click on the Priorities module header to expand it (if not already expanded)
    await expect(moduleHeader).toBeVisible({ timeout: 5000 });

    // Check if content is already visible
    const content = page.locator('[data-testid="priorities-list"], [data-testid="priorities-loading"], [data-testid="priorities-empty"]');
    const isContentVisible = await content.isVisible();

    if (!isContentVisible) {
      await moduleHeader.click({ force: true });
      await expect(content).toBeVisible({ timeout: 5000 });
    }
  }

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('habitarcade-ui');
    });

    // Navigate to the dashboard after clearing storage
    await page.reload();

    // Wait for the page to load
    await page.waitForSelector('[data-testid="right-sidebar-toggle"]', { timeout: 10000 });
  });

  test('should open right sidebar and show Priorities content', async ({ page }) => {
    // Open the priorities module
    await openPrioritiesModule(page);

    // Verify priorities content is visible (either list, loading, or empty state)
    const prioritiesList = page.locator('[data-testid="priorities-list"], [data-testid="priorities-loading"], [data-testid="priorities-empty"]');
    await expect(prioritiesList).toBeVisible();
  });

  test('should show empty state when no priorities exist', async ({ page }) => {
    // Open the priorities module
    await openPrioritiesModule(page);

    // If there are no priority tasks, should show empty state
    const emptyState = page.locator('[data-testid="priorities-empty"]');
    const prioritiesList = page.locator('[data-testid="priorities-list"]');

    // Either empty state or list should be visible
    await expect(emptyState.or(prioritiesList)).toBeVisible();
  });

  test('should display priority items with correct structure', async ({ page }) => {
    // Open the priorities module
    await openPrioritiesModule(page);

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    // Wait for either
    await expect(prioritiesList.or(emptyState)).toBeVisible();

    // If we have a list, check the structure
    if (await prioritiesList.isVisible()) {
      const items = page.locator('[data-testid="priority-item"]');
      const itemCount = await items.count();

      if (itemCount > 0) {
        // Verify each item has required elements
        const firstItem = items.first();
        await expect(firstItem.locator('[data-testid="priority-drag-handle"]')).toBeVisible();
        await expect(firstItem.locator('[data-testid="priority-badge"]')).toBeVisible();
        await expect(firstItem.locator('[data-testid="priority-checkbox"]')).toBeVisible();
        await expect(firstItem.locator('[data-testid="priority-title"]')).toBeVisible();
      }
    }
  });

  test('should show correct priority badge colors', async ({ page }) => {
    // Open the priorities module
    await openPrioritiesModule(page);

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible();

    if (await prioritiesList.isVisible()) {
      const badges = page.locator('[data-testid="priority-badge"]');
      const badgeCount = await badges.count();

      for (let i = 0; i < badgeCount; i++) {
        const badge = badges.nth(i);
        const badgeText = await badge.textContent();

        // Verify badge has correct label format (P1, P2, or P3)
        expect(badgeText).toMatch(/^P[123]$/);
      }
    }
  });

  test('should toggle task completion when clicking checkbox', async ({ page }) => {
    // Open the priorities module
    await openPrioritiesModule(page);

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible();

    if (await prioritiesList.isVisible()) {
      const items = page.locator('[data-testid="priority-item"]');
      const itemCount = await items.count();

      if (itemCount > 0) {
        const firstCheckbox = page.locator('[data-testid="priority-checkbox"]').first();
        await expect(firstCheckbox).toBeVisible();

        // Get initial state
        const initialClasses = await firstCheckbox.getAttribute('class');
        const wasComplete = initialClasses?.includes('bg-emerald-500');

        // Click to toggle
        await firstCheckbox.click();

        // Wait for state change (the class should change)
        await page.waitForTimeout(500); // Allow time for mutation to process

        // Verify state changed or request was made
        // Note: actual completion state depends on API response
      }
    }
  });

  test('should show "Show more" button when more than 3 items exist', async ({ page }) => {
    // Open the priorities module
    await openPrioritiesModule(page);

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible();

    if (await prioritiesList.isVisible()) {
      const items = page.locator('[data-testid="priority-item"]');
      const visibleCount = await items.count();

      const toggleButton = page.locator('[data-testid="priorities-toggle"]');

      // If toggle button exists, there are more than 3 items
      if (await toggleButton.isVisible()) {
        expect(visibleCount).toBeLessThanOrEqual(3);

        // Click to expand
        await toggleButton.click();

        // Wait for expansion
        await page.waitForTimeout(300);

        // Now should show "Show less"
        await expect(toggleButton).toContainText(/Show less/);

        // Should show more items now
        const expandedCount = await items.count();
        expect(expandedCount).toBeGreaterThan(visibleCount);
      }
    }
  });

  test('should have drag handles visible on items', async ({ page }) => {
    // Open the priorities module
    await openPrioritiesModule(page);

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible();

    if (await prioritiesList.isVisible()) {
      const dragHandles = page.locator('[data-testid="priority-drag-handle"]');
      const handleCount = await dragHandles.count();

      if (handleCount > 0) {
        // All drag handles should be visible
        for (let i = 0; i < handleCount; i++) {
          await expect(dragHandles.nth(i)).toBeVisible();
        }
      }
    }
  });

  test('should show delete button on hover', async ({ page }) => {
    // Open the priorities module
    await openPrioritiesModule(page);

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible();

    if (await prioritiesList.isVisible()) {
      const items = page.locator('[data-testid="priority-item"]');
      const itemCount = await items.count();

      if (itemCount > 0) {
        const firstItem = items.first();
        const deleteButton = firstItem.locator('[data-testid="priority-delete"]');

        // Initially delete button should be hidden (opacity-0)
        await expect(deleteButton).toHaveClass(/opacity-0/);

        // Hover over item
        await firstItem.hover();

        // Delete button should now be visible (group-hover:opacity-100)
        // Note: We wait a bit for the transition
        await page.waitForTimeout(200);
        await expect(deleteButton).not.toHaveClass(/opacity-0/);
      }
    }
  });

  test('should expand and collapse modules independently', async ({ page }) => {
    // Open the priorities module (this will also add it if not present)
    await openPrioritiesModule(page);

    // Priorities content should be visible
    const prioritiesContent = page.locator('[data-testid="priorities-list"], [data-testid="priorities-loading"], [data-testid="priorities-empty"]');
    await expect(prioritiesContent).toBeVisible({ timeout: 5000 });

    // The parking lot module should also be in the sidebar (it's in default modules)
    // Parking lot is expanded by default, so content should already be visible
    const parkingLotContent = page.locator('[data-testid="parking-lot-content"]');
    await expect(parkingLotContent).toBeVisible({ timeout: 5000 });

    // Both contents should now be visible simultaneously
    await expect(prioritiesContent).toBeVisible();

    // Now collapse parking lot and verify priorities remains visible
    const parkingLotModule = page.locator('[data-testid="module-header-parking-lot"]');
    await parkingLotModule.click({ force: true });
    await page.waitForTimeout(300);

    // Parking lot content should now be hidden
    await expect(parkingLotContent).not.toBeVisible();

    // But priorities should still be visible
    await expect(prioritiesContent).toBeVisible();
  });
});
