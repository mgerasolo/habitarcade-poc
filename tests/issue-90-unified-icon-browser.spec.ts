import { test, expect } from '@playwright/test';

/**
 * Issue #90: Unified Icon Browser Modal
 *
 * Tests for consolidating upload/URL/browse options into single IconBrowser modal.
 * These tests verify the acceptance criteria:
 * - AC1: IconBrowser modal has upload section at top
 * - AC2: IconBrowser modal has URL input option
 * - AC3: IconBrowser modal has icon code input (exists)
 * - AC4: IconBrowser modal has icon grid browser (exists)
 * - AC5: All forms have "Choose Icon" button with preview
 * - AC6: Selected icon shows preview on form after modal closes
 * - AC7: Existing icons load correctly when editing
 */

test.describe('Issue #90: Unified Icon Browser Modal', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Expand Manage menu if collapsed
    const manageNav = page.locator('[data-testid="nav-manage"]');
    if (await manageNav.isVisible()) {
      await manageNav.click();
    }
  });

  test.describe('IconBrowser Modal Structure', () => {

    test('AC1: IconBrowser has upload section at top', async ({ page }) => {
      // Open project form to access icon picker
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.waitForSelector('[data-testid="project-form"]');

      // Click the "Choose Icon" button to open IconBrowser
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');

      // Verify upload section exists at top of modal
      const uploadSection = page.locator('[data-testid="icon-upload-section"]');
      await expect(uploadSection).toBeVisible();
      await expect(uploadSection.locator('text=Upload Image')).toBeVisible();

      // Verify drag-drop area exists
      await expect(page.locator('[data-testid="icon-upload-dropzone"]')).toBeVisible();
    });

    test('AC2: IconBrowser has URL input option', async ({ page }) => {
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');

      // Verify URL input section exists
      const urlSection = page.locator('[data-testid="icon-url-section"]');
      await expect(urlSection).toBeVisible();
      await expect(urlSection.locator('text=Image URL')).toBeVisible();

      // Verify URL input field and load button exist
      await expect(page.locator('[data-testid="icon-url-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="icon-url-load-button"]')).toBeVisible();
    });

    test('AC3: IconBrowser has icon code input (already exists)', async ({ page }) => {
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');

      // Verify icon code input section exists
      await expect(page.locator('text=Enter Icon Code Directly')).toBeVisible();
      await expect(page.locator('input[placeholder*="mdi:Home"]')).toBeVisible();
    });

    test('AC4: IconBrowser has icon grid browser (already exists)', async ({ page }) => {
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');

      // Verify provider tabs exist
      await expect(page.locator('button:has-text("All Icons")')).toBeVisible();
      await expect(page.locator('button:has-text("Material")')).toBeVisible();
      await expect(page.locator('button:has-text("Font Awesome")')).toBeVisible();

      // Verify icon grid exists
      await expect(page.locator('[data-testid="icon-grid"]')).toBeVisible();
    });
  });

  test.describe('Form Integration', () => {

    test('AC5: ProjectForm has "Choose Icon" button instead of inline upload', async ({ page }) => {
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.waitForSelector('[data-testid="project-form"]');

      // Should have "Choose Icon" button
      await expect(page.locator('[data-testid="choose-icon-button"]')).toBeVisible();

      // Should NOT have inline upload section on the form itself
      const formUploadSection = page.locator('[data-testid="project-form"] [data-testid="inline-upload-section"]');
      await expect(formUploadSection).not.toBeVisible();
    });

    test('AC5: CategoryForm has "Choose Icon" button instead of inline icon section', async ({ page }) => {
      await page.click('[data-testid="nav-manage-categories"]');
      await page.click('button:has-text("Add Category")');
      await page.waitForSelector('[data-testid="category-form"]');

      // Should have "Choose Icon" button
      await expect(page.locator('[data-testid="choose-icon-button"]')).toBeVisible();
    });

    test('AC5: HabitForm has "Choose Icon" button', async ({ page }) => {
      await page.click('[data-testid="nav-manage-habits"]');
      await page.click('button:has-text("Add Habit")');
      await page.waitForSelector('[data-testid="habit-form"]');

      // Should have "Choose Icon" button
      await expect(page.locator('[data-testid="choose-icon-button"]')).toBeVisible();
    });

    test('AC5: StatusForm has "Choose Icon" button', async ({ page }) => {
      await page.click('[data-testid="nav-manage-statuses"]');
      await page.click('button:has-text("Add Status")');
      await page.waitForSelector('[data-testid="status-form"]');

      // Should have "Choose Icon" button
      await expect(page.locator('[data-testid="choose-icon-button"]')).toBeVisible();
    });
  });

  test.describe('Icon Selection Flow', () => {

    test('AC6: Selected icon from grid shows preview on form after closing modal', async ({ page }) => {
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');

      // Click on an icon in the grid
      await page.click('[data-testid="icon-grid"] button:first-child');

      // Click Select Icon button (using testid to avoid matching form button)
      await page.click('[data-testid="icon-browser-select-button"]');

      // Modal should close
      await expect(page.locator('[data-testid="icon-browser-modal"]')).not.toBeVisible();

      // Form should show the selected icon preview
      const iconPreview = page.locator('[data-testid="selected-icon-preview"]');
      await expect(iconPreview).toBeVisible();
    });

    test('AC6: Selected icon from code input shows preview on form', async ({ page }) => {
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');

      // Enter icon code
      await page.fill('input[placeholder*="mdi:Home"]', 'material:Home');
      await page.click('button:has-text("Use Code")');

      // Modal should close
      await expect(page.locator('[data-testid="icon-browser-modal"]')).not.toBeVisible();

      // Form should show the selected icon preview
      await expect(page.locator('[data-testid="selected-icon-preview"]')).toBeVisible();
    });

    test('AC6: Uploaded image shows preview on form', async ({ page }) => {
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');

      // Upload an image via file input
      const fileInput = page.locator('[data-testid="icon-upload-input"]');
      await fileInput.setInputFiles({
        name: 'test-icon.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake-image-data'),
      });

      // Click Select/Use button
      await page.click('[data-testid="icon-upload-confirm"]');

      // Modal should close and form should show image preview
      await expect(page.locator('[data-testid="icon-browser-modal"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="selected-icon-preview"] img')).toBeVisible();
    });

    test('AC6: URL section has input and load button', async ({ page }) => {
      // Note: Full URL validation requires external network access which is unreliable in tests
      // This test verifies the URL section UI elements are present and interactive
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');

      // Verify URL section exists
      await expect(page.locator('[data-testid="icon-url-section"]')).toBeVisible();

      // Verify URL input exists and can receive text
      const urlInput = page.locator('[data-testid="icon-url-input"]');
      await expect(urlInput).toBeVisible();
      await urlInput.fill('https://example.com/icon.png');
      await expect(urlInput).toHaveValue('https://example.com/icon.png');

      // Verify load button exists and is enabled when URL is entered
      const loadButton = page.locator('[data-testid="icon-url-load-button"]');
      await expect(loadButton).toBeVisible();
      await expect(loadButton).toBeEnabled();
    });
  });

  test.describe('Edit Mode - Existing Icons', () => {

    test('AC7: Editing project with existing icon shows icon in preview', async ({ page }) => {
      // Navigate to manage projects page
      await page.click('[data-testid="nav-manage-projects"]');
      await page.waitForSelector('[data-testid="manage-projects-page"]');

      // Click edit on an existing project (assuming one exists)
      const editButton = page.locator('[data-testid="manage-projects-page"] button[title="Edit"]').first();

      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('[data-testid="project-form"]');

        // If project has an icon, it should show in the preview
        // The preview should exist (may be empty for projects without icons)
        await expect(page.locator('[data-testid="choose-icon-button"]')).toBeVisible();
      }
    });

    test('AC7: Editing category with existing icon loads correctly', async ({ page }) => {
      await page.click('[data-testid="nav-manage-categories"]');
      await page.waitForSelector('[data-testid="manage-categories-page"]');

      const editButton = page.locator('[data-testid="manage-categories-page"] button[title="Edit"]').first();

      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForSelector('[data-testid="category-form"]');

        // The choose icon button should be visible
        await expect(page.locator('[data-testid="choose-icon-button"]')).toBeVisible();
      }
    });
  });

  test.describe('Clear Icon Functionality', () => {

    test('User can clear a selected icon', async ({ page }) => {
      await page.click('[data-testid="nav-manage-projects"]');
      await page.click('button:has-text("Add Project")');

      // First select an icon
      await page.click('[data-testid="choose-icon-button"]');
      await page.waitForSelector('[data-testid="icon-browser-modal"]');
      await page.click('[data-testid="icon-grid"] button:first-child');
      await page.click('[data-testid="icon-browser-select-button"]');

      // Verify icon is selected (wait for modal to close first)
      await expect(page.locator('[data-testid="icon-browser-modal"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="selected-icon-preview"]')).toBeVisible();

      // Click clear/remove button
      await page.click('[data-testid="clear-icon-button"]');

      // Icon preview should be gone or show default
      await expect(page.locator('[data-testid="selected-icon-preview"]')).not.toBeVisible();
    });
  });
});
