import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
// Also try to load from .env if .env.local doesn't exist or is empty (standard practice)
dotenv.config();

async function createVariantsTables() {
    console.log('Creating product_variants and variant_attributes tables...');

    try {
        // Create product_variants table
        await sql`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        price_override DECIMAL(10, 2),
        cost_override DECIMAL(10, 2),
        stock_level INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        console.log('✅ Created product_variants table');

        // Create variant_attributes table
        await sql`
      CREATE TABLE IF NOT EXISTS variant_attributes (
        id SERIAL PRIMARY KEY,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
        attribute_name VARCHAR(50) NOT NULL,
        attribute_value VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(variant_id, attribute_name)
      );
    `;
        console.log('✅ Created variant_attributes table');

        console.log('Database schema updated successfully.');
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

createVariantsTables();
