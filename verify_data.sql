-- Check if the columns exist and have data
SELECT 
    name,
    min_order,
    min_order_tb,
    min_order_luar_tb,
    available_days_tb,
    available_days_luar_tb
FROM products 
WHERE name = 'Dimsum goreng';
