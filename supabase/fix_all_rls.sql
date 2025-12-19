-- ============================================
-- Cable Master - Fix ALL Admin Tables RLS
-- ============================================
-- Execute this script in Supabase SQL Editor
-- This creates permissive policies for ALL admin tables
-- ============================================

-- ============================================
-- 1. SERVICE_PACKAGES (Planes y Paquetes)
-- ============================================
DROP POLICY IF EXISTS "public_view_packages" ON service_packages;
DROP POLICY IF EXISTS "admins_manage_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_all_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_select_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_insert_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_update_packages" ON service_packages;
DROP POLICY IF EXISTS "allow_delete_packages" ON service_packages;

ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_packages" ON service_packages
    FOR SELECT USING (true);
CREATE POLICY "allow_insert_packages" ON service_packages
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_packages" ON service_packages
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_packages" ON service_packages
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 2. BANNERS (Promociones y Banners)
-- ============================================
DROP POLICY IF EXISTS "public_view_active_banners" ON banners;
DROP POLICY IF EXISTS "admins_manage_banners" ON banners;
DROP POLICY IF EXISTS "allow_select_banners" ON banners;
DROP POLICY IF EXISTS "allow_insert_banners" ON banners;
DROP POLICY IF EXISTS "allow_update_banners" ON banners;
DROP POLICY IF EXISTS "allow_delete_banners" ON banners;

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_banners" ON banners
    FOR SELECT USING (true);
CREATE POLICY "allow_insert_banners" ON banners
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_banners" ON banners
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_banners" ON banners
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. TICKETS
-- ============================================
DROP POLICY IF EXISTS "anyone_create_ticket" ON tickets;
DROP POLICY IF EXISTS "staff_view_tickets" ON tickets;
DROP POLICY IF EXISTS "staff_update_tickets" ON tickets;
DROP POLICY IF EXISTS "allow_select_tickets" ON tickets;
DROP POLICY IF EXISTS "allow_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "allow_update_tickets" ON tickets;
DROP POLICY IF EXISTS "allow_delete_tickets" ON tickets;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_tickets" ON tickets
    FOR SELECT USING (true);
CREATE POLICY "allow_insert_tickets" ON tickets
    FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update_tickets" ON tickets
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_tickets" ON tickets
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 4. FAQ TABLES
-- ============================================
DROP POLICY IF EXISTS "public_view_faq_categories" ON faq_categories;
DROP POLICY IF EXISTS "admins_manage_faq_categories" ON faq_categories;
DROP POLICY IF EXISTS "allow_select_faq_categories" ON faq_categories;
DROP POLICY IF EXISTS "allow_insert_faq_categories" ON faq_categories;
DROP POLICY IF EXISTS "allow_update_faq_categories" ON faq_categories;
DROP POLICY IF EXISTS "allow_delete_faq_categories" ON faq_categories;

ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_faq_categories" ON faq_categories
    FOR SELECT USING (true);
CREATE POLICY "allow_insert_faq_categories" ON faq_categories
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_faq_categories" ON faq_categories
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_faq_categories" ON faq_categories
    FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "public_view_faq_items" ON faq_items;
DROP POLICY IF EXISTS "admins_manage_faq_items" ON faq_items;
DROP POLICY IF EXISTS "allow_select_faq_items" ON faq_items;
DROP POLICY IF EXISTS "allow_insert_faq_items" ON faq_items;
DROP POLICY IF EXISTS "allow_update_faq_items" ON faq_items;
DROP POLICY IF EXISTS "allow_delete_faq_items" ON faq_items;

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_faq_items" ON faq_items
    FOR SELECT USING (true);
CREATE POLICY "allow_insert_faq_items" ON faq_items
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_faq_items" ON faq_items
    FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_faq_items" ON faq_items
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 5. COVERAGE TABLES
-- ============================================
DROP POLICY IF EXISTS "public_view_municipalities" ON municipalities;
DROP POLICY IF EXISTS "admins_manage_municipalities" ON municipalities;
DROP POLICY IF EXISTS "allow_select_municipalities" ON municipalities;
DROP POLICY IF EXISTS "allow_insert_municipalities" ON municipalities;
DROP POLICY IF EXISTS "allow_update_municipalities" ON municipalities;
DROP POLICY IF EXISTS "allow_delete_municipalities" ON municipalities;

ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_municipalities" ON municipalities FOR SELECT USING (true);
CREATE POLICY "allow_insert_municipalities" ON municipalities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_municipalities" ON municipalities FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_municipalities" ON municipalities FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "public_view_postal_codes" ON postal_codes;
DROP POLICY IF EXISTS "admins_manage_postal_codes" ON postal_codes;
DROP POLICY IF EXISTS "allow_select_postal_codes" ON postal_codes;
DROP POLICY IF EXISTS "allow_insert_postal_codes" ON postal_codes;
DROP POLICY IF EXISTS "allow_update_postal_codes" ON postal_codes;
DROP POLICY IF EXISTS "allow_delete_postal_codes" ON postal_codes;

ALTER TABLE postal_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_postal_codes" ON postal_codes FOR SELECT USING (true);
CREATE POLICY "allow_insert_postal_codes" ON postal_codes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_postal_codes" ON postal_codes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_postal_codes" ON postal_codes FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "public_view_communities" ON communities;
DROP POLICY IF EXISTS "admins_manage_communities" ON communities;
DROP POLICY IF EXISTS "allow_select_communities" ON communities;
DROP POLICY IF EXISTS "allow_insert_communities" ON communities;
DROP POLICY IF EXISTS "allow_update_communities" ON communities;
DROP POLICY IF EXISTS "allow_delete_communities" ON communities;

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_communities" ON communities FOR SELECT USING (true);
CREATE POLICY "allow_insert_communities" ON communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_communities" ON communities FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_communities" ON communities FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 6. CMS TABLES (Pages y Blocks)
-- ============================================
DROP POLICY IF EXISTS "public_view_published_pages" ON pages;
DROP POLICY IF EXISTS "admins_manage_pages" ON pages;
DROP POLICY IF EXISTS "allow_select_pages" ON pages;
DROP POLICY IF EXISTS "allow_insert_pages" ON pages;
DROP POLICY IF EXISTS "allow_update_pages" ON pages;
DROP POLICY IF EXISTS "allow_delete_pages" ON pages;

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_pages" ON pages FOR SELECT USING (true);
CREATE POLICY "allow_insert_pages" ON pages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_pages" ON pages FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_pages" ON pages FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "public_view_visible_blocks" ON page_blocks;
DROP POLICY IF EXISTS "admins_manage_blocks" ON page_blocks;
DROP POLICY IF EXISTS "allow_select_page_blocks" ON page_blocks;
DROP POLICY IF EXISTS "allow_insert_page_blocks" ON page_blocks;
DROP POLICY IF EXISTS "allow_update_page_blocks" ON page_blocks;
DROP POLICY IF EXISTS "allow_delete_page_blocks" ON page_blocks;

ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_page_blocks" ON page_blocks FOR SELECT USING (true);
CREATE POLICY "allow_insert_page_blocks" ON page_blocks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_page_blocks" ON page_blocks FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_delete_page_blocks" ON page_blocks FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 7. PROFILES
-- ============================================
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admins_view_all_profiles" ON profiles;
DROP POLICY IF EXISTS "master_manage_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_select_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "allow_update_profiles" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select_profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "allow_insert_profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_update_profiles" ON profiles FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICATION - Run to see all policies
-- ============================================
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd;
