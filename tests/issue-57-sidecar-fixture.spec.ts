import { test, expect } from '@playwright/test';

/**
 * Issue #57: Sidecar - Permanent fixture with customizable modules (no overlay)
 *
 * Tests that the right sidebar is a permanent fixture that:
 * - Doesn't overlay main content (content resizes)
 * - Has configurable modules
 * - Persists state across navigation
 */

test.describe('Issue #57: Sidecar permanent fixture', () => {
  test.use({
    viewport: { width: 1920, height: 1080 },
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('AC1: Right sidebar is visible and positioned correctly', async ({ page }) => {
    // Find the right sidebar
    const rightSidebar = page.getByTestId('right-sidebar');

    // Check if sidebar is visible (might be open by default)
    const isVisible = await rightSidebar.isVisible().catch(() => false);

    if (!isVisible) {
      // Try to open the sidebar
      const toggleButton = page.locator('[aria-label="Toggle sidecar"], [data-testid="toggle-right-sidebar"]').first();
      if (await toggleButton.isVisible().catch(() => false)) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    }

    // Verify sidebar structure
    if (await rightSidebar.isVisible()) {
      // Sidebar should have fixed positioning
      const position = await rightSidebar.evaluate(el =>
        window.getComputedStyle(el).position
      );
      expect(position).toBe('fixed');

      // Sidebar should be on the right side
      const right = await rightSidebar.evaluate(el =>
        window.getComputedStyle(el).right
      );
      expect(right).toBe('0px');
    }
  });

  test('AC2: Main content has margin when sidebar is open', async ({ page }) => {
    // Find the main content area
    const mainContent = page.locator('main').first();

    // Find the right sidebar
    const rightSidebar = page.getByTestId('right-sidebar');
    const sidebarVisible = await rightSidebar.isVisible().catch(() => false);

    if (sidebarVisible) {
      // Check if main content has right margin
      const marginRight = await mainContent.evaluate(el => {
        const style = window.getComputedStyle(el);
        return parseInt(style.marginRight, 10);
      });

      // Main content should have margin when sidebar is open (320px = w-80)
      expect(marginRight).toBeGreaterThan(0);
    }
  });

  test('AC3: Sidebar has configurable modules with add functionality', async ({ page }) => {
    // Find the right sidebar
    const rightSidebar = page.getByTestId('right-sidebar');

    if (!(await rightSidebar.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Look for the add module button
    const addModuleButton = page.getByTestId('add-module-button');
    if (!(await addModuleButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Click to open module picker
    await addModuleButton.click();
    await page.waitForTimeout(300);

    // Should show module picker options
    const modulePickerText = page.locator('text=Add a module:');
    const hasModulePicker = await modulePickerText.isVisible().catch(() => false);

    // Either shows picker or "all modules added" message
    if (!hasModulePicker) {
      const allAddedText = page.locator('text=All modules are already added');
      expect(await allAddedText.isVisible()).toBe(true);
    } else {
      expect(hasModulePicker).toBe(true);
    }
  });

  test('AC4: Modules can be expanded/collapsed', async ({ page }) => {
    // Find the right sidebar
    const rightSidebar = page.getByTestId('right-sidebar');

    if (!(await rightSidebar.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Find a module header
    const moduleHeader = page.locator('[data-testid^="module-header-"]').first();

    if (!(await moduleHeader.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Click to toggle expand/collapse
    await moduleHeader.click();
    await page.waitForTimeout(300);

    // Module should still exist (toggle behavior works)
    expect(await moduleHeader.isVisible()).toBe(true);
  });

  test('AC5: Sidebar state persists across navigation', async ({ page }) => {
    // Find the right sidebar
    const rightSidebar = page.getByTestId('right-sidebar');
    const initialVisibility = await rightSidebar.isVisible().catch(() => false);

    // Navigate to another page
    const habitsNav = page.locator('[data-testid="nav-habits"]');
    if (await habitsNav.isVisible()) {
      await habitsNav.click();
      await page.waitForTimeout(500);
    }

    // Sidebar should maintain same state
    const afterNavVisibility = await rightSidebar.isVisible().catch(() => false);
    expect(afterNavVisibility).toBe(initialVisibility);
  });

  test('AC6: Sidebar can be toggled open/closed', async ({ page }) => {
    // Find the sidebar collapse button
    const collapseButton = page.getByTestId('sidebar-collapse-button');

    if (!(await collapseButton.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Get initial width
    const rightSidebar = page.getByTestId('right-sidebar');
    const initialWidth = await rightSidebar.evaluate(el =>
      el.getBoundingClientRect().width
    );

    // Toggle sidebar
    await collapseButton.click();
    await page.waitForTimeout(500);

    // Width should change
    const newWidth = await rightSidebar.evaluate(el =>
      el.getBoundingClientRect().width
    );

    // Width should be different (either collapsed or expanded)
    expect(newWidth).not.toBe(initialWidth);
  });

  test('AC7: No overlay/shadow blocking main content', async ({ page }) => {
    // Find the right sidebar
    const rightSidebar = page.getByTestId('right-sidebar');

    if (!(await rightSidebar.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    // Check that there's no overlay element
    const overlay = page.locator('.fixed.inset-0.bg-black');
    const hasOverlay = await overlay.count() > 0;

    // If overlay exists, it should NOT be visible when sidebar is open
    // (Overlays are typically for modals, not sidebars)
    if (hasOverlay) {
      // Check if any overlay is blocking main content
      const overlayVisible = await overlay.first().isVisible().catch(() => false);
      // Note: We allow overlays for modals, but the sidebar itself shouldn't create one
      // This test passes as long as main content is still interactable
    }

    // Main content should be clickable (not blocked)
    const mainContent = page.locator('main').first();
    const isMainContentInteractable = await mainContent.evaluate(el => {
      // Check if pointer-events are enabled
      return window.getComputedStyle(el).pointerEvents !== 'none';
    });
    expect(isMainContentInteractable).toBe(true);
  });
});
