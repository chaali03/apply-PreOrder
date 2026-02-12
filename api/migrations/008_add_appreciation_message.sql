-- Add appreciation_message column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS appreciation_message TEXT;
