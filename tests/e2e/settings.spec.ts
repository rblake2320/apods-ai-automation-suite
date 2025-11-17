import { test, expect } from '@playwright/test';

test.describe('Settings E2E', () => {
  test('should update user profile', async ({ page }) => {
    await page.goto('/settings');
    await page.fill('[name="name"]', 'Updated Name');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Profile updated')).toBeVisible();
  });

  test('should change theme', async ({ page }) => {
    await page.goto('/settings');
    await page.click('[aria-label="Toggle theme"]');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
