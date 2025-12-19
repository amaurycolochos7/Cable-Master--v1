-- ============================================
-- Fix: Add INSERT policy for ticket_status_history
-- ============================================
-- This allows the API to create status history entries
-- when tickets are created from public forms
-- ============================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "public_insert_status_history" ON ticket_status_history;

-- Allow inserting status history for new tickets (public forms)
CREATE POLICY "public_insert_status_history" ON ticket_status_history
    FOR INSERT WITH CHECK (true);

-- Staff can view all status history entries
DROP POLICY IF EXISTS "staff_view_status_history" ON ticket_status_history;
CREATE POLICY "staff_view_status_history" ON ticket_status_history
    FOR SELECT USING (is_staff());

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify:
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename = 'ticket_status_history';
