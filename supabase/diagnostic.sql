-- ============================================
-- DIAGNOSTIC: Find the actual error
-- ============================================
-- Run this in Supabase SQL Editor to find the problem

-- Step 1: Check if promotions table exists (tickets references it)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'promotions'
) AS promotions_table_exists;

-- Step 2: Try to insert a minimal ticket directly
INSERT INTO tickets (type, full_name, phone, address, fault_description)
VALUES ('fault'::ticket_type, 'Test User', '9611234567', 'Test Address 123', 'No tengo internet')
RETURNING id, folio;

-- If this fails, it will show the EXACT error message!
