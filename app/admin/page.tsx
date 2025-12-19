'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    TicketIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ClockIcon,
    CalendarIcon,
    MapPinIcon,
    UsersIcon,
    ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Stats {
    ticketsContratacionHoy: number;
    ticketsContratacionPendientes: number;
    ticketsFallasHoy: number;
    ticketsFallasPendientes: number;
    instalacionesMes: number;
    coberturaActiva: number;
}

interface RecentTicket {
    id: string;
    folio: string;
    type: 'contract' | 'fault';
    full_name: string;
    contract_status?: string;
    fault_status?: string;
    created_at: string;
}

// Demo data for testing without Supabase
const DEMO_STATS: Stats = {
    ticketsContratacionHoy: 8,
    ticketsContratacionPendientes: 15,
    ticketsFallasHoy: 3,
    ticketsFallasPendientes: 7,
    instalacionesMes: 42,
    coberturaActiva: 64,
};

const DEMO_TICKETS: RecentTicket[] = [
    { id: '1', folio: 'CM-2024-0125', type: 'contract', full_name: 'María González López', contract_status: 'NEW', created_at: new Date().toISOString() },
    { id: '2', folio: 'CM-2024-0124', type: 'fault', full_name: 'Carlos Hernández', fault_status: 'DIAGNOSIS', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', folio: 'CM-2024-0123', type: 'contract', full_name: 'Ana Martínez Ruiz', contract_status: 'CONTACTED', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', folio: 'CM-2024-0122', type: 'fault', full_name: 'Roberto Díaz Peña', fault_status: 'SCHEDULED', created_at: new Date(Date.now() - 10800000).toISOString() },
    { id: '5', folio: 'CM-2024-0121', type: 'contract', full_name: 'Laura Sánchez', contract_status: 'VALIDATION', created_at: new Date(Date.now() - 14400000).toISOString() },
];

export default function AdminDashboard() {
    const { isDemoMode } = useAuth();
    const [stats, setStats] = useState<Stats>({
        ticketsContratacionHoy: 0,
        ticketsContratacionPendientes: 0,
        ticketsFallasHoy: 0,
        ticketsFallasPendientes: 0,
        instalacionesMes: 0,
        coberturaActiva: 0,
    });
    const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [isDemoMode]);

    const fetchDashboardData = async () => {
        // If in demo mode, use demo data
        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
            setStats(DEMO_STATS);
            setRecentTickets(DEMO_TICKETS);
            setLoading(false);
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            // Fetch contract tickets today
            const { count: contractToday } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'contract')
                .gte('created_at', today);

            // Fetch pending contract tickets
            const { count: contractPending } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'contract')
                .in('contract_status', ['NEW', 'VALIDATION', 'CONTACTED']);

            // Fetch fault tickets today
            const { count: faultToday } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'fault')
                .gte('created_at', today);

            // Fetch pending fault tickets
            const { count: faultPending } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'fault')
                .in('fault_status', ['NEW', 'DIAGNOSIS', 'SCHEDULED']);

            // Fetch installations this month
            const { count: installations } = await supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('type', 'contract')
                .eq('contract_status', 'INSTALLED')
                .gte('updated_at', firstDayOfMonth);

            // Fetch active coverage areas
            const { count: coverage } = await supabase
                .from('postal_codes')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true)
                .in('coverage_status', ['available', 'partial']);

            // Fetch recent tickets
            const { data: tickets } = await supabase
                .from('tickets')
                .select('id, folio, type, full_name, contract_status, fault_status, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                ticketsContratacionHoy: contractToday || 0,
                ticketsContratacionPendientes: contractPending || 0,
                ticketsFallasHoy: faultToday || 0,
                ticketsFallasPendientes: faultPending || 0,
                instalacionesMes: installations || 0,
                coberturaActiva: coverage || 0,
            });

            setRecentTickets(tickets || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Fallback to demo data on error
            setStats(DEMO_STATS);
            setRecentTickets(DEMO_TICKETS);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Contrataciones Hoy',
            value: stats.ticketsContratacionHoy,
            icon: TicketIcon,
            color: 'bg-blue-500',
            link: '/admin/tickets/contratacion',
        },
        {
            title: 'Contrataciones Pendientes',
            value: stats.ticketsContratacionPendientes,
            icon: ClockIcon,
            color: 'bg-amber-500',
            link: '/admin/tickets/contratacion?status=pending',
        },
        {
            title: 'Fallas Hoy',
            value: stats.ticketsFallasHoy,
            icon: ExclamationTriangleIcon,
            color: 'bg-red-500',
            link: '/admin/tickets/fallas',
        },
        {
            title: 'Fallas Pendientes',
            value: stats.ticketsFallasPendientes,
            icon: ClockIcon,
            color: 'bg-orange-500',
            link: '/admin/tickets/fallas?status=pending',
        },
        {
            title: 'Instalaciones del Mes',
            value: stats.instalacionesMes,
            icon: CheckCircleIcon,
            color: 'bg-green-500',
            link: '/admin/tickets/contratacion?status=INSTALLED',
        },
        {
            title: 'Zonas con Cobertura',
            value: stats.coberturaActiva,
            icon: MapPinIcon,
            color: 'bg-purple-500',
            link: '/admin/cobertura',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Bienvenido al panel de administración de Cable Master
                    {isDemoMode && <span className="ml-2 text-amber-500 font-medium">(Modo Demo)</span>}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link
                            href={stat.link}
                            className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.color}`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Tickets */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Tickets Recientes
                        </h2>
                        <Link
                            href="/admin/tickets/contratacion"
                            className="text-sm text-primary hover:underline"
                        >
                            Ver todos →
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {recentTickets.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                No hay tickets recientes
                            </p>
                        ) : (
                            recentTickets.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={`/admin/tickets/${ticket.type === 'contract' ? 'contratacion' : 'fallas'}/${ticket.id}`}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${ticket.type === 'contract'
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                            : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                                            }`}>
                                            {ticket.type === 'contract'
                                                ? <TicketIcon className="w-5 h-5" />
                                                : <ExclamationTriangleIcon className="w-5 h-5" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{ticket.folio}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.full_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`badge ${(ticket.contract_status === 'NEW' || ticket.fault_status === 'NEW')
                                            ? 'badge-warning'
                                            : 'badge-info'
                                            }`}>
                                            {ticket.contract_status || ticket.fault_status}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(ticket.created_at).toLocaleDateString('es-MX', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Acciones Rápidas
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/admin/tickets/contratacion"
                            className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            <TicketIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                Ver Contrataciones
                            </span>
                        </Link>

                        <Link
                            href="/admin/tickets/fallas"
                            className="flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        >
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400 mb-2" />
                            <span className="text-sm font-medium text-red-800 dark:text-red-300">
                                Ver Fallas
                            </span>
                        </Link>

                        <Link
                            href="/admin/cobertura"
                            className="flex flex-col items-center justify-center p-6 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                        >
                            <MapPinIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                                Editar Cobertura
                            </span>
                        </Link>

                        <Link
                            href="/admin/promociones"
                            className="flex flex-col items-center justify-center p-6 bg-amber-50 dark:bg-amber-900/30 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                        >
                            <ArrowTrendingUpIcon className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2" />
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                Promociones
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
