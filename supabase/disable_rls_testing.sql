-- ============================================
-- DISABLE RLS FOR TESTING
-- ============================================
-- Run this in Supabase SQL Editor
-- This allows all operations without restrictions
-- ============================================

-- Disable RLS on all main tables
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities DISABLE ROW LEVEL SECURITY;
ALTER TABLE postal_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;

-- Optional: Also disable on these if they exist
ALTER TABLE pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================
-- IMPORTANT: Remember to run complete_rls_fix.sql
-- before going to production!
-- ============================================
