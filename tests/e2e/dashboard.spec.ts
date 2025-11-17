import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test('should display dashboard stats', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('text=Active Tasks')).toBeVisible();
    await expect(page.locator('text=Projects')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
  });

  test('should navigate to projects from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('text=View Projects');
    await expect(page).toHaveURL('/projects');
  });
});
