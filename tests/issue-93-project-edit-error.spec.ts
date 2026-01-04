import { test, expect } from '@playwright/test';

/**
 * Issue #93: Bug - Editing projects returns Internal Server Error
 *
 * Tests for verifying project edit functionality works correctly.
 * The bug occurs when:
 * - User opens Edit Project modal
 * - User clicks "Save Changes"
 * - API returns 500 Internal Server Error
 *
 * Root cause: Database schema mismatch - new fields (categoryId, startDate, targetDate)
 * were added to the API but may not exist in the database.
 *
 * Success Criteria:
 * - AC1: Editing an existing project does not produce errors
 * - AC2: Creating a new project works without errors
 * - AC3: All project fields save correctly (name, category, dates, colors, icons)
 */

test.describe('Issue #93: Project Edit Error', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Expand Manage menu if collapsed
    const manageNav = page.locator('[data-testid="nav-manage"]');
    if (await manageNav.isVisible()) {
      await manageNav.click();
    }
  });

  test.describe('Project Edit Functionality', () => {

    test('AC1: Editing an existing project saves without error', async ({ page }) => {
      // Navigate to manage projects page
      await page.click('[data-testid="nav-manage-projects"]');
      await page.waitForSelector('[data-testid="manage-projects-page"]');

      // Find an existing project to edit
      const editButton = page.locator('[data-testid="manage-projects-page"] button[title="Edit"]').first();

      // Skip if no projects exist
      if (!(await editButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip();
        return;
      }

      // Click edit button to open form
      await editButton.click();
      await page.waitForSelector('[data-testid="project-form"]');

      // Make a small change to the name (append/remove space)
      const nameInput = page.locator('[data-testid="project-form"] input[type="text"]').first();
      const currentName = await nameInput.inputValue();
      await nameInput.fill(currentName.trim() + ' ');
      await nameInput.fill(currentName.trim()); // Revert to trigger change detection

      // Click Save Changes button
      await page.click('button:has-text("Save Changes")');

      // Wait for potential error or success
      await page.waitForTimeout(1000);

      // Should NOT show "Internal server error" toast
      const errorToast = page.locator('text=Internal server error');
      await expect(errorToast).not.toBeVisible({ timeout: 2000 });

      // Modal should close on success
      await expect(page.locator('[data-testid="project-form"]')).not.toBeVisible({ timeout: 5000 });

      // Should show success toast
      const successToast = page.locator('text=Project updated successfully');
      await expect(successToast).toBeVisible({ timeout: 3000 });
    });

    test('AC2: Creating a new project works without error', async ({ page }) => {
      // Navigate to manage projects page
      await page.click('[data-testid="nav-manage-projects"]');
      await page.waitForSelector('[data-testid="manage-projects-page"]');

      // Click Add Project button
      await page.click('button:has-text("Add Project")');
      await page.waitForSelector('[data-testid="project-form"]');

      // Fill in project name (required field)
      const nameInput = page.locator('[data-testid="project-form"] input[type="text"]').first();
      await nameInput.fill(`Test Project ${Date.now()}`);

      // Click Create Project button
      await page.click('button:has-text("Create Project")');

      // Wait for potential error or success
      await page.waitForTimeout(1000);

      // Should NOT show error toast
      const errorToast = page.locator('text=Internal server error');
      await expect(errorToast).not.toBeVisible({ timeout: 2000 });

      // Modal should close on success
      await expect(page.locator('[data-testid="project-form"]')).not.toBeVisible({ timeout: 5000 });

      // Should show success toast
      const successToast = page.locator('text=Project created successfully');
      await expect(successToast).toBeVisible({ timeout: 3000 });
    });

    test('AC3: Editing project with all fields saves correctly', async ({ page }) => {
      // Navigate to manage projects page
      await page.click('[data-testid="nav-manage-projects"]');
      await page.waitForSelector('[data-testid="manage-projects-page"]');

      // Find an existing project to edit
      const editButton = page.locator('[data-testid="manage-projects-page"] button[title="Edit"]').first();

      // Skip if no projects exist
      if (!(await editButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip();
        return;
      }

      // Click edit button to open form
      await editButton.click();
      await page.waitForSelector('[data-testid="project-form"]');

      // Update multiple fields to test all work correctly
      const nameInput = page.locator('[data-testid="project-form"] input[type="text"]').first();
      const uniqueName = `Updated Project ${Date.now()}`;
      await nameInput.fill(uniqueName);

      // Update description
      const descriptionInput = page.locator('[data-testid="project-form"] textarea');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('Updated description for testing');
      }

      // Set a target date if date input exists
      const targetDateInput = page.locator('input[type="date"]').last();
      if (await targetDateInput.isVisible()) {
        await targetDateInput.fill('2026-12-31');
      }

      // Select a color if color picker exists
      const colorButton = page.locator('[data-testid="project-form"] button[style*="background-color"]').first();
      if (await colorButton.isVisible()) {
        await colorButton.click();
      }

      // Click Save Changes button
      await page.click('button:has-text("Save Changes")');

      // Wait for potential error or success
      await page.waitForTimeout(1000);

      // Should NOT show "Internal server error" toast
      const errorToast = page.locator('text=Internal server error');
      await expect(errorToast).not.toBeVisible({ timeout: 2000 });

      // Modal should close on success
      await expect(page.locator('[data-testid="project-form"]')).not.toBeVisible({ timeout: 5000 });

      // Should show success toast
      const successToast = page.locator('text=Project updated successfully');
      await expect(successToast).toBeVisible({ timeout: 3000 });

      // Verify the change persisted by checking the project list
      await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('API Response Validation', () => {

    test('PUT /api/projects/:id returns 200 (not 500)', async ({ page, request }) => {
      // Navigate to get list of projects
      await page.click('[data-testid="nav-manage-projects"]');
      await page.waitForSelector('[data-testid="manage-projects-page"]');

      // Make direct API call to fetch projects
      const projectsResponse = await request.get('/api/projects');
      const projectsData = await projectsResponse.json();

      // Skip if no projects
      if (!projectsData.data || projectsData.data.length === 0) {
        test.skip();
        return;
      }

      const projectId = projectsData.data[0].id;
      const projectName = projectsData.data[0].name;

      // Attempt to update the project via API
      const updateResponse = await request.put(`/api/projects/${projectId}`, {
        data: {
          name: projectName,
          description: 'API test update',
        },
      });

      // Should return 200, not 500
      expect(updateResponse.status()).toBe(200);

      // Response should contain data
      const updateData = await updateResponse.json();
      expect(updateData.data).toBeDefined();
      expect(updateData.data.name).toBe(projectName);
    });

    test('POST /api/projects returns 201 (not 500)', async ({ request }) => {
      // Attempt to create project via API
      const createResponse = await request.post('/api/projects', {
        data: {
          name: `API Test Project ${Date.now()}`,
          description: 'Created via API test',
        },
      });

      // Should return 201, not 500
      expect(createResponse.status()).toBe(201);

      // Response should contain data
      const createData = await createResponse.json();
      expect(createData.data).toBeDefined();
      expect(createData.data.id).toBeDefined();
    });
  });
});
