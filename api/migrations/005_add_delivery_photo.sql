-- Add delivery_photo column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo TEXT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Added delivery_photo column to orders table';
END $$;
