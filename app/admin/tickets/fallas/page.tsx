'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    EyeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    PhoneIcon,
    ExclamationTriangleIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Ticket {
    id: string;
    folio: string;
    full_name: string;
    phone: string;
    fault_description: string;
    fault_status: string;
    priority: string;
    created_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    'NEW': { label: 'Recibido', color: 'bg-red-100 text-red-800' },
    'DIAGNOSIS': { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800' },
    'SCHEDULED': { label: 'Agendado', color: 'bg-indigo-100 text-indigo-800' },
    'IN_PROGRESS': { label: 'En Reparación', color: 'bg-blue-100 text-blue-800' },
    'RESOLVED': { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
    'CLOSED': { label: 'Cerrado', color: 'bg-gray-100 text-gray-800' },
};

export default function TicketsFallasPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 15;

    useEffect(() => { fetchTickets(); }, [page, statusFilter]);

    const fetchTickets = async () => {
        setLoading(true);
        let query = supabase.from('tickets')
            .select('*', { count: 'exact' })
            .eq('type', 'fault')
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);
        if (statusFilter) query = query.eq('fault_status', statusFilter);
        const { data, count } = await query;
        setTickets(data || []);
        setTotal(count || 0);
        setLoading(false);
    };

    const handleDelete = async (ticketId: string, folio: string) => {
        if (!confirm(`¿Eliminar ticket ${folio}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/tickets/${ticketId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setTickets(prev => prev.filter(t => t.id !== ticketId));
                setTotal(prev => prev - 1);
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Error de conexión');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-7 h-7 text-red-500" />
                    Tickets de Fallas ({total})
                </h1>
                <button onClick={fetchTickets} className="btn-outline"><ArrowPathIcon className="w-5 h-5" /></button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 flex gap-4">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-48">
                    <option value="">Todos</option>
                    {Object.entries(statusLabels).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
                {loading ? <div className="p-12 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div> : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Folio</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Problema</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tickets.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 font-mono text-red-600 font-semibold">{t.folio}</td>
                                    <td className="px-4 py-4"><p className="font-medium">{t.full_name}</p><p className="text-sm text-gray-500">{t.phone}</p></td>
                                    <td className="px-4 py-4 text-sm max-w-xs truncate">{t.fault_description}</td>
                                    <td className="px-4 py-4"><span className={`badge ${statusLabels[t.fault_status]?.color}`}>{statusLabels[t.fault_status]?.label}</span></td>
                                    <td className="px-4 py-4 text-sm">{new Date(t.created_at).toLocaleDateString('es-MX')}</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/tickets/fallas/${t.id}`} className="text-primary hover:underline">Ver</Link>
                                            <button
                                                onClick={() => handleDelete(t.id, t.folio)}
                                                className="text-red-500 hover:text-red-700"
                                                title="Eliminar"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
