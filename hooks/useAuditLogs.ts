/**
 * Custom hook for audit logs
 */

import { useState, useEffect, useCallback } from 'react';
import { auditService } from '@/services';
import type { AuditLog, AuditFilters } from '@/types';

interface UseAuditLogsReturn {
    logs: AuditLog[];
    loading: boolean;
    error: string | null;
    // Filters
    filters: AuditFilters;
    setTableFilter: (value: string) => void;
    setActionFilter: (value: string) => void;
    // Derived data
    tables: string[];
    actions: string[];
    refetch: () => Promise<void>;
}

export function useAuditLogs(): UseAuditLogsReturn {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<AuditFilters>({
        tableFilter: '',
        actionFilter: '',
    });

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await auditService.getLogs(filters);
            setLogs(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching audit logs');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const setTableFilter = useCallback((value: string) => {
        setFilters(prev => ({ ...prev, tableFilter: value }));
    }, []);

    const setActionFilter = useCallback((value: string) => {
        setFilters(prev => ({ ...prev, actionFilter: value }));
    }, []);

    // Derive unique tables and actions from logs
    const tables = [...new Set(logs.map(l => l.table_name))];
    const actions = [...new Set(logs.map(l => l.action))];

    return {
        logs,
        loading,
        error,
        filters,
        setTableFilter,
        setActionFilter,
        tables,
        actions,
        refetch: fetchLogs,
    };
}
