import { test as base, expect } from '@playwright/test';

// We extend the base test to automatically handle authentication
export const test = base.extend({
    // This fixture will run before every test that uses it
    authenticatedPage: async ({ page }, use) => {
        // 1. Go to the app to set the correct origin
        await page.goto('/');

        // 2. Inject the auth token and user info into LocalStorage
        // Note: In a real app, you would probably get this token from a global setup step
        // For now, we are simulating a logged-in state manually.
        await page.evaluate(() => {
            const dummyUser = { id: 1, email: 'e2e@test.com', name: 'E2E Tester' };
            const dummyToken = 'dummy-token-for-testing'; // In production, use a real signed JWT

            localStorage.setItem('token', dummyToken);
            localStorage.setItem('user', JSON.stringify(dummyUser));
        });

        // 3. Reload or navigate to ensure the app picks up the token
        await page.goto('/products');

        // Pass the page to the test
        await use(page);
    },
});

export { expect };
