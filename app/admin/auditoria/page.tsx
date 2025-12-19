'use client';

import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useAuditLogs } from '@/hooks';
import { ACTION_COLORS } from '@/types';
import { PageLoading, DataTable } from '@/components/ui';
import type { AuditLog, AuditAction } from '@/types';

// Force dynamic rendering to avoid SSR issues with hooks
export const dynamic = 'force-dynamic';

export default function AuditoriaPage() {
    const {
        logs,
        loading,
        filters,
        setTableFilter,
        setActionFilter,
        tables,
        actions,
    } = useAuditLogs();

    if (loading) return <PageLoading />;

    const columns = [
        {
            key: 'date',
            header: 'Fecha/Hora',
            render: (log: AuditLog) => (
                <span className="text-sm">
                    {new Date(log.performed_at).toLocaleString('es-MX')}
                </span>
            ),
        },
        {
            key: 'table',
            header: 'Tabla',
            render: (log: AuditLog) => (
                <span className="font-mono text-sm">{log.table_name}</span>
            ),
        },
        {
            key: 'action',
            header: 'Acción',
            render: (log: AuditLog) => (
                <span className={`badge ${ACTION_COLORS[log.action as AuditAction] || 'bg-gray-100'}`}>
                    {log.action}
                </span>
            ),
        },
        {
            key: 'record',
            header: 'Registro',
            render: (log: AuditLog) => (
                <span className="font-mono text-xs">{log.record_id.slice(0, 8)}...</span>
            ),
        },
        {
            key: 'details',
            header: 'Detalles',
            render: (_log: AuditLog) => (
                <button className="text-primary text-sm hover:underline">Ver cambios</button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardDocumentListIcon className="w-7 h-7 text-gray-600" />
                    Registro de Auditoría
                </h1>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex gap-4 flex-wrap">
                <select
                    value={filters.tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    className="input w-48"
                >
                    <option value="">Todas las tablas</option>
                    {tables.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                <select
                    value={filters.actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="input w-48"
                >
                    <option value="">Todas las acciones</option>
                    {actions.map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>
            </div>

            {/* Audit logs table */}
            <DataTable
                columns={columns}
                data={logs}
                keyExtractor={(log) => log.id}
                emptyMessage="No hay registros de auditoría"
            />
        </div>
    );
}
