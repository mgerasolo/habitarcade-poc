import { test, expect } from '@playwright/test';

test.describe('Right Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('drawer toggle button is visible in header', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');
    await expect(toggleButton).toBeVisible();
  });

  test('clicking toggle opens drawer with animation', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');
    const drawer = page.getByTestId('right-drawer');

    // Drawer should initially be hidden (translated off-screen)
    await expect(drawer).toHaveClass(/translate-x-full/);

    // Click to open
    await toggleButton.click();

    // Wait for animation and verify drawer is visible (no translate)
    await expect(drawer).toHaveClass(/translate-x-0/);
    await expect(drawer).toBeVisible();
  });

  test('drawer can be closed via close button', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');
    const drawer = page.getByTestId('right-drawer');
    const closeButton = page.getByTestId('drawer-close-button');

    // Open the drawer
    await toggleButton.click();
    await expect(drawer).toHaveClass(/translate-x-0/);

    // Close via close button
    await closeButton.click();
    await expect(drawer).toHaveClass(/translate-x-full/);
  });

  test('drawer can be closed via toggle button', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');
    const drawer = page.getByTestId('right-drawer');

    // Open the drawer
    await toggleButton.click();
    await expect(drawer).toHaveClass(/translate-x-0/);

    // Close via toggle button
    await toggleButton.click();
    await expect(drawer).toHaveClass(/translate-x-full/);
  });

  test('drawer content displays correctly with tabs', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');
    const drawer = page.getByTestId('right-drawer');
    const drawerContent = page.getByTestId('drawer-content');

    // Open the drawer
    await toggleButton.click();
    await expect(drawer).toHaveClass(/translate-x-0/);

    // Verify content area exists
    await expect(drawerContent).toBeVisible();

    // Verify tabs exist
    await expect(page.getByTestId('drawer-tab-parking-lot')).toBeVisible();
    await expect(page.getByTestId('drawer-tab-priorities')).toBeVisible();
    await expect(page.getByTestId('drawer-tab-quick-entry')).toBeVisible();
    await expect(page.getByTestId('drawer-tab-properties')).toBeVisible();
  });

  test('clicking tabs changes drawer content', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');

    // Open the drawer
    await toggleButton.click();

    // Default tab should be parking-lot and active
    const parkingLotTab = page.getByTestId('drawer-tab-parking-lot');
    await expect(parkingLotTab).toHaveAttribute('aria-selected', 'true');

    // Click priorities tab
    const prioritiesTab = page.getByTestId('drawer-tab-priorities');
    await prioritiesTab.click();
    await expect(prioritiesTab).toHaveAttribute('aria-selected', 'true');
    await expect(parkingLotTab).toHaveAttribute('aria-selected', 'false');

    // Verify header title changes (use heading role to be specific)
    await expect(page.getByRole('heading', { name: 'Priorities' })).toBeVisible();
  });

  test('drawer can be closed with Escape key', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');
    const drawer = page.getByTestId('right-drawer');

    // Open the drawer
    await toggleButton.click();
    await expect(drawer).toHaveClass(/translate-x-0/);

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveClass(/translate-x-full/);
  });

  test('toggle button shows different icon when drawer is open', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');

    // Initial state - should have aria-expanded false
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Open drawer
    await toggleButton.click();

    // Should now be expanded
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('drawer is responsive and works on smaller screens', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });

    const toggleButton = page.getByTestId('right-drawer-toggle');
    const drawer = page.getByTestId('right-drawer');

    // Toggle should still be visible
    await expect(toggleButton).toBeVisible();

    // Open drawer
    await toggleButton.click();
    await expect(drawer).toHaveClass(/translate-x-0/);
    await expect(drawer).toBeVisible();
  });
});
