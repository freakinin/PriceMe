import { test, expect } from '@playwright/test';

test.describe('Sales Tracking', () => {
    test.beforeEach(async ({ page }) => {
        // Mock Settings
        await page.route('**/api/settings', async (route) => {
            await route.fulfill({
                status: 200,
                json: { status: 'success', data: { currency: 'USD', units: ['pcs'] } }
            });
        });

        // Mock Products (One product on sale)
        await page.route('**/api/products', async (route) => {
            await route.fulfill({
                status: 200,
                json: {
                    status: 'success',
                    data: [
                        {
                            id: 1,
                            name: 'Handmade Vase',
                            sku: 'VASE-001',
                            status: 'on_sale',
                            target_price: 50,
                            product_cost: 20,
                            batch_size: 10,
                            pricing_method: 'price',
                            pricing_value: 50,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        }
                    ]
                }
            });
        });

        // Mock Sales (Initially empty)
        await page.route('**/api/sales?*', async (route) => {
            await route.fulfill({
                status: 200,
                json: { status: 'success', data: [] }
            });
        });

        // Pre-authenticate with a token structure that passes simple decoding checks
        await page.addInitScript(() => {
            // Payload: {"userId":1,"email":"e2e@test.com"} -> eyJ1c2VySWQiOjEsImVtYWlsIjoiZTJlQHRlc3QuY29tIn0=
            const fakeToken = 'header.eyJ1c2VySWQiOjEsImVtYWlsIjoiZTJlQHRlc3QuY29tIn0=.signature';
            window.localStorage.setItem('token', fakeToken);
            window.localStorage.setItem('user', JSON.stringify({ id: 1, email: 'e2e@test.com' }));
        });
    });

    test('should record a new sale', async ({ page }) => {
        // Mock the Create Sale POST request
        let createSalePayload: any = null;
        await page.route('**/api/sales', async (route) => {
            if (route.request().method() === 'POST') {
                createSalePayload = route.request().postDataJSON();
                await route.fulfill({
                    status: 201,
                    json: {
                        status: 'success',
                        data: {
                            id: 101,
                            ...createSalePayload,
                            sale_date: new Date().toISOString(),
                            created_at: new Date().toISOString()
                        }
                    }
                });
            } else {
                await route.fallback();
            }
        });

        // Go to On Sale page
        await page.goto('/on-sale');

        // Verify product is listed
        await expect(page.getByText('Handmade Vase')).toBeVisible();

        // Click Record Sale button (plus icon)
        // We use a specific selector to find the button within the row
        const recordBtn = page.locator('button[title="Record Sale"]');
        await expect(recordBtn).toBeVisible();
        await recordBtn.click();

        // Verify Dialog opens
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Record a new sale for Handmade Vase')).toBeVisible();

        // Fill form
        await page.locator('input[name="quantity"]').fill('2');
        // Unit price should be pre-filled with 50, let's keep it

        // Select Platform
        await page.getByRole('combobox').click();
        await page.getByLabel('Etsy').click();

        // Submit
        await page.getByRole('button', { name: 'Record Sale' }).click();

        // Verify payload was sent correctly
        expect(createSalePayload).toBeTruthy();
        expect(createSalePayload.product_id).toBe(1);
        expect(createSalePayload.quantity).toBe(2);
        expect(createSalePayload.unit_price).toBe(50);
        expect(createSalePayload.platform).toBe('Etsy');

        // Dialog should close
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });
});
