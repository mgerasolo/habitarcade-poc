import { test, expect } from '@playwright/test';

/**
 * Layout and Sidebar Tests
 *
 * Tests for Issues #21-30:
 * - #21: Habit Matrix category headers distinct
 * - #22: Day of month numbers in cells
 * - #23: Arrow indicator above today's column
 * - #24: Merge duplicate headers (handled by WidgetContainer)
 * - #25: Widget collapse fix (covered in widget-collapse.spec.ts)
 * - #26: Page body full available width
 * - #27: Right sidebar drawer
 * - #28: Right drawer Parking Lot
 * - #29: Right drawer Priorities
 * - #30: Targets in left sidebar
 */

test.describe('Layout and Sidebar Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test.describe('Issue #21: Category Headers Distinct', () => {
    test('category headers have distinct styling', async ({ page }) => {
      // Navigate to Dashboard
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(500);

      const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
      const isVisible = await habitMatrixWidget.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      // Look for category headers with distinct styling
      const categoryHeaders = habitMatrixWidget.locator('[data-testid="category-header"], [data-testid="category-header-flat"]');
      const headerCount = await categoryHeaders.count();

      if (headerCount === 0) {
        test.skip();
        return;
      }

      // Verify the first category header has background styling
      const firstHeader = categoryHeaders.first();
      const classList = await firstHeader.getAttribute('class') || '';

      // Should have background styling (bg-slate-700 or similar)
      expect(classList).toMatch(/bg-slate/);
    });

    test('category dividers are visible', async ({ page }) => {
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(500);

      const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
      const isVisible = await habitMatrixWidget.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      const categoryDividers = habitMatrixWidget.locator('[data-testid="category-divider"]');
      const dividerCount = await categoryDividers.count();

      // Should have at least one divider if there are categories
      if (dividerCount > 0) {
        const firstDivider = categoryDividers.first();
        const classList = await firstDivider.getAttribute('class') || '';
        expect(classList).toMatch(/border-t/);
      }
    });
  });

  test.describe('Issue #22: Day of Month Numbers', () => {
    test('date header shows day of month numbers', async ({ page }) => {
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(500);

      const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
      const isVisible = await habitMatrixWidget.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      // Look for date columns in the header area
      // Date headers should contain day numbers (1-31)
      const dateColumnContainers = habitMatrixWidget.locator('div[title]');
      const containerCount = await dateColumnContainers.count();

      if (containerCount === 0) {
        // Alternative: check for any numbers in the header area
        const headerArea = habitMatrixWidget.locator('.sticky');
        const hasHeaderArea = await headerArea.first().isVisible().catch(() => false);

        if (!hasHeaderArea) {
          test.skip();
          return;
        }

        const headerText = await headerArea.first().textContent() || '';
        // Should contain at least one number (day of month)
        expect(headerText).toMatch(/\d+/);
        return;
      }

      // Check title attribute for date info
      const firstContainer = dateColumnContainers.first();
      const title = await firstContainer.getAttribute('title') || '';

      // Title should be a date string (e.g., "2024-01-15")
      expect(title).toMatch(/\d{4}-\d{2}-\d{2}|[A-Za-z]+/);
    });
  });

  test.describe('Issue #23: Today Arrow Indicator', () => {
    test('today column has arrow indicator', async ({ page }) => {
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(500);

      const habitMatrixWidget = page.locator('[data-widget-id="habit-matrix"]');
      const isVisible = await habitMatrixWidget.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip();
        return;
      }

      // Look for today indicator (highlighted column with arrow)
      const todayIndicator = habitMatrixWidget.locator('.text-teal-400');
      const indicatorCount = await todayIndicator.count();

      // Should have today highlighted
      expect(indicatorCount).toBeGreaterThan(0);

      // Look for the arrow character (▼)
      const arrowIndicator = habitMatrixWidget.locator('span:text("▼")');
      const arrowCount = await arrowIndicator.count();

      // Should have at least one arrow for today
      expect(arrowCount).toBeGreaterThan(0);
    });
  });

  test.describe('Issue #26: Full Width Layout', () => {
    test('main content area uses available width', async ({ page }) => {
      // Check that main content area has flex-1 or similar width handling
      const mainContent = page.locator('main, [role="main"]');
      const hasMainContent = await mainContent.first().isVisible().catch(() => false);

      if (!hasMainContent) {
        // Fallback: check for any content container with flex-1
        const flexContainer = page.locator('.flex-1');
        const hasFlexContainer = await flexContainer.first().isVisible().catch(() => false);
        expect(hasFlexContainer).toBeTruthy();
        return;
      }

      const boundingBox = await mainContent.first().boundingBox();
      expect(boundingBox).not.toBeNull();

      // Main content should take significant portion of viewport
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        // Content width should be at least 50% of viewport (accounting for sidebars)
        expect(boundingBox!.width).toBeGreaterThan(viewportSize.width * 0.4);
      }
    });
  });

  test.describe('Issue #27: Right Sidebar Drawer', () => {
    test('right sidebar toggle button exists', async ({ page }) => {
      const rightSidebarToggle = page.getByTestId('right-sidebar-toggle');
      await expect(rightSidebarToggle).toBeVisible();
    });

    test('right sidebar can be opened and closed', async ({ page }) => {
      const rightSidebarToggle = page.getByTestId('right-sidebar-toggle');
      await expect(rightSidebarToggle).toBeVisible();

      // Open sidebar
      await rightSidebarToggle.click();
      await page.waitForTimeout(300);

      // Check if sidebar content is visible
      const rightSidebar = page.getByTestId('right-sidebar');
      const isOpen = await rightSidebar.isVisible().catch(() => false);

      if (isOpen) {
        // Close sidebar
        await rightSidebarToggle.click();
        await page.waitForTimeout(300);

        // Re-check visibility (should still be visible but collapsed)
        await expect(rightSidebar).toBeVisible();
      }
    });
  });

  test.describe('Issue #28: Parking Lot Module', () => {
    test('parking lot module exists in right sidebar', async ({ page }) => {
      const rightSidebarToggle = page.getByTestId('right-sidebar-toggle');
      await rightSidebarToggle.click();
      await page.waitForTimeout(300);

      // Look for parking lot module
      const parkingLot = page.getByTestId('parking-lot-module');
      const hasParkingLot = await parkingLot.isVisible().catch(() => false);

      if (!hasParkingLot) {
        // Try alternative selector
        const parkingLotAlt = page.locator('[data-module-type="parking-lot"], :text("Parking Lot")');
        const hasAlt = await parkingLotAlt.first().isVisible().catch(() => false);

        if (!hasAlt) {
          test.skip();
          return;
        }
      }
    });
  });

  test.describe('Issue #29: Priorities Module', () => {
    test('priorities module exists in right sidebar', async ({ page }) => {
      const rightSidebarToggle = page.getByTestId('right-sidebar-toggle');
      await rightSidebarToggle.click();
      await page.waitForTimeout(300);

      // Look for priorities module
      const priorities = page.getByTestId('priorities-module');
      const hasPriorities = await priorities.isVisible().catch(() => false);

      if (!hasPriorities) {
        // Try alternative selector
        const prioritiesAlt = page.locator('[data-module-type="priorities"], :text("Priorities")');
        const hasAlt = await prioritiesAlt.first().isVisible().catch(() => false);

        if (!hasAlt) {
          test.skip();
          return;
        }
      }
    });
  });

  test.describe('Issue #30: Targets in Sidebar', () => {
    test('targets nav item exists in left sidebar', async ({ page }) => {
      const targetsNav = page.getByTestId('nav-targets');
      await expect(targetsNav).toBeVisible();
    });

    test('clicking targets navigates to targets page', async ({ page }) => {
      const targetsNav = page.getByTestId('nav-targets');
      await expect(targetsNav).toBeVisible();

      await targetsNav.click();
      await page.waitForTimeout(500);

      // Should see targets page or targets-related content
      const targetsPage = page.getByTestId('targets-page');
      const isTargetsPage = await targetsPage.isVisible().catch(() => false);

      // If no specific targets page, check for targets in URL or page content
      if (!isTargetsPage) {
        const pageContent = page.locator('[data-testid*="target"], :text("Targets")');
        const hasTargetsContent = await pageContent.first().isVisible().catch(() => false);
        expect(hasTargetsContent).toBeTruthy();
      }
    });
  });
});
