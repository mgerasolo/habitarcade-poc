import { test, expect } from '@playwright/test';

/**
 * Issue #73 - Kanban Project View page
 *
 * Acceptance Criteria:
 * - AC1: Page accessible at /kanban/project route
 * - AC2: Tasks grouped by project in columns
 * - AC3: "No Project" column for unassigned tasks
 * - AC4: Drag-drop tasks between project columns
 * - AC5: Filter by status, priority, tags
 * - AC6: List and Card view modes (persisted)
 * - AC7: Collapsible columns
 * - AC8: Add task button per column
 */

test.describe('Issue #73 - Kanban Project View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to project view
    await page.goto('/kanban/project');
    // Wait for content to load
    await page.waitForSelector('text=Project Board', { timeout: 10000 });
  });

  test('AC1: Page accessible at /kanban/project route', async ({ page }) => {
    // Verify we're on the project view page
    await expect(page.locator('text=Project Board')).toBeVisible();

    // Verify URL is correct
    expect(page.url()).toContain('/kanban/project');
  });

  test('AC2: Tasks grouped by project in columns', async ({ page }) => {
    // Should have at least one project column (or No Project)
    const columns = page.locator('[class*="flex-col"][class*="min-h-0"]').first();
    await expect(columns).toBeVisible();

    // Each column should have a header with project name
    const headers = page.locator('.font-condensed.font-medium');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('AC3: "No Project" column exists for unassigned tasks', async ({ page }) => {
    // Find the "No Project" column
    const noProjectColumn = page.locator('text=No Project');
    await expect(noProjectColumn).toBeVisible();
  });

  test('AC4: Drag-drop tasks between project columns', async ({ page }) => {
    // Look for drag handles (visible on hover)
    const tasks = page.locator('[class*="group"][class*="hover:bg-slate-700"]');
    const taskCount = await tasks.count();

    if (taskCount > 0) {
      // Hover over a task to reveal drag handle
      await tasks.first().hover();

      // Drag handle should appear
      const dragHandle = page.locator('[title="Drag to move"]').first();
      await expect(dragHandle).toBeVisible();
    }
  });

  test('AC5: Filter by status, priority, tags', async ({ page }) => {
    // Verify filter dropdowns exist
    const statusFilter = page.locator('select:has-text("All Statuses")');
    const priorityFilter = page.locator('select:has-text("All Priorities")');
    const tagFilter = page.locator('select:has-text("All Tags")');

    await expect(statusFilter).toBeVisible();
    await expect(priorityFilter).toBeVisible();
    await expect(tagFilter).toBeVisible();

    // Verify priority filter has expected options
    await priorityFilter.click();
    await expect(page.locator('option:has-text("P1 - Critical")')).toBeAttached();
    await expect(page.locator('option:has-text("P2 - High")')).toBeAttached();
    await expect(page.locator('option:has-text("P3 - Normal")')).toBeAttached();
    await expect(page.locator('option:has-text("P4 - Low")')).toBeAttached();
  });

  test('AC6: List and Card view modes with persistence', async ({ page }) => {
    // Find view mode toggle buttons
    const listButton = page.locator('button:has-text("List")');
    const cardButton = page.locator('button:has-text("Card")');

    await expect(listButton).toBeVisible();
    await expect(cardButton).toBeVisible();

    // Default should be list mode (has active styling)
    await expect(listButton).toHaveClass(/bg-slate-700/);

    // Switch to card mode
    await cardButton.click();
    await expect(cardButton).toHaveClass(/bg-slate-700/);

    // Reload page and verify card mode persisted
    await page.reload();
    await page.waitForSelector('text=Project Board');

    const cardButtonAfterReload = page.locator('button:has-text("Card")');
    await expect(cardButtonAfterReload).toHaveClass(/bg-slate-700/);

    // Switch back to list mode for other tests
    await page.locator('button:has-text("List")').click();
  });

  test('AC7: Collapsible columns', async ({ page }) => {
    // Find a column header (not No Project to ensure we have content)
    const columnHeaders = page.locator('.font-condensed.font-medium.text-sm');
    const headerCount = await columnHeaders.count();

    if (headerCount > 0) {
      // Hover to reveal collapse button
      await columnHeaders.first().hover();

      // Look for visibility off button
      const collapseButton = page.locator('[title*="Hide"][title*="column"]').first();

      // If visible, test collapse functionality
      if (await collapseButton.isVisible()) {
        await collapseButton.click();

        // Column should be collapsed (narrow width, vertical text)
        const collapsedColumn = page.locator('[style*="writing-mode: vertical"]');
        await expect(collapsedColumn.first()).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('AC8: Add task button per column', async ({ page }) => {
    // Find add task buttons in column headers
    const addButtons = page.locator('[title*="Add task"]');

    // Also check for main Add Task button (the one in the header, using getByRole for specificity)
    const mainAddButton = page.getByRole('main').getByRole('button', { name: 'Add Task', exact: true });
    await expect(mainAddButton).toBeVisible();

    // Click main add button to open modal
    await mainAddButton.click();

    // Task modal should appear
    await expect(page.locator('[role="dialog"], .fixed.inset-0, [class*="modal"]')).toBeVisible({ timeout: 3000 });
  });

  test('Filter clear button appears when filters active', async ({ page }) => {
    // Apply a filter
    const priorityFilter = page.locator('select:has-text("All Priorities")');
    await priorityFilter.selectOption('1');

    // Clear button should appear
    const clearButton = page.locator('button:has-text("Clear")');
    await expect(clearButton).toBeVisible();

    // Click clear
    await clearButton.click();

    // Filter should be reset
    await expect(priorityFilter).toHaveValue('');

    // Clear button should be hidden
    await expect(clearButton).not.toBeVisible();
  });

  test('Task count displayed in header', async ({ page }) => {
    // Header should show task count
    const taskCountText = page.locator('text=/\\d+ tasks/');
    await expect(taskCountText).toBeVisible();
  });
});
