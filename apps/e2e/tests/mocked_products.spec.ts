import { test, expect } from '@playwright/test';

test.describe('Products Table (Fully Mocked)', () => {
    test('should display product list', async ({ page }) => {
        // 1. Mock the API call to localhost:3001
        await page.route('http://localhost:3001/api/products', async (route) => {
            console.log('Intercepted API call to /api/products');
            const json = {
                status: 'success',
                data: [
                    {
                        id: 1,
                        name: 'E2E Test Product',
                        sku: 'E2E-123',
                        status: 'draft',
                        batch_size: 1,
                        target_price: 100,
                        product_cost: 50,
                        pricing_method: 'price',
                        pricing_value: 100,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }
                ]
            };
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json
            });
        });

        // 2. Also mock the settings call since the app depends on it
        await page.route('http://localhost:3001/api/settings/user-settings', async (route) => {
            await route.fulfill({
                status: 200,
                json: {
                    status: 'success',
                    data: { currency: 'USD', units: [] }
                }
            });
        });

        // 3. Set dummy local storage to "bypass" login check in the UI
        await page.addInitScript(() => {
            window.localStorage.setItem('token', 'fake-jwt-token');
            window.localStorage.setItem('user', JSON.stringify({ id: 1, email: 'e2e@test.com' }));
        });

        // 4. Go directly to the products page
        await page.goto('/products');

        // 5. Verify the mocked data is visible
        // We increase timeout slightly for initial load
        const productName = page.getByText('E2E Test Product');
        await expect(productName).toBeVisible({ timeout: 10000 });

        const sku = page.getByText('E2E-123');
        await expect(sku).toBeVisible();

        // Check if table headers exist (using a broader selector)
        await expect(page.locator('table')).toContainText('Name');
    });
});
