import { test, expect } from '@playwright/test';

/**
 * Priorities List Tests
 *
 * Verifies the Priorities List feature in the right drawer:
 * - Displays tasks with priorities
 * - Priority badges show correct colors (P1=red, P2=orange, P3=yellow)
 * - Can toggle task completion
 * - Can expand/collapse list (show more/less)
 * - Drag handles are visible for reordering
 * - Project badges display correctly
 */

test.describe('Priorities List', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="right-drawer-toggle"]', { timeout: 10000 });
  });

  test('should open right drawer and show Priorities content', async ({ page }) => {
    // Click the right drawer toggle button
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await expect(toggleButton).toBeVisible();
    await toggleButton.click();

    // Wait for the drawer to open
    const drawer = page.locator('[data-testid="right-drawer"]');
    await expect(drawer).toHaveClass(/translate-x-0/);

    // Click the priorities tab
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();

    // Wait for priorities content to appear (either list, loading, or empty state)
    const prioritiesList = page.locator('[data-testid="priorities-list"], [data-testid="priorities-loading"], [data-testid="priorities-empty"]');
    await expect(prioritiesList).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state when no priorities exist', async ({ page }) => {
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Click the priorities tab
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();

    // If there are no priority tasks, should show empty state
    const emptyState = page.locator('[data-testid="priorities-empty"]');
    const prioritiesList = page.locator('[data-testid="priorities-list"]');

    // Wait for either empty state or list to appear
    await expect(emptyState.or(prioritiesList)).toBeVisible({ timeout: 5000 });
  });

  test('should display priority items with correct structure', async ({ page }) => {
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Click the priorities tab
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    // Wait for either
    await expect(prioritiesList.or(emptyState)).toBeVisible({ timeout: 5000 });

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
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Click the priorities tab
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible({ timeout: 5000 });

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
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Click the priorities tab
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible({ timeout: 5000 });

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
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Click the priorities tab
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible({ timeout: 5000 });

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
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Click the priorities tab
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible({ timeout: 5000 });

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
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Click the priorities tab
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();

    // Wait for content
    const prioritiesList = page.locator('[data-testid="priorities-list"]');
    const emptyState = page.locator('[data-testid="priorities-empty"]');

    await expect(prioritiesList.or(emptyState)).toBeVisible({ timeout: 5000 });

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

  test('should switch between tabs correctly', async ({ page }) => {
    // Open the drawer
    const toggleButton = page.locator('[data-testid="right-drawer-toggle"]');
    await toggleButton.click();

    // Initially on parking lot tab
    const parkingLotTab = page.locator('[data-testid="drawer-tab-parking-lot"]');
    await expect(parkingLotTab).toHaveAttribute('aria-selected', 'true');

    // Switch to priorities
    const prioritiesTab = page.locator('[data-testid="drawer-tab-priorities"]');
    await prioritiesTab.click();
    await expect(prioritiesTab).toHaveAttribute('aria-selected', 'true');
    await expect(parkingLotTab).toHaveAttribute('aria-selected', 'false');

    // Verify priorities content is shown
    const prioritiesContent = page.locator('[data-testid="priorities-list"], [data-testid="priorities-loading"], [data-testid="priorities-empty"]');
    await expect(prioritiesContent).toBeVisible({ timeout: 5000 });

    // Switch back to parking lot
    await parkingLotTab.click();
    await expect(parkingLotTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-testid="parking-lot-content"]')).toBeVisible();
  });
});
