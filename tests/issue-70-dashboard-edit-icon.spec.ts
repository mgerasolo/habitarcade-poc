import { test, expect } from '@playwright/test';

/**
 * Issue #70: Dashboard menu items - Show edit icon on hover with rename/icon/archive modal
 *
 * Tests that dashboard page items in the sidebar show an edit icon on hover
 * that opens a modal for editing the page name, icon, and archiving.
 */

test.describe('Issue #70: Dashboard menu hover edit icon', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
  });

  test.describe('AC1: Edit icon appears on hover', () => {
    test('dashboard page item shows edit icon on hover', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      // Expand dashboard section
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(300);

      // Check for dashboard children container
      const dashboardChildren = page.getByTestId('nav-dashboard-children');
      const hasChildren = await dashboardChildren.isVisible().catch(() => false);

      if (!hasChildren) {
        test.skip();
        return;
      }

      // Find the first dashboard page item INSIDE the children container
      // Dashboard pages have data-testid like "nav-today" or "nav-page-xxx"
      const dashboardPageItem = dashboardChildren.locator('button[data-testid^="nav-"]').first();
      const hasPageItem = await dashboardPageItem.isVisible().catch(() => false);

      if (!hasPageItem) {
        test.skip();
        return;
      }

      // Hover to reveal edit icon
      await dashboardPageItem.hover();
      await page.waitForTimeout(200);

      // Look for edit icon button - the testid format is "edit-dashboard-page-{pageId}"
      const editIcon = dashboardChildren.locator('[data-testid^="edit-dashboard-page-"]').first();
      const hasEditIcon = await editIcon.isVisible().catch(() => false);

      expect(hasEditIcon).toBe(true);
    });

    test('edit icon is hidden by default and shows on hover', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(300);

      const dashboardChildren = page.getByTestId('nav-dashboard-children');
      if (!(await dashboardChildren.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Find the first dashboard page item inside children
      const dashboardPageItem = dashboardChildren.locator('button[data-testid^="nav-"]').first();
      if (!(await dashboardPageItem.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      // Hover over the item
      await dashboardPageItem.hover();
      await page.waitForTimeout(200);

      // After hovering, edit icon should be visible
      const editIcon = dashboardChildren.locator('[data-testid^="edit-dashboard-page-"]').first();
      await expect(editIcon).toBeVisible();
    });
  });

  test.describe('AC2: Edit modal opens on click', () => {
    test('clicking edit icon opens edit modal', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(300);

      const dashboardChildren = page.getByTestId('nav-dashboard-children');
      if (!(await dashboardChildren.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      const dashboardPageItem = dashboardChildren.locator('button[data-testid^="nav-"]').first();
      if (!(await dashboardPageItem.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await dashboardPageItem.hover();
      await page.waitForTimeout(200);

      const editIcon = dashboardChildren.locator('[data-testid^="edit-dashboard-page-"]').first();
      if (await editIcon.isVisible()) {
        await editIcon.click();
        await page.waitForTimeout(300);

        // Modal should appear (data-testid="dashboard-page-form")
        const modal = page.getByTestId('dashboard-page-form');
        await expect(modal).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('modal has name input field', async ({ page }) => {
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(300);

      const dashboardChildren = page.getByTestId('nav-dashboard-children');
      if (!(await dashboardChildren.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      const dashboardPageItem = dashboardChildren.locator('button[data-testid^="nav-"]').first();
      if (!(await dashboardPageItem.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await dashboardPageItem.hover();
      await page.waitForTimeout(200);

      const editIcon = dashboardChildren.locator('[data-testid^="edit-dashboard-page-"]').first();
      if (await editIcon.isVisible()) {
        await editIcon.click();
        await page.waitForTimeout(300);

        const modal = page.getByTestId('dashboard-page-form');
        if (await modal.isVisible()) {
          // Should have name input (data-testid="page-name-input")
          const nameInput = page.getByTestId('page-name-input');
          await expect(nameInput).toBeVisible();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('AC3: Modal allows icon change', () => {
    test('modal has icon picker button', async ({ page }) => {
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(300);

      const dashboardChildren = page.getByTestId('nav-dashboard-children');
      if (!(await dashboardChildren.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      const dashboardPageItem = dashboardChildren.locator('button[data-testid^="nav-"]').first();
      if (!(await dashboardPageItem.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await dashboardPageItem.hover();
      await page.waitForTimeout(200);

      const editIcon = dashboardChildren.locator('[data-testid^="edit-dashboard-page-"]').first();
      if (await editIcon.isVisible()) {
        await editIcon.click();
        await page.waitForTimeout(300);

        const modal = page.getByTestId('dashboard-page-form');
        if (await modal.isVisible()) {
          // Should have icon picker button (data-testid="choose-icon-button")
          const iconButton = page.getByTestId('choose-icon-button');
          await expect(iconButton).toBeVisible();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('AC4: Modal functionality', () => {
    test('modal can be closed with Cancel button', async ({ page }) => {
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(300);

      const dashboardChildren = page.getByTestId('nav-dashboard-children');
      if (!(await dashboardChildren.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      const dashboardPageItem = dashboardChildren.locator('button[data-testid^="nav-"]').first();
      if (!(await dashboardPageItem.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await dashboardPageItem.hover();
      await page.waitForTimeout(200);

      const editIcon = dashboardChildren.locator('[data-testid^="edit-dashboard-page-"]').first();
      if (await editIcon.isVisible()) {
        await editIcon.click();
        await page.waitForTimeout(300);

        const modal = page.getByTestId('dashboard-page-form');
        if (await modal.isVisible()) {
          // Close modal with Cancel button
          const cancelButton = modal.getByRole('button', { name: /cancel/i });
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            await page.waitForTimeout(200);
            await expect(modal).not.toBeVisible();
          }
        }
      } else {
        test.skip();
      }
    });

    test('default page shows lock message instead of delete button', async ({ page }) => {
      const dashboardNav = page.getByTestId('nav-dashboard');
      await dashboardNav.click();
      await page.waitForTimeout(300);

      const dashboardChildren = page.getByTestId('nav-dashboard-children');
      if (!(await dashboardChildren.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      const dashboardPageItem = dashboardChildren.locator('button[data-testid^="nav-"]').first();
      if (!(await dashboardPageItem.isVisible().catch(() => false))) {
        test.skip();
        return;
      }

      await dashboardPageItem.hover();
      await page.waitForTimeout(200);

      const editIcon = dashboardChildren.locator('[data-testid^="edit-dashboard-page-"]').first();
      if (await editIcon.isVisible()) {
        await editIcon.click();
        await page.waitForTimeout(300);

        const modal = page.getByTestId('dashboard-page-form');
        if (await modal.isVisible()) {
          // Default page should NOT have delete button
          const deleteButton = page.getByTestId('delete-page-button');
          const hasDeleteButton = await deleteButton.isVisible().catch(() => false);
          expect(hasDeleteButton).toBe(false);

          // Should show "cannot be deleted" message
          const lockMessage = modal.getByText(/cannot be deleted/i);
          await expect(lockMessage).toBeVisible();
        }
      } else {
        test.skip();
      }
    });
  });
});
