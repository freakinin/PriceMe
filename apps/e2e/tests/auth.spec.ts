import { test, expect } from '@playwright/test';

test.describe('Initial App Load', () => {
    test('should show signup page', async ({ page }) => {
        // Navigate to signup page
        await page.goto('/signup');

        // Check if the title is correct
        await expect(page.locator('h1, .text-2xl')).toContainText('Sign Up');

        // Check if the email input is visible
        await expect(page.getByLabel('Email')).toBeVisible();

        // Check if there is a link to login
        const loginLink = page.getByRole('link', { name: 'Login' });
        await expect(loginLink).toBeVisible();
        await expect(loginLink).toHaveAttribute('href', '/login');
    });

    test('should show login page', async ({ page }) => {
        // Navigate to login page
        await page.goto('/login');

        // Check if the title is correct
        await expect(page.locator('h1, .text-2xl')).toContainText('Login');

        // Check if we have an email and password field
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
    });
});
