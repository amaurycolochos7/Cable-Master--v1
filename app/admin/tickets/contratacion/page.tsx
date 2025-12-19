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
    CalendarIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Ticket {
    id: string;
    folio: string;
    full_name: string;
    phone: string;
    address: string;
    postal_code: string;
    contract_status: string;
    priority: string;
    scheduled_date: string | null;
    assigned_to: string | null;
    created_at: string;
    package?: {
        name: string;
    };
}

const statusLabels: Record<string, { label: string; color: string }> = {
    'NEW': { label: 'Nuevo', color: 'bg-blue-100 text-blue-800' },
    'VALIDATION': { label: 'Validando', color: 'bg-yellow-100 text-yellow-800' },
    'CONTACTED': { label: 'Contactado', color: 'bg-purple-100 text-purple-800' },
    'SCHEDULED': { label: 'Agendado', color: 'bg-indigo-100 text-indigo-800' },
    'IN_ROUTE': { label: 'En Camino', color: 'bg-cyan-100 text-cyan-800' },
    'INSTALLED': { label: 'Instalado', color: 'bg-green-100 text-green-800' },
    'CANCELLED': { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    'OUT_OF_COVERAGE': { label: 'Sin Cobertura', color: 'bg-gray-100 text-gray-800' },
    'DUPLICATE': { label: 'Duplicado', color: 'bg-gray-100 text-gray-800' },
};

const priorityLabels: Record<string, { label: string; color: string }> = {
    'low': { label: 'Baja', color: 'bg-gray-100 text-gray-600' },
    'normal': { label: 'Normal', color: 'bg-blue-100 text-blue-600' },
    'high': { label: 'Alta', color: 'bg-orange-100 text-orange-600' },
    'urgent': { label: 'Urgente', color: 'bg-red-100 text-red-600' },
};

export default function TicketsContratacionPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 15;

    useEffect(() => {
        fetchTickets();
    }, [page, statusFilter]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('tickets')
                .select(`
                    *,
                    package:service_packages(name)
                `, { count: 'exact' })
                .eq('type', 'contract')
                .order('created_at', { ascending: false })
                .range((page - 1) * limit, page * limit - 1);

            if (statusFilter) {
                query = query.eq('contract_status', statusFilter);
            }

            if (search) {
                query = query.or(`folio.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`);
            }

            const { data, count, error } = await query;

            if (error) throw error;

            setTickets(data || []);
            setTotal(count || 0);
            setTotalPages(Math.ceil((count || 0) / limit));
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchTickets();
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
                // Remove from local state immediately
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tickets de Contratación</h1>
                    <p className="text-gray-500">{total} solicitudes en total</p>
                </div>
                <button
                    onClick={() => fetchTickets()}
                    className="btn-outline inline-flex items-center gap-2"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                    Actualizar
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por folio, nombre o teléfono..."
                                className="input pl-10"
                            />
                        </div>
                    </form>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="input w-auto"
                        >
                            <option value="">Todos los estados</option>
                            {Object.entries(statusLabels).map(([value, { label }]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => { setStatusFilter('NEW'); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === 'NEW'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                    >
                        Nuevos
                    </button>
                    <button
                        onClick={() => { setStatusFilter('SCHEDULED'); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === 'SCHEDULED'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                    >
                        Agendados
                    </button>
                    <button
                        onClick={() => { setStatusFilter('INSTALLED'); setPage(1); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === 'INSTALLED'
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                    >
                        Instalados
                    </button>
                    <button
                        onClick={() => { setStatusFilter(''); setPage(1); }}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No se encontraron tickets</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Folio</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paquete</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prioridad</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tickets.map((ticket) => (
                                    <motion.tr
                                        key={ticket.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-4">
                                            <span className="font-mono font-semibold text-primary">
                                                {ticket.folio}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{ticket.full_name}</p>
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <PhoneIcon className="w-3 h-3" />
                                                    {ticket.phone}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm text-gray-600">
                                                {ticket.package?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`badge ${statusLabels[ticket.contract_status]?.color || 'bg-gray-100'}`}>
                                                {statusLabels[ticket.contract_status]?.label || ticket.contract_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`badge ${priorityLabels[ticket.priority]?.color || 'bg-gray-100'}`}>
                                                {priorityLabels[ticket.priority]?.label || ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm">
                                                <p className="text-gray-900">
                                                    {new Date(ticket.created_at).toLocaleDateString('es-MX')}
                                                </p>
                                                <p className="text-gray-500">
                                                    {new Date(ticket.created_at).toLocaleTimeString('es-MX', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/tickets/contratacion/${ticket.id}`}
                                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                    Ver
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(ticket.id, ticket.folio)}
                                                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 hover:underline"
                                                    title="Eliminar ticket"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                        <p className="text-sm text-gray-600">
                            Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <span className="px-4 py-2 text-sm">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
