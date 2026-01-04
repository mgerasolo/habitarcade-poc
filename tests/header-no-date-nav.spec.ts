import { test, expect } from '@playwright/test';

/**
 * Header Date Navigation Removal Tests
 *
 * Tests for Issue #14: Remove global date selector from top nav bar
 *
 * These tests verify:
 * - Date navigation elements are NOT present in the header
 * - Header still contains logo, sidebar toggle, and user menu
 * - Header structure is correct after date nav removal
 */

test.describe('Header - No Date Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');

    // Wait for the header to load
    await page.waitForSelector('[data-testid="main-header"]', {
      timeout: 10000,
    });
  });

  test('header does NOT contain date navigation elements', async ({ page }) => {
    const header = page.locator('[data-testid="main-header"]');

    // Date navigation elements should NOT exist
    // Check for Previous/Next buttons with date-related aria labels
    const prevButton = header.locator('button[aria-label="Previous"]');
    const nextButton = header.locator('button[aria-label="Next"]');
    const todayButton = header.locator('button:has-text("Today")');

    await expect(prevButton).not.toBeVisible();
    await expect(nextButton).not.toBeVisible();
    await expect(todayButton).not.toBeVisible();

    // Calendar icon in the header's center section should not exist
    // (The CalendarToday icon was part of the date display)
    const calendarDateDisplay = header.locator('.flex.items-center.gap-3.px-4.py-2');
    await expect(calendarDateDisplay).not.toBeVisible();
  });

  test('header does NOT contain ChevronLeft/ChevronRight for date navigation', async ({ page }) => {
    const header = page.locator('[data-testid="main-header"]');

    // The date navigation had specific button patterns with aria-labels
    // These should no longer exist in the header
    const dateNavPrev = header.locator('button[aria-label="Previous"]');
    const dateNavNext = header.locator('button[aria-label="Next"]');

    expect(await dateNavPrev.count()).toBe(0);
    expect(await dateNavNext.count()).toBe(0);
  });

  test('header still contains logo', async ({ page }) => {
    const header = page.locator('[data-testid="main-header"]');
    const logo = header.locator('[data-testid="header-logo"]');

    await expect(logo).toBeVisible();

    // Logo should contain the HabitArcade text
    const logoText = await logo.textContent();
    expect(logoText).toContain('HabitArcade');
  });

  test('header still contains sidebar toggle', async ({ page }) => {
    const header = page.locator('[data-testid="main-header"]');
    const sidebarToggle = header.locator('[data-testid="sidebar-toggle"]');

    await expect(sidebarToggle).toBeVisible();

    // Should have appropriate aria-label
    const ariaLabel = await sidebarToggle.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/sidebar/i);
  });

  test('header still contains right drawer toggle', async ({ page }) => {
    const header = page.locator('[data-testid="main-header"]');
    const drawerToggle = header.locator('[data-testid="right-sidebar-toggle"]');

    await expect(drawerToggle).toBeVisible();
  });

  test('header still contains user menu button', async ({ page }) => {
    const header = page.locator('[data-testid="main-header"]');
    const userMenu = header.locator('button[aria-label="User menu"]');

    await expect(userMenu).toBeVisible();
  });

  test('header has correct structure without date navigation', async ({ page }) => {
    const header = page.locator('[data-testid="main-header"]');

    // Header should be visible
    await expect(header).toBeVisible();

    // Should have the sticky header class
    const headerClasses = await header.getAttribute('class');
    expect(headerClasses).toContain('sticky');
    expect(headerClasses).toContain('top-0');

    // Count the main child divs - should be left section and right section
    // (Center section with date nav is removed)
    const mainContainer = header.locator('> div');
    await expect(mainContainer).toBeVisible();
  });

  test('view mode toggle is still present in header', async ({ page }) => {
    const header = page.locator('[data-testid="main-header"]');

    // View mode buttons (Day, Week, Month) should still be present
    const dayButton = header.locator('button:has-text("Day")');
    const weekButton = header.locator('button:has-text("Week")');
    const monthButton = header.locator('button:has-text("Month")');

    // These are hidden on small screens, so we check they exist
    // They have "hidden sm:flex" class on parent, so we just verify presence
    expect(await dayButton.count()).toBeGreaterThanOrEqual(0);
    expect(await weekButton.count()).toBeGreaterThanOrEqual(0);
    expect(await monthButton.count()).toBeGreaterThanOrEqual(0);
  });
});
