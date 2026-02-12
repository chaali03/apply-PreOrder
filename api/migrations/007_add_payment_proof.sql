-- Add payment_proof column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof TEXT;
