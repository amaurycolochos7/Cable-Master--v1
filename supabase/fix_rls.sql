-- ============================================
-- Cable Master - FIXED Row Level Security
-- ============================================
-- This script fixes the infinite recursion issue
-- Execute in Supabase SQL Editor
-- ============================================

-- First, drop the problematic policies
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "master_manage_profiles" ON profiles;

-- ============================================
-- HELPER FUNCTION: Get user role without RLS
-- This bypasses RLS to prevent infinite recursion
-- ============================================
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT role FROM profiles WHERE id = user_id;
$$;

-- ============================================
-- HELPER FUNCTION: Check if user is admin/master
-- ============================================
CREATE OR REPLACE FUNCTION is_admin_or_master()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'master')
    );
$$;

-- ============================================
-- HELPER FUNCTION: Check if user is staff
-- ============================================
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'master', 'technician', 'support')
    );
$$;

-- ============================================
-- 1. PROFILES TABLE - Fixed Policies
-- ============================================
-- Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "users_view_own_profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Admins can view ALL profiles (uses helper function)
CREATE POLICY "admins_view_all_profiles" ON profiles
    FOR SELECT USING (is_admin_or_master());

-- Policy 4: Master can do everything with profiles
CREATE POLICY "master_manage_profiles" ON profiles
    FOR ALL USING (
        get_user_role(auth.uid()) = 'master'
    );

-- ============================================
-- 2. TICKETS TABLE - Use helper functions
-- ============================================
-- Drop old policies
DROP POLICY IF EXISTS "anyone_create_ticket" ON tickets;
DROP POLICY IF EXISTS "staff_view_tickets" ON tickets;
DROP POLICY IF EXISTS "staff_update_tickets" ON tickets;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can create tickets (for public contract form)
CREATE POLICY "anyone_create_ticket" ON tickets
    FOR INSERT WITH CHECK (true);

-- Staff can view all tickets
CREATE POLICY "staff_view_tickets" ON tickets
    FOR SELECT USING (is_staff());

-- Staff can update tickets
CREATE POLICY "staff_update_tickets" ON tickets
    FOR UPDATE USING (is_staff());

-- ============================================
-- 3. SERVICE_PACKAGES TABLE (unchanged logic)
-- ============================================
DROP POLICY IF EXISTS "public_view_packages" ON service_packages;
DROP POLICY IF EXISTS "admins_manage_packages" ON service_packages;

ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_packages" ON service_packages
    FOR SELECT USING (is_active = true);

CREATE POLICY "admins_manage_packages" ON service_packages
    FOR ALL USING (is_admin_or_master());

-- ============================================
-- 4. COVERAGE TABLES
-- ============================================
DROP POLICY IF EXISTS "public_view_municipalities" ON municipalities;
DROP POLICY IF EXISTS "admins_manage_municipalities" ON municipalities;
DROP POLICY IF EXISTS "public_view_postal_codes" ON postal_codes;
DROP POLICY IF EXISTS "admins_manage_postal_codes" ON postal_codes;
DROP POLICY IF EXISTS "public_view_communities" ON communities;
DROP POLICY IF EXISTS "admins_manage_communities" ON communities;

ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_municipalities" ON municipalities FOR SELECT USING (true);
CREATE POLICY "public_view_postal_codes" ON postal_codes FOR SELECT USING (true);
CREATE POLICY "public_view_communities" ON communities FOR SELECT USING (true);

CREATE POLICY "admins_manage_municipalities" ON municipalities FOR ALL USING (is_admin_or_master());
CREATE POLICY "admins_manage_postal_codes" ON postal_codes FOR ALL USING (is_admin_or_master());
CREATE POLICY "admins_manage_communities" ON communities FOR ALL USING (is_admin_or_master());

-- ============================================
-- 5. FAQ TABLES
-- ============================================
DROP POLICY IF EXISTS "public_view_faq_categories" ON faq_categories;
DROP POLICY IF EXISTS "admins_manage_faq_categories" ON faq_categories;
DROP POLICY IF EXISTS "public_view_faq_items" ON faq_items;
DROP POLICY IF EXISTS "admins_manage_faq_items" ON faq_items;

ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_faq_categories" ON faq_categories FOR SELECT USING (true);
CREATE POLICY "public_view_faq_items" ON faq_items FOR SELECT USING (true);

CREATE POLICY "admins_manage_faq_categories" ON faq_categories FOR ALL USING (is_admin_or_master());
CREATE POLICY "admins_manage_faq_items" ON faq_items FOR ALL USING (is_admin_or_master());

-- ============================================
-- 6. BANNERS TABLE
-- ============================================
DROP POLICY IF EXISTS "public_view_active_banners" ON banners;
DROP POLICY IF EXISTS "admins_manage_banners" ON banners;

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_active_banners" ON banners 
    FOR SELECT USING (is_active = true);

CREATE POLICY "admins_manage_banners" ON banners FOR ALL USING (is_admin_or_master());

-- ============================================
-- 7. CMS TABLES
-- ============================================
DROP POLICY IF EXISTS "public_view_published_pages" ON pages;
DROP POLICY IF EXISTS "admins_manage_pages" ON pages;
DROP POLICY IF EXISTS "public_view_visible_blocks" ON page_blocks;
DROP POLICY IF EXISTS "admins_manage_blocks" ON page_blocks;

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_published_pages" ON pages FOR SELECT USING (is_published = true);
CREATE POLICY "admins_manage_pages" ON pages FOR ALL USING (is_admin_or_master());

CREATE POLICY "public_view_visible_blocks" ON page_blocks FOR SELECT USING (is_visible = true);
CREATE POLICY "admins_manage_blocks" ON page_blocks FOR ALL USING (is_admin_or_master());

-- ============================================
-- 8. AUDIT_LOGS TABLE
-- ============================================
DROP POLICY IF EXISTS "admins_view_audit" ON audit_logs;
DROP POLICY IF EXISTS "system_insert_audit" ON audit_logs;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_audit" ON audit_logs FOR SELECT USING (is_admin_or_master());
CREATE POLICY "system_insert_audit" ON audit_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify all policies are set:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Test functions work:
-- SELECT is_admin_or_master();
-- SELECT is_staff();
