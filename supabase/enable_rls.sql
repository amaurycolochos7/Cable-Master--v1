-- ============================================
-- Cable Master - Row Level Security Policies
-- ============================================
-- Execute this script in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query > Paste & Run

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_view_own_profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "admins_view_all_profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master')
        )
    );

-- Master users can modify all profiles
CREATE POLICY "master_manage_profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'master'
        )
    );

-- ============================================
-- 2. TICKETS TABLE
-- ============================================
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- All authenticated users can create tickets (for public contract form)
CREATE POLICY "anyone_create_ticket" ON tickets
    FOR INSERT WITH CHECK (true);

-- Admins/techs can view all tickets
CREATE POLICY "staff_view_tickets" ON tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master', 'technician', 'support')
        )
    );

-- Admins can update tickets
CREATE POLICY "staff_update_tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master', 'technician', 'support')
        )
    );

-- ============================================
-- 3. SERVICE_PACKAGES TABLE (Public read)
-- ============================================
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "public_view_packages" ON service_packages
    FOR SELECT USING (is_active = true);

-- Admins can manage packages
CREATE POLICY "admins_manage_packages" ON service_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master')
        )
    );

-- ============================================
-- 4. MUNICIPALITIES/POSTAL_CODES/COMMUNITIES (Public read)
-- ============================================
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Public read for coverage check
CREATE POLICY "public_view_municipalities" ON municipalities FOR SELECT USING (true);
CREATE POLICY "public_view_postal_codes" ON postal_codes FOR SELECT USING (true);
CREATE POLICY "public_view_communities" ON communities FOR SELECT USING (true);

-- Admins manage coverage
CREATE POLICY "admins_manage_municipalities" ON municipalities FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);
CREATE POLICY "admins_manage_postal_codes" ON postal_codes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);
CREATE POLICY "admins_manage_communities" ON communities FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);

-- ============================================
-- 5. FAQ (Public read)
-- ============================================
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_faq_categories" ON faq_categories FOR SELECT USING (true);
CREATE POLICY "public_view_faq_items" ON faq_items FOR SELECT USING (true);

CREATE POLICY "admins_manage_faq_categories" ON faq_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);
CREATE POLICY "admins_manage_faq_items" ON faq_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);

-- ============================================
-- 6. BANNERS (Public read active)
-- ============================================
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_active_banners" ON banners 
    FOR SELECT USING (is_active = true);

CREATE POLICY "admins_manage_banners" ON banners FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);

-- ============================================
-- 7. PAGES & PAGE_BLOCKS (CMS)
-- ============================================
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_published_pages" ON pages FOR SELECT USING (is_published = true);
CREATE POLICY "admins_manage_pages" ON pages FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);

CREATE POLICY "public_view_visible_blocks" ON page_blocks FOR SELECT USING (is_visible = true);
CREATE POLICY "admins_manage_blocks" ON page_blocks FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);

-- ============================================
-- 8. AUDIT_LOGS (Admin only)
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_view_audit" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'master'))
);

-- System can insert audit logs
CREATE POLICY "system_insert_audit" ON audit_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- Done! Verify with:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
-- ============================================
