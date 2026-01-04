import { sql } from '@vercel/postgres';

export const db = sql;

// Database initialization function
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create user_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        currency VARCHAR(3) DEFAULT 'USD',
        units TEXT[] DEFAULT ARRAY['ml', 'pcs', 'g', 'oz', 'lb', 'kg']::TEXT[],
        tax_percentage DECIMAL(5, 2) DEFAULT 0,
        revenue_goal DECIMAL(12, 2),
        labor_hourly_cost DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Add new columns to user_settings if they don't exist
    try {
      // Check and add tax_percentage
      const taxExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_settings' AND column_name='tax_percentage'
      `;
      const taxRows = Array.isArray(taxExists) ? taxExists : taxExists.rows || [];
      if (taxRows.length === 0) {
        console.log('Adding tax_percentage column to user_settings table...');
        await sql`ALTER TABLE user_settings ADD COLUMN tax_percentage DECIMAL(5, 2) DEFAULT 0`;
        console.log('✅ Added tax_percentage column');
      }

      // Check and add revenue_goal
      const revenueExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_settings' AND column_name='revenue_goal'
      `;
      const revenueRows = Array.isArray(revenueExists) ? revenueExists : revenueExists.rows || [];
      if (revenueRows.length === 0) {
        console.log('Adding revenue_goal column to user_settings table...');
        await sql`ALTER TABLE user_settings ADD COLUMN revenue_goal DECIMAL(12, 2)`;
        console.log('✅ Added revenue_goal column');
      }

      // Check and add labor_hourly_cost
      const laborExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_settings' AND column_name='labor_hourly_cost'
      `;
      const laborRows = Array.isArray(laborExists) ? laborExists : laborExists.rows || [];
      if (laborRows.length === 0) {
        console.log('Adding labor_hourly_cost column to user_settings table...');
        await sql`ALTER TABLE user_settings ADD COLUMN labor_hourly_cost DECIMAL(10, 2)`;
        console.log('✅ Added labor_hourly_cost column');
      }
    } catch (error: any) {
      console.error('Error adding columns to user_settings table:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        description TEXT,
        category VARCHAR(100),
        batch_size INTEGER DEFAULT 1,
        target_price DECIMAL(10, 2),
        markup_percentage DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Add missing columns if they don't exist (for existing tables)
    // PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN, so we check first
    try {
      // Check and add sku column
      const skuExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='sku'
      `;
      const skuRows = Array.isArray(skuExists) ? skuExists : skuExists.rows || [];
      if (skuRows.length === 0) {
        console.log('Adding sku column to products table...');
        await sql`ALTER TABLE products ADD COLUMN sku VARCHAR(100)`;
        console.log('✅ Added sku column');
      }

      // Check and add description column
      const descriptionExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='description'
      `;
      const descriptionRows = Array.isArray(descriptionExists) ? descriptionExists : descriptionExists.rows || [];
      if (descriptionRows.length === 0) {
        console.log('Adding description column to products table...');
        await sql`ALTER TABLE products ADD COLUMN description TEXT`;
        console.log('✅ Added description column');
      }

      // Check and add category column
      const categoryExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='category'
      `;
      const categoryRows = Array.isArray(categoryExists) ? categoryExists : categoryExists.rows || [];
      if (categoryRows.length === 0) {
        console.log('Adding category column to products table...');
        await sql`ALTER TABLE products ADD COLUMN category VARCHAR(100)`;
        console.log('✅ Added category column');
      }

      // Check and add batch_size column
      const batchSizeExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='batch_size'
      `;
      const batchSizeRows = Array.isArray(batchSizeExists) ? batchSizeExists : batchSizeExists.rows || [];
      if (batchSizeRows.length === 0) {
        console.log('Adding batch_size column to products table...');
        await sql`ALTER TABLE products ADD COLUMN batch_size INTEGER DEFAULT 1`;
        console.log('✅ Added batch_size column');
      }

      // Check and add target_price column
      const targetPriceExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='target_price'
      `;
      const targetPriceRows = Array.isArray(targetPriceExists) ? targetPriceExists : targetPriceExists.rows || [];
      if (targetPriceRows.length === 0) {
        console.log('Adding target_price column to products table...');
        await sql`ALTER TABLE products ADD COLUMN target_price DECIMAL(10, 2)`;
        console.log('✅ Added target_price column');
      }

      // Check and add markup_percentage column
      const markupExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='markup_percentage'
      `;
      const markupRows = Array.isArray(markupExists) ? markupExists : markupExists.rows || [];
      if (markupRows.length === 0) {
        console.log('Adding markup_percentage column to products table...');
        await sql`ALTER TABLE products ADD COLUMN markup_percentage DECIMAL(5, 2)`;
        console.log('✅ Added markup_percentage column');
      }
    } catch (error: any) {
      // Columns might already exist or table might not exist yet
      console.log('Note: Migration check for products table columns:', error.message);
    }

    // Create materials table
    await sql`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 4) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        price_per_unit DECIMAL(10, 4) NOT NULL,
        total_cost DECIMAL(10, 4) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create labor_costs table
    await sql`
      CREATE TABLE IF NOT EXISTS labor_costs (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        activity VARCHAR(255) NOT NULL,
        time_spent_minutes INTEGER NOT NULL,
        hourly_rate DECIMAL(10, 4) NOT NULL,
        total_cost DECIMAL(10, 4) NOT NULL,
        per_unit BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create other_costs table
    await sql`
      CREATE TABLE IF NOT EXISTS other_costs (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        item VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 4) NOT NULL,
        cost DECIMAL(10, 4) NOT NULL,
        total_cost DECIMAL(10, 4) NOT NULL,
        per_unit BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create pricing_data table
    await sql`
      CREATE TABLE IF NOT EXISTS pricing_data (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        price DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'USD',
        calculation_method VARCHAR(50),
        calculation_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}
