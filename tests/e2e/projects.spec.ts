import { test, expect } from '@playwright/test';

test.describe('Projects E2E', () => {
  test('should create new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=New Project');
    await page.fill('[name="name"]', 'Test Project');
    await page.fill('[name="description"]', 'Test Description');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Project')).toBeVisible();
  });

  test('should update project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=Test Project');
    await page.click('button:has-text("Edit")');
    await page.fill('[name="name"]', 'Updated Project');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Updated Project')).toBeVisible();
  });

  test('should delete project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=Test Project');
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('text=Test Project')).not.toBeVisible();
  });
});
