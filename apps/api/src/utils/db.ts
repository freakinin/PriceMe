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

      // Check and add seller_country
      const sellerCountryExists = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='user_settings' AND column_name='seller_country'
      `;
      const sellerCountryRows = Array.isArray(sellerCountryExists) ? sellerCountryExists : sellerCountryExists.rows || [];
      if (sellerCountryRows.length === 0) {
        console.log('Adding seller_country column to user_settings table...');
        await sql`ALTER TABLE user_settings ADD COLUMN seller_country VARCHAR(2) DEFAULT 'US'`;
        console.log('✅ Added seller_country column');
      }

      // Check and add default_platform_profile_id
      const defaultPlatformExists = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='user_settings' AND column_name='default_platform_profile_id'
      `;
      const defaultPlatformRows = Array.isArray(defaultPlatformExists) ? defaultPlatformExists : defaultPlatformExists.rows || [];
      if (defaultPlatformRows.length === 0) {
        console.log('Adding default_platform_profile_id column to user_settings table...');
        await sql`ALTER TABLE user_settings ADD COLUMN default_platform_profile_id INTEGER REFERENCES platform_fee_profiles(id) ON DELETE SET NULL`;
        console.log('✅ Added default_platform_profile_id column');
      }

      // Check and add onboarding_completed
      const onboardingExists = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='user_settings' AND column_name='onboarding_completed'
      `;
      const onboardingRows = Array.isArray(onboardingExists) ? onboardingExists : onboardingExists.rows || [];
      if (onboardingRows.length === 0) {
        console.log('Adding onboarding_completed column to user_settings table...');
        await sql`ALTER TABLE user_settings ADD COLUMN onboarding_completed BOOLEAN DEFAULT false`;
        console.log('✅ Added onboarding_completed column');
      }
    } catch (error: any) {
      console.error('Error adding columns to user_settings table:', error.message);
      console.error('Error stack:', error.stack);
    }


    // Create platform_fee_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS platform_fee_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        listing_fee_usd DECIMAL(10,4) DEFAULT 0.20,
        transaction_fee_pct DECIMAL(5,3) DEFAULT 6.5,
        payment_processing_pct DECIMAL(5,3) DEFAULT 3.0,
        payment_processing_flat DECIMAL(10,4) DEFAULT 0.25,
        offsite_ads_enabled BOOLEAN DEFAULT FALSE,
        offsite_ads_pct DECIMAL(5,3) DEFAULT 15.0,
        currency_conversion_pct DECIMAL(5,3) DEFAULT 0,
        vat_on_fees_pct DECIMAL(5,3) DEFAULT 0,
        fees_apply_to_shipping BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create shipping_methods table
    await sql`
      CREATE TABLE IF NOT EXISTS shipping_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        cost DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_free_shipping BOOLEAN DEFAULT FALSE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      );
    `;

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

    // Check and add category_id column to products
    try {
      const categoryIdExists = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='products' AND column_name='category_id'
      `;
      const categoryIdRows = Array.isArray(categoryIdExists) ? categoryIdExists : categoryIdExists.rows || [];
      if (categoryIdRows.length === 0) {
        console.log('Adding category_id column to products table...');
        await sql`ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`;
        console.log('✅ Added category_id column');
      }
    } catch (error: any) {
      console.log('Note: Migration check for category_id column:', error.message);
    }

    // Add platform fee and shipping columns to products
    try {
      const platformProfileExists = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='products' AND column_name='platform_fee_profile_id'
      `;
      const platformProfileRows = Array.isArray(platformProfileExists) ? platformProfileExists : platformProfileExists.rows || [];
      if (platformProfileRows.length === 0) {
        console.log('Adding platform_fee_profile_id column to products table...');
        await sql`ALTER TABLE products ADD COLUMN platform_fee_profile_id INTEGER REFERENCES platform_fee_profiles(id) ON DELETE SET NULL`;
        console.log('✅ Added platform_fee_profile_id column');
      }

      const shippingCostExists = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='products' AND column_name='shipping_cost'
      `;
      const shippingCostRows = Array.isArray(shippingCostExists) ? shippingCostExists : shippingCostExists.rows || [];
      if (shippingCostRows.length === 0) {
        console.log('Adding shipping_cost column to products table...');
        await sql`ALTER TABLE products ADD COLUMN shipping_cost DECIMAL(10,2)`;
        console.log('✅ Added shipping_cost column');
      }

      const shippingIncludedExists = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='products' AND column_name='shipping_included_in_price'
      `;
      const shippingIncludedRows = Array.isArray(shippingIncludedExists) ? shippingIncludedExists : shippingIncludedExists.rows || [];
      if (shippingIncludedRows.length === 0) {
        console.log('Adding shipping_included_in_price column to products table...');
        await sql`ALTER TABLE products ADD COLUMN shipping_included_in_price BOOLEAN DEFAULT FALSE`;
        console.log('✅ Added shipping_included_in_price column');
      }
    } catch (error: any) {
      console.log('Note: Migration check for products platform/shipping columns:', error.message);
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

    // Create suppliers table (centralized supplier database per user)
    await sql`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        link VARCHAR(500),
        phone VARCHAR(100),
        email VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      );
    `;

    // Add phone column to suppliers if it doesn't exist (migration)
    try {
      const phoneExists = await sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name='suppliers' AND column_name='phone'
      `;
      const phoneRows = Array.isArray(phoneExists) ? phoneExists : phoneExists.rows || [];
      if (phoneRows.length === 0) {
        await sql`ALTER TABLE suppliers ADD COLUMN phone VARCHAR(100)`;
        console.log('✅ Added phone column to suppliers');
      }
    } catch (error: any) {
      console.log('Note: Migration check for suppliers.phone:', error.message);
    }

    // Add email column to suppliers if it doesn't exist (migration)
    try {
      const emailExists = await sql`
        SELECT column_name FROM information_schema.columns
        WHERE table_name='suppliers' AND column_name='email'
      `;
      const emailRows = Array.isArray(emailExists) ? emailExists : emailExists.rows || [];
      if (emailRows.length === 0) {
        await sql`ALTER TABLE suppliers ADD COLUMN email VARCHAR(255)`;
        console.log('✅ Added email column to suppliers');
      }
    } catch (error: any) {
      console.log('Note: Migration check for suppliers.email:', error.message);
    }

    // Add supplier_id column to user_materials if it doesn't exist (migration)
    try {
      const supplierIdExists = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='user_materials' AND column_name='supplier_id'
      `;
      const supplierIdRows = Array.isArray(supplierIdExists) ? supplierIdExists : supplierIdExists.rows || [];
      if (supplierIdRows.length === 0) {
        console.log('Adding supplier_id column to user_materials table...');
        await sql`ALTER TABLE user_materials ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL`;
        console.log('✅ Added supplier_id column');

        // Data migration: create supplier records from existing free-text supplier fields
        console.log('Migrating existing supplier text data to suppliers table...');
        const existingSuppliers = await sql`
          SELECT DISTINCT user_id, supplier, supplier_link
          FROM user_materials
          WHERE supplier IS NOT NULL AND supplier != ''
        `;
        const supplierRows = Array.isArray(existingSuppliers) ? existingSuppliers : existingSuppliers.rows || [];
        for (const row of supplierRows) {
          try {
            await sql`
              INSERT INTO suppliers (user_id, name, link)
              VALUES (${row.user_id}, ${row.supplier}, ${row.supplier_link || null})
              ON CONFLICT (user_id, name) DO NOTHING
            `;
            await sql`
              UPDATE user_materials
              SET supplier_id = (
                SELECT id FROM suppliers WHERE user_id = ${row.user_id} AND name = ${row.supplier}
              )
              WHERE user_id = ${row.user_id} AND supplier = ${row.supplier} AND supplier_id IS NULL
            `;
          } catch (innerError: any) {
            console.log(`Note: Could not migrate supplier "${row.supplier}":`, innerError.message);
          }
        }
        console.log(`✅ Migrated ${supplierRows.length} supplier(s) from existing materials`);
      }
    } catch (error: any) {
      console.log('Note: Migration check for supplier_id column:', error.message);
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

    // Create product_templates table
    await sql`
      CREATE TABLE IF NOT EXISTS product_templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        
        default_batch_size INTEGER DEFAULT 1,
        default_pricing_method VARCHAR(20),
        default_markup_percentage DECIMAL(5, 2),
        
        materials_json JSONB,
        labor_costs_json JSONB,
        other_costs_json JSONB,
        variants_json JSONB,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create sales table
    await sql`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        quantity DECIMAL(10, 4) NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
        discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
        discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
        coupon_code VARCHAR(50),
        platform VARCHAR(50),
        customer_name VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes for sales table using exception handling for IF NOT EXISTS which is not supported in all PG versions for INDEX in the same way or just simple CREATE INDEX IF NOT EXISTS is fine for modern PG which Vercel uses
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_sales_platform ON sales(platform)`;
    } catch (e: any) {
      console.log('Note: Index creation for sales table:', e.message);
    }


    // Create competitors table
    await sql`
      CREATE TABLE IF NOT EXISTS competitors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create tracked_products table
    await sql`
      CREATE TABLE IF NOT EXISTS tracked_products (
        id SERIAL PRIMARY KEY,
        competitor_id INTEGER REFERENCES competitors(id) ON DELETE CASCADE NOT NULL,
        linked_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        url TEXT NOT NULL,
        title VARCHAR(255),
        current_price DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'USD',
        image_url TEXT,
        last_scraped_at TIMESTAMP,
        
        materials_analysis JSONB,
        quality_score INTEGER,
        image_quality_score INTEGER,
        description_score INTEGER,
        ai_analysis_summary TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(competitor_id, url)
      );
    `;

    // Create price_history table
    await sql`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        tracked_product_id INTEGER REFERENCES tracked_products(id) ON DELETE CASCADE NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Indexes for competitor tracking
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_tracked_products_competitor_id ON tracked_products(competitor_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_tracked_products_linked_product_id ON tracked_products(linked_product_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_price_history_tracked_product_id ON price_history(tracked_product_id)`;
    } catch (e: any) {
      console.log('Note: Index creation for competitor tracking tables:', e.message);
    }

    // Add competition_level and notes columns to tracked_products if they don't exist
    try {
      const competitionLevelExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='tracked_products' AND column_name='competition_level'
      `;
      const competitionLevelRows = Array.isArray(competitionLevelExists) ? competitionLevelExists : competitionLevelExists.rows || [];
      if (competitionLevelRows.length === 0) {
        console.log('Adding competition_level column to tracked_products table...');
        await sql`ALTER TABLE tracked_products ADD COLUMN competition_level VARCHAR(10) CHECK (competition_level IN ('low', 'medium', 'high'))`;
        console.log('✅ Added competition_level column');
      }

      const notesExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='tracked_products' AND column_name='notes'
      `;
      const notesRows = Array.isArray(notesExists) ? notesExists : notesExists.rows || [];
      if (notesRows.length === 0) {
        console.log('Adding notes column to tracked_products table...');
        await sql`ALTER TABLE tracked_products ADD COLUMN notes TEXT`;
        console.log('✅ Added notes column');
      }
    } catch (error: any) {
      console.log('Note: Migration check for tracked_products competition fields:', error.message);
    }

    // Migration: Add competitive_insights to products table
    try {
      const insightsExists = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='competitive_insights'
      `;
      const insightsRows = Array.isArray(insightsExists) ? insightsExists : insightsExists.rows || [];
      if (insightsRows.length === 0) {
        console.log('Adding competitive_insights columns to products table...');
        await sql`ALTER TABLE products ADD COLUMN competitive_insights JSONB`;
        await sql`ALTER TABLE products ADD COLUMN insights_generated_at TIMESTAMP`;
        console.log('✅ Added competitive_insights columns');
      }
    } catch (error: any) {
      console.log('Note: Migration check for competitive_insights:', error.message);
    }

    // Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`;
    } catch (e: any) {
      console.log('Note: Index creation for notifications:', e.message);
    }

    // Create subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
        plan VARCHAR(20) NOT NULL DEFAULT 'free'
          CHECK (plan IN ('free', 'starter', 'pro', 'business')),
        status VARCHAR(20) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'trialing', 'canceled', 'past_due')),
        stripe_subscription_id VARCHAR(255),
        stripe_customer_id VARCHAR(255),
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        trial_ends_at TIMESTAMP,
        canceled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Back-fill: give every existing user a free subscription row
    try {
      await sql`
        INSERT INTO subscriptions (user_id, plan, status)
        SELECT id, 'free', 'active'
        FROM users
        WHERE id NOT IN (SELECT user_id FROM subscriptions)
      `;
    } catch (e: any) {
      console.log('Note: Subscription back-fill:', e.message);
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON subscriptions(stripe_subscription_id)`;
    } catch (e: any) {
      console.log('Note: Index creation for subscriptions:', e.message);
    }

    // Migration: fix tracked_products.linked_product_id FK from SET NULL → CASCADE.
    // Orphaned rows (linked_product_id IS NULL) inflate competitor usage counts; clean them up too.
    try {
      // 1. Remove orphaned tracked_products left over from deleted products.
      await sql`DELETE FROM tracked_products WHERE linked_product_id IS NULL`;

      // 2. Re-create the FK with ON DELETE CASCADE so future product deletes cascade automatically.
      await sql`ALTER TABLE tracked_products DROP CONSTRAINT IF EXISTS tracked_products_linked_product_id_fkey`;
      await sql`
        ALTER TABLE tracked_products
        ADD CONSTRAINT tracked_products_linked_product_id_fkey
        FOREIGN KEY (linked_product_id) REFERENCES products(id) ON DELETE CASCADE
      `;
    } catch (e: any) {
      console.log('Note: tracked_products linked_product_id FK migration:', e.message);
    }

    // Create coach_profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS coach_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
        craft_type VARCHAR(100) NOT NULL,
        sales_channels TEXT[] DEFAULT ARRAY[]::TEXT[],
        experience_years VARCHAR(20) NOT NULL,
        primary_challenge VARCHAR(100) NOT NULL,
        monthly_revenue_goal DECIMAL(12,2),
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create coach_insights table
    await sql`
      CREATE TABLE IF NOT EXISTS coach_insights (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        headline VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        action TEXT NOT NULL,
        impact_estimate VARCHAR(100),
        priority INTEGER NOT NULL DEFAULT 5,
        category VARCHAR(20) NOT NULL,
        related_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'unread',
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_coach_insights_user_id ON coach_insights(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_coach_insights_status ON coach_insights(status)`;
    } catch (e: any) {
      console.log('Note: Index creation for coach_insights:', e.message);
    }

    // Create coach_chat_messages table
    await sql`
      CREATE TABLE IF NOT EXISTS coach_chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        role VARCHAR(15) NOT NULL,
        content TEXT NOT NULL,
        session_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_coach_chat_user_id ON coach_chat_messages(user_id)`;
    } catch (e: any) {
      console.log('Note: Index creation for coach_chat_messages:', e.message);
    }

    // Create coach_reports table
    await sql`
      CREATE TABLE IF NOT EXISTS coach_reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, report_type)
      );
    `;

    // Create coach_daily_usage table
    await sql`
      CREATE TABLE IF NOT EXISTS coach_daily_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
        chat_messages_sent INTEGER NOT NULL DEFAULT 0,
        UNIQUE(user_id, usage_date)
      );
    `;

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}
