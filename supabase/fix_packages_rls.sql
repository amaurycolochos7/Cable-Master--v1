-- ============================================
-- Cable Master - Quick Fix for Package Edit/Delete
-- ============================================
-- Execute this script in Supabase SQL Editor
-- This creates permissive policies for service_packages
-- ============================================

-- First, drop existing policies
DROP POLICY IF EXISTS "public_view_packages" ON service_packages;
DROP POLICY IF EXISTS "admins_manage_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_all_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_select_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_insert_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_update_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_delete_packages" ON service_packages;

-- Ensure RLS is enabled
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
-- SELECT: Anyone can view all packages
CREATE POLICY "allow_select_packages" ON service_packages
    FOR SELECT USING (true);

-- INSERT: Any authenticated user can insert
CREATE POLICY "allow_insert_packages" ON service_packages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Any authenticated user can update
CREATE POLICY "allow_update_packages" ON service_packages
    FOR UPDATE USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: Any authenticated user can delete
CREATE POLICY "allow_delete_packages" ON service_packages
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to check policies are set:
SELECT policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'service_packages';

-- ============================================
-- IMPORTANT: After running this script, 
-- refresh the page at http://localhost:3000/admin/planes
-- and try editing/deleting packages again.
-- ============================================
