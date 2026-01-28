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
        units TEXT[] DEFAULT ARRAY['ml', 'L', 'fl oz', 'pt', 'qt', 'gal', 'g', 'kg', 'oz', 'lb', 'mm', 'cm', 'm', 'in', 'ft', 'yd', 'm²', 'ft²', 'pcs', 'piece', 'unit', 'set', 'pack', 'box', 'roll', 'sheet', 'yard']::TEXT[],
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

      // Check and add unit_system
      const unitSystemExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_settings' AND column_name='unit_system'
      `;
      const unitSystemRows = Array.isArray(unitSystemExists) ? unitSystemExists : unitSystemExists.rows || [];
      if (unitSystemRows.length === 0) {
        console.log('Adding unit_system column to user_settings table...');
        await sql`ALTER TABLE user_settings ADD COLUMN unit_system VARCHAR(10) DEFAULT 'metric'`;
        console.log('✅ Added unit_system column');
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

      // Check and add status column
      const statusExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='status'
      `;
      const statusRows = Array.isArray(statusExists) ? statusExists : statusExists.rows || [];
      if (statusRows.length === 0) {
        console.log('Adding status column to products table...');
        await sql`ALTER TABLE products ADD COLUMN status VARCHAR(20) DEFAULT 'draft'`;
        console.log('✅ Added status column');
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

      // Check and add pricing_method column
      const pricingMethodExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='pricing_method'
      `;
      const pricingMethodRows = Array.isArray(pricingMethodExists) ? pricingMethodExists : pricingMethodExists.rows || [];
      if (pricingMethodRows.length === 0) {
        console.log('Adding pricing_method column to products table...');
        await sql`ALTER TABLE products ADD COLUMN pricing_method VARCHAR(20)`;
        console.log('✅ Added pricing_method column');
      }

      // Check and add pricing_value column
      const pricingValueExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='pricing_value'
      `;
      const pricingValueRows = Array.isArray(pricingValueExists) ? pricingValueExists : pricingValueExists.rows || [];
      if (pricingValueRows.length === 0) {
        console.log('Adding pricing_value column to products table...');
        await sql`ALTER TABLE products ADD COLUMN pricing_value DECIMAL(10, 4)`;
        console.log('✅ Added pricing_value column');
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
        user_material_id INTEGER REFERENCES user_materials(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 4) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        price_per_unit DECIMAL(10, 4) NOT NULL,
        total_cost DECIMAL(10, 4) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Add user_material_id column if it doesn't exist (migration)
    try {
      const userMaterialIdExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='materials' AND column_name='user_material_id'
      `;
      const userMaterialIdRows = Array.isArray(userMaterialIdExists) ? userMaterialIdExists : userMaterialIdExists.rows || [];
      if (userMaterialIdRows.length === 0) {
        console.log('Adding user_material_id column to materials table...');
        await sql`ALTER TABLE materials ADD COLUMN user_material_id INTEGER REFERENCES user_materials(id) ON DELETE SET NULL`;
        console.log('✅ Added user_material_id column');
      }

      // Add units_made column if it doesn't exist (migration)
      const unitsMadeExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='materials' AND column_name='units_made'
      `;
      const unitsMadeRows = Array.isArray(unitsMadeExists) ? unitsMadeExists : unitsMadeExists.rows || [];
      if (unitsMadeRows.length === 0) {
        console.log('Adding units_made column to materials table...');
        await sql`ALTER TABLE materials ADD COLUMN units_made DECIMAL(10, 4) DEFAULT 1`;
        console.log('✅ Added units_made column');
      }
    } catch (error: any) {
      console.log('Note: Migration check for materials table columns:', error.message);
    }

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

    // Create user_materials table (centralized materials library)
    await sql`
      CREATE TABLE IF NOT EXISTS user_materials (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 4) NOT NULL,
        quantity DECIMAL(10, 4) NOT NULL DEFAULT 0,
        unit VARCHAR(50) NOT NULL,
        price_per_unit DECIMAL(10, 4) NOT NULL,
        width DECIMAL(10, 4),
        length DECIMAL(10, 4),
        details TEXT,
        supplier VARCHAR(255),
        supplier_link VARCHAR(500),
        stock_level DECIMAL(10, 4) DEFAULT 0,
        reorder_point DECIMAL(10, 4) DEFAULT 0,
        last_purchased_date DATE,
        last_purchased_price DECIMAL(10, 4),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Add width and length columns if they don't exist (migration)
    try {
      const widthExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_materials' AND column_name='width'
      `;
      const widthRows = Array.isArray(widthExists) ? widthExists : widthExists.rows || [];
      if (widthRows.length === 0) {
        console.log('Adding width column to user_materials table...');
        await sql`ALTER TABLE user_materials ADD COLUMN width DECIMAL(10, 4)`;
        console.log('✅ Added width column');
      }

      const lengthExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_materials' AND column_name='length'
      `;
      const lengthRows = Array.isArray(lengthExists) ? lengthExists : lengthExists.rows || [];
      if (lengthRows.length === 0) {
        console.log('Adding length column to user_materials table...');
        await sql`ALTER TABLE user_materials ADD COLUMN length DECIMAL(10, 4)`;
        console.log('✅ Added length column');
      }
    } catch (error: any) {
      console.log('Note: Migration check for width/length columns:', error.message);
    }

    // Add is_percentage_type column if it doesn't exist (migration)
    try {
      const isPercentageTypeExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_materials' AND column_name='is_percentage_type'
      `;
      const isPercentageTypeRows = Array.isArray(isPercentageTypeExists) ? isPercentageTypeExists : isPercentageTypeExists.rows || [];
      if (isPercentageTypeRows.length === 0) {
        console.log('Adding is_percentage_type column to user_materials table...');
        await sql`ALTER TABLE user_materials ADD COLUMN is_percentage_type BOOLEAN DEFAULT FALSE`;
        console.log('✅ Added is_percentage_type column');
      }
    } catch (error: any) {
      console.log('Note: Migration check for is_percentage_type column:', error.message);
    }

    // Add last_purchased_quantity column if it doesn't exist (migration)
    try {
      const lastPurchasedQtyExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_materials' AND column_name='last_purchased_quantity'
      `;
      const lastPurchasedQtyRows = Array.isArray(lastPurchasedQtyExists) ? lastPurchasedQtyExists : lastPurchasedQtyExists.rows || [];
      if (lastPurchasedQtyRows.length === 0) {
        console.log('Adding last_purchased_quantity column to user_materials table...');
        await sql`ALTER TABLE user_materials ADD COLUMN last_purchased_quantity DECIMAL(10, 4)`;
        console.log('✅ Added last_purchased_quantity column');
      }
    } catch (error: any) {
      console.log('Note: Migration check for last_purchased_quantity column:', error.message);
    }

    // Create roadmap_features table
    await sql`
      CREATE TABLE IF NOT EXISTS roadmap_features (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create roadmap_votes table
    await sql`
      CREATE TABLE IF NOT EXISTS roadmap_votes (
        id SERIAL PRIMARY KEY,
        feature_id INTEGER REFERENCES roadmap_features(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(feature_id, user_id)
      );
    `;

    // Seed initial roadmap features
    try {
      const existingFeature = await sql`
        SELECT id FROM roadmap_features WHERE name = 'Custom Product Views'
      `;
      const existingRows = Array.isArray(existingFeature) ? existingFeature : existingFeature.rows || [];
      
      if (existingRows.length === 0) {
        console.log('Adding initial roadmap feature: Custom Product Views...');
        await sql`
          INSERT INTO roadmap_features (name, description, upvotes, downvotes)
          VALUES (
            'Custom Product Views',
            'Create and save custom views for your product list with specific filters, column visibility, and sorting preferences. Save views like "Products in Progress", "High Margin Items", or "Ready to Sell" to quickly switch between different product contexts without reconfiguring filters each time. This saves time and helps you focus on the right products for each task.',
            0,
            0
          )
        `;
        console.log('✅ Added Custom Product Views roadmap feature');
      }
    } catch (error: any) {
      console.log('Note: Could not seed roadmap feature:', error.message);
    }

    // Seed Material Yield Calculator feature
    try {
      const existingFeature = await sql`
        SELECT id FROM roadmap_features WHERE name = 'Material Yield Calculator'
      `;
      const existingRows = Array.isArray(existingFeature) ? existingFeature : existingFeature.rows || [];
      
      if (existingRows.length === 0) {
        console.log('Adding roadmap feature: Material Yield Calculator...');
        await sql`
          INSERT INTO roadmap_features (name, description, upvotes, downvotes)
          VALUES (
            'Material Yield Calculator',
            'Calculate how many products you can make from your available materials. Specify product dimensions (length, width, height) and material sheet/roll sizes to automatically determine the maximum quantity you can produce. This helps optimize material usage, reduce waste, and plan production more accurately. Perfect for makers who work with fabric, wood, metal sheets, or any material that comes in standard sizes.',
            0,
            0
          )
        `;
        console.log('✅ Added Material Yield Calculator roadmap feature');
      }
    } catch (error: any) {
      console.log('Note: Could not seed Material Yield Calculator roadmap feature:', error.message);
    }

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}
