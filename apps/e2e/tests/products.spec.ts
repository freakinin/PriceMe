import { test, expect } from './fixtures';

test.describe('Products Management', () => {
    test('should view products list without logging in', async ({ authenticatedPage: page }) => {
        // We are already on /products thanks to the fixture

        // Check for the "Products" table or header
        // The fixture handles the "skip login" part.
        await expect(page.locator('h1, h2')).toContainText(/Products|Dashboard/i);

        // Verify the "Add Product" button exists
        const addProductBtn = page.locator('button:has-text("Product"), button:has(.lucide-plus)');
        await expect(addProductBtn).toBeVisible();
    });

    test('should see the table headers', async ({ authenticatedPage: page }) => {
        // Check if common table headers are present
        await expect(page.getByText('Name')).toBeVisible();
        await expect(page.getByText('Status')).toBeVisible();
        await expect(page.getByText('Cost')).toBeVisible();
    });
});
