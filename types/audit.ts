/**
 * Audit log types
 */

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action: AuditAction;
    old_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    performed_by: string | null;
    performed_at: string;
}

export interface AuditFilters {
    tableFilter: string;
    actionFilter: string;
}

export const ACTION_COLORS: Record<AuditAction, string> = {
    INSERT: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
};
