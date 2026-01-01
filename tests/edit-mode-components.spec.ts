import { test, expect } from '@playwright/test';

/**
 * Edit Mode Components Tests
 *
 * Verifies that the edit mode functionality works correctly:
 * - Edit Layout button appears in header
 * - Clicking Edit Layout toggles edit mode
 * - Right drawer opens with Components tab when entering edit mode
 * - Components tab shows available widgets
 * - Widgets can be added and removed from dashboard
 */

test.describe('Edit Mode - Components Tab', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('habitarcade-dashboard');
    });

    // Navigate to the dashboard
    await page.goto('/');

    // Wait for the dashboard grid to load
    await page.waitForSelector('.layout', { timeout: 10000 });
  });

  test('Edit Layout button is visible in header', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');
    await expect(editButton).toBeVisible();
    await expect(editButton).toHaveText(/Edit Layout/);
  });

  test('clicking Edit Layout opens right drawer with Components tab', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');
    const drawer = page.getByTestId('right-drawer');

    // Drawer should initially be hidden
    await expect(drawer).toHaveClass(/translate-x-full/);

    // Click Edit Layout button
    await editButton.click();

    // Wait for drawer to open
    await expect(drawer).toHaveClass(/translate-x-0/);

    // Components tab should be visible and active
    const componentsTab = page.getByTestId('drawer-tab-components');
    await expect(componentsTab).toBeVisible();
    await expect(componentsTab).toHaveAttribute('aria-selected', 'true');

    // Components content should be visible
    const componentsContent = page.getByTestId('components-content');
    await expect(componentsContent).toBeVisible();
  });

  test('Edit Layout button shows "Done" when in edit mode', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');

    // Initially shows "Edit Layout"
    await expect(editButton).toHaveText(/Edit Layout/);

    // Click to enter edit mode
    await editButton.click();

    // Should now show "Done"
    await expect(editButton).toHaveText(/Done/);

    // Click again to exit edit mode
    await editButton.click();

    // Should show "Edit Layout" again
    await expect(editButton).toHaveText(/Edit Layout/);
  });

  test('Components tab shows active widgets from dashboard', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');

    // Enter edit mode
    await editButton.click();

    // Wait for components content
    const activeWidgetsList = page.getByTestId('active-widgets-list');
    await expect(activeWidgetsList).toBeVisible();

    // Check that default widgets are listed as active
    const habitMatrixCard = page.getByTestId('widget-card-habit-matrix');
    await expect(habitMatrixCard).toBeVisible();

    const weeklyKanbanCard = page.getByTestId('widget-card-weekly-kanban');
    await expect(weeklyKanbanCard).toBeVisible();
  });

  test('Components tab only visible when in edit mode', async ({ page }) => {
    const toggleButton = page.getByTestId('right-drawer-toggle');

    // Open drawer without entering edit mode
    await toggleButton.click();

    // Components tab should NOT be visible
    const componentsTab = page.getByTestId('drawer-tab-components');
    await expect(componentsTab).not.toBeVisible();

    // Close drawer
    await page.keyboard.press('Escape');

    // Now enter edit mode via Edit Layout button
    const editButton = page.getByTestId('edit-layout-button');
    await editButton.click();

    // Components tab should now be visible
    await expect(componentsTab).toBeVisible();
  });

  test('can remove widget from dashboard via Components tab', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');

    // Enter edit mode
    await editButton.click();

    // Find the remove button for a specific widget
    const removeButton = page.getByTestId('remove-widget-parking-lot');
    await expect(removeButton).toBeVisible();

    // Click remove
    await removeButton.click();

    // Widget card should now be in available widgets section
    const availableWidgetsList = page.getByTestId('available-widgets-list');
    await expect(availableWidgetsList).toBeVisible();

    // The parking-lot widget card should now have an add button instead
    const addButton = page.getByTestId('add-widget-parking-lot');
    await expect(addButton).toBeVisible();
  });

  test('can add widget back to dashboard via Components tab', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');

    // Enter edit mode
    await editButton.click();

    // First remove a widget
    const removeButton = page.getByTestId('remove-widget-parking-lot');
    await removeButton.click();

    // Now the add button should be visible
    const addButton = page.getByTestId('add-widget-parking-lot');
    await expect(addButton).toBeVisible();

    // Click add to restore the widget
    await addButton.click();

    // Should now have a remove button again
    const removeButtonAfterAdd = page.getByTestId('remove-widget-parking-lot');
    await expect(removeButtonAfterAdd).toBeVisible();
  });

  test('widget count is displayed correctly', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');

    // Enter edit mode
    await editButton.click();

    // Check for widget count text
    const componentsContent = page.getByTestId('components-content');
    const countText = componentsContent.locator('text=/\\d+ of \\d+ widgets active/');
    await expect(countText).toBeVisible();
  });

  test('edit mode indicator appears on dashboard when edit mode is active', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');

    // Enter edit mode
    await editButton.click();

    // Edit mode indicator should appear
    const editIndicator = page.locator('text=Edit Mode Active');
    await expect(editIndicator).toBeVisible();

    // Exit edit mode
    await editButton.click();

    // Indicator should disappear
    await expect(editIndicator).not.toBeVisible();
  });

  test('edit button has correct aria attributes', async ({ page }) => {
    const editButton = page.getByTestId('edit-layout-button');

    // Initially not pressed
    await expect(editButton).toHaveAttribute('aria-pressed', 'false');

    // Click to enter edit mode
    await editButton.click();

    // Should now be pressed
    await expect(editButton).toHaveAttribute('aria-pressed', 'true');
  });
});
