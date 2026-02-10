-- Add cancellation fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Added cancellation_reason and cancelled_at columns to orders table';
END $$;
