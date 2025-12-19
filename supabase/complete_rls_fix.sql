-- ============================================
-- CABLE MASTER - COMPLETE RLS FIX
-- ============================================
-- Run this COMPLETE script in Supabase SQL Editor
-- This will fix ALL RLS issues for ticket creation
-- ============================================

-- STEP 1: Disable RLS on problem tables first
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies on tickets
DROP POLICY IF EXISTS "anyone_create_ticket" ON tickets;
DROP POLICY IF EXISTS "staff_view_tickets" ON tickets;
DROP POLICY IF EXISTS "staff_update_tickets" ON tickets;
DROP POLICY IF EXISTS "public_create_tickets" ON tickets;

-- STEP 3: Drop ALL existing policies on ticket_status_history
DROP POLICY IF EXISTS "public_insert_status_history" ON ticket_status_history;
DROP POLICY IF EXISTS "staff_view_status_history" ON ticket_status_history;
DROP POLICY IF EXISTS "anyone_insert_status" ON ticket_status_history;

-- STEP 4: Create helper function if not exists
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE(
        (SELECT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master', 'technician', 'support')
        )),
        false
    );
$$;

-- STEP 5: Re-enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create NEW policies for tickets
-- Allow ANYONE to INSERT tickets (for public forms)
CREATE POLICY "public_create_tickets" ON tickets
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Staff can SELECT all tickets
CREATE POLICY "staff_view_tickets" ON tickets
    FOR SELECT 
    TO authenticated
    USING (is_staff());

-- Staff can UPDATE tickets
CREATE POLICY "staff_update_tickets" ON tickets
    FOR UPDATE 
    TO authenticated
    USING (is_staff());

-- STEP 7: Create NEW policies for ticket_status_history
-- Allow ANYONE to INSERT status history (for public ticket creation)
CREATE POLICY "public_insert_status_history" ON ticket_status_history
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Staff can SELECT status history
CREATE POLICY "staff_view_status_history" ON ticket_status_history
    FOR SELECT 
    TO authenticated
    USING (is_staff());

-- ============================================
-- VERIFICATION - Run this to check policies:
-- ============================================
-- SELECT tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename IN ('tickets', 'ticket_status_history')
-- ORDER BY tablename, policyname;

-- ============================================
-- If still having issues, try this to check RLS status:
-- ============================================
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('tickets', 'ticket_status_history');
