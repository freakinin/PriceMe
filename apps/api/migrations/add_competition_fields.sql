-- Add competition_level and notes columns to tracked_products table

ALTER TABLE tracked_products 
ADD COLUMN IF NOT EXISTS competition_level VARCHAR(10) CHECK (competition_level IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for competition_level for faster filtering
CREATE INDEX IF NOT EXISTS idx_tracked_products_competition_level ON tracked_products(competition_level);
