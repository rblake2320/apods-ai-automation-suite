import { test, expect } from '@playwright/test';

test.describe('Automation E2E', () => {
  test('should create automation task', async ({ page }) => {
    await page.goto('/automation');
    await page.click('text=New Task');
    await page.fill('[name="name"]', 'Test Task');
    await page.fill('[name="description"]', 'Test automation task');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should execute automation task', async ({ page }) => {
    await page.goto('/automation');
    await page.click('button:has-text("Run")');
    await expect(page.locator('text=running')).toBeVisible();
  });

  test('should stop automation task', async ({ page }) => {
    await page.goto('/automation');
    await page.click('button:has-text("Stop")');
    await expect(page.locator('text=idle')).toBeVisible();
  });
});
