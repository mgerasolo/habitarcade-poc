import { test, expect } from '@playwright/test';

/**
 * Full Width Layout Tests
 *
 * Tests for Issue #26: Page body should use full available width
 * Verifies main content uses full width while sidebar remains functional
 */

test.describe('Full Width Layout', () => {
  test('main content container uses full width', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find the main content wrapper (direct child of main element)
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    // The inner div should have w-full class (not max-w-7xl)
    const contentWrapper = mainElement.locator('> div').first();
    await expect(contentWrapper).toBeVisible();

    // Verify the content wrapper has full width class
    await expect(contentWrapper).toHaveClass(/w-full/);

    // Verify max-w-7xl is NOT present (the old constraint)
    const hasMaxWidth = await contentWrapper.evaluate((el) => {
      return el.classList.contains('max-w-7xl');
    });
    expect(hasMaxWidth).toBe(false);
  });

  test('sidebar is still present and functional', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Sidebar should be visible
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Sidebar should contain navigation items
    const navButtons = sidebar.locator('nav button');
    await expect(navButtons.first()).toBeVisible();

    // Test sidebar navigation works - click on Dashboard
    const dashboardButton = page.getByRole('button', { name: /dashboard/i });
    await dashboardButton.click();

    // Wait for navigation
    await page.waitForTimeout(300);

    // Verify we can navigate (dashboard page should be visible)
    const dashboardPage = page.getByTestId('dashboard-page');
    await expect(dashboardPage).toBeVisible();
  });

  test('content fills available width between sidebar and viewport edge', async ({ page }) => {
    // Use a specific viewport size for consistent testing
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get the main element
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    // Get the content wrapper dimensions
    const contentWrapper = mainElement.locator('> div').first();
    const wrapperBox = await contentWrapper.boundingBox();

    // Get main element dimensions
    const mainBox = await mainElement.boundingBox();

    // Content wrapper should fill the main area (accounting for padding)
    // The wrapper width should be close to the main width (within padding tolerance)
    expect(wrapperBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    if (wrapperBox && mainBox) {
      // Wrapper should span most of the main area width
      // Allow for padding (px-4 = 16px on each side = 32px total)
      const expectedMinWidth = mainBox.width - 40; // Allow some tolerance
      expect(wrapperBox.width).toBeGreaterThanOrEqual(expectedMinWidth);
    }
  });

  test('maintains proper padding on edges', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // The main element should have padding classes
    const mainElement = page.locator('main');
    await expect(mainElement).toBeVisible();

    // Check that px-4 padding is present
    await expect(mainElement).toHaveClass(/px-4/);
  });

  test('dashboard grid utilizes extra width', async ({ page }) => {
    // Use a wide viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to dashboard
    const dashboardButton = page.getByRole('button', { name: /dashboard/i });
    await dashboardButton.click();

    await page.waitForTimeout(300);

    // Dashboard page should be visible
    const dashboardPage = page.getByTestId('dashboard-page');
    await expect(dashboardPage).toBeVisible();

    // Get dashboard page width
    const dashboardBox = await dashboardPage.boundingBox();
    expect(dashboardBox).not.toBeNull();

    if (dashboardBox) {
      // Dashboard should utilize significant width (at least 1000px on a 1920px screen)
      // Accounting for sidebar (~256px collapsed or ~64px) and some padding
      expect(dashboardBox.width).toBeGreaterThan(1000);
    }
  });
});
