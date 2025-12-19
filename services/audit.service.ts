/**
 * Audit service - Supabase data access layer
 */

import { supabase } from '@/lib/supabase';
import type { AuditLog, AuditFilters } from '@/types';

export const auditService = {
    /**
     * Fetch audit logs with optional filters
     */
    async getLogs(filters: AuditFilters, limit = 100): Promise<AuditLog[]> {
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('performed_at', { ascending: false })
            .limit(limit);

        if (filters.tableFilter) {
            query = query.eq('table_name', filters.tableFilter);
        }
        if (filters.actionFilter) {
            query = query.eq('action', filters.actionFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },
};
