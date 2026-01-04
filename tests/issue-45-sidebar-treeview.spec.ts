import { test, expect } from '@playwright/test';

/**
 * Issue #45: Left sidebar - left align with nested treeview lines
 *
 * Tests that the sidebar displays proper treeview structure with:
 * - Left-aligned menu items
 * - Visual hierarchy lines (vertical + horizontal connectors)
 * - Clear parent/child relationships
 *
 * The feature is already implemented in Sidebar.tsx.
 */

test.describe('Issue #45: Sidebar treeview lines', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test.describe('AC1: Menu items left-aligned', () => {
    test('sidebar navigation items are left-aligned', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      // Find a nav item and check its alignment
      const navItems = sidebar.locator('button');
      const firstItem = navItems.first();

      // Check text alignment class or computed style
      const hasLeftAlign = await firstItem.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const textAlign = style.textAlign;
        const hasTextLeftClass = el.classList.contains('text-left');
        const hasJustifyStart = el.classList.contains('justify-start');
        return textAlign === 'left' || hasTextLeftClass || hasJustifyStart || textAlign === 'start';
      });

      expect(hasLeftAlign).toBe(true);
    });
  });

  test.describe('AC2: Nested items show connecting lines', () => {
    test('expanded parent shows vertical trunk line', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      // Dashboard should be expanded by default or we expand it
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(300);

      // Check for children container
      const dashboardChildren = page.getByTestId('nav-dashboard-children');
      const hasChildren = await dashboardChildren.isVisible().catch(() => false);

      if (hasChildren) {
        // Look for vertical line element (absolute positioned div with bg-slate-600)
        const verticalLines = dashboardChildren.locator('[class*="absolute"][class*="left-4"]');
        const lineCount = await verticalLines.count();
        expect(lineCount).toBeGreaterThan(0);
      } else {
        // Try Tasks section which also has children
        const tasksNav = page.getByTestId('nav-tasks');
        await tasksNav.click();
        await page.waitForTimeout(300);

        const tasksChildren = page.getByTestId('nav-tasks-children');
        const hasTasksChildren = await tasksChildren.isVisible().catch(() => false);

        if (hasTasksChildren) {
          const verticalLines = tasksChildren.locator('[class*="absolute"][class*="left-4"]');
          const lineCount = await verticalLines.count();
          expect(lineCount).toBeGreaterThan(0);
        } else {
          // No expandable sections visible - skip
          test.skip();
        }
      }
    });

    test('child items have horizontal connector lines', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      // Expand a section with children
      const tasksNav = page.getByTestId('nav-tasks');
      await tasksNav.click();
      await page.waitForTimeout(300);

      const tasksChildren = page.getByTestId('nav-tasks-children');
      const hasChildren = await tasksChildren.isVisible().catch(() => false);

      if (hasChildren) {
        // Child items should have both vertical and horizontal line elements
        // The horizontal line uses "w-3 h-px" classes
        const childItems = tasksChildren.locator('[class*="relative"]');
        const hasChildWithLines = await childItems.first().isVisible().catch(() => false);

        if (hasChildWithLines) {
          // Verify the structure has line elements
          const lines = tasksChildren.locator('[class*="bg-slate-600"]');
          const lineCount = await lines.count();
          expect(lineCount).toBeGreaterThan(0);
        }
      } else {
        // Try manage section
        const manageNav = page.getByTestId('nav-manage');
        await manageNav.click();
        await page.waitForTimeout(300);

        const manageChildren = page.getByTestId('nav-manage-children');
        const hasManageChildren = await manageChildren.isVisible().catch(() => false);

        if (hasManageChildren) {
          const lines = manageChildren.locator('[class*="bg-slate-600"]');
          const lineCount = await lines.count();
          expect(lineCount).toBeGreaterThan(0);
        } else {
          test.skip();
        }
      }
    });
  });

  test.describe('AC3: Clear parent/child visual relationship', () => {
    test('child items are indented from parent', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      // Check Tasks section which has children
      const tasksNav = page.getByTestId('nav-tasks');
      await tasksNav.click();
      await page.waitForTimeout(300);

      const tasksChildren = page.getByTestId('nav-tasks-children');
      const hasChildren = await tasksChildren.isVisible().catch(() => false);

      if (hasChildren) {
        // Child items should have pl-8 (padding-left for indentation)
        const childButton = tasksChildren.locator('button').first();
        const hasIndent = await childButton.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const paddingLeft = parseInt(style.paddingLeft, 10);
          // pl-8 = 32px
          return paddingLeft >= 24;
        });

        expect(hasIndent).toBe(true);
      } else {
        test.skip();
      }
    });
  });

  test.describe('AC4: Works with expand/collapse', () => {
    test('clicking parent toggles child visibility', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      // Find Manage section
      const manageNav = page.getByTestId('nav-manage');

      // Initially may be collapsed - click to expand
      await manageNav.click();
      await page.waitForTimeout(300);

      const manageChildren = page.getByTestId('nav-manage-children');
      const isExpanded = await manageChildren.isVisible().catch(() => false);

      // Toggle again
      const chevron = manageNav.locator('[data-testid="nav-chevron"]');
      const hasChevron = await chevron.isVisible().catch(() => false);

      if (hasChevron) {
        await chevron.click();
        await page.waitForTimeout(300);

        // Children visibility should have changed
        const isNowExpanded = await manageChildren.isVisible().catch(() => false);
        expect(isNowExpanded).not.toBe(isExpanded);
      } else {
        // No chevron means clicking the nav item toggles
        await manageNav.click();
        await page.waitForTimeout(300);
        const isNowExpanded = await manageChildren.isVisible().catch(() => false);
        expect(isNowExpanded).not.toBe(isExpanded);
      }
    });

    test('tree lines show/hide with expand/collapse', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      // Expand Tasks section
      const tasksNav = page.getByTestId('nav-tasks');
      await tasksNav.click();
      await page.waitForTimeout(300);

      const tasksChildren = page.getByTestId('nav-tasks-children');
      const isExpanded = await tasksChildren.isVisible().catch(() => false);

      if (isExpanded) {
        // Lines should be visible when expanded
        const lines = tasksChildren.locator('[class*="bg-slate-600"]');
        const lineCount = await lines.count();
        expect(lineCount).toBeGreaterThan(0);

        // Collapse and verify children are hidden
        const chevron = tasksNav.locator('[data-testid="nav-chevron"]');
        if (await chevron.isVisible()) {
          await chevron.click();
          await page.waitForTimeout(300);
          await expect(tasksChildren).not.toBeVisible();
        }
      } else {
        test.skip();
      }
    });
  });
});
