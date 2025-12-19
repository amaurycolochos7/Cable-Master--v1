/**
 * Custom hook for dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/services';
import type { DashboardStats, RecentTicket } from '@/types';

const demoStats: DashboardStats = {
    ticketsContratacionHoy: 8,
    ticketsContratacionPendientes: 15,
    ticketsFallasHoy: 3,
    ticketsFallasPendientes: 7,
    instalacionesMes: 42,
    coberturaActiva: 64,
};

const demoTickets: RecentTicket[] = [
    { id: '1', folio: 'CM-2024-0125', type: 'contract', full_name: 'María González López', contract_status: 'NEW', created_at: new Date().toISOString() },
    { id: '2', folio: 'CM-2024-0124', type: 'fault', full_name: 'Carlos Hernández', fault_status: 'DIAGNOSIS', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', folio: 'CM-2024-0123', type: 'contract', full_name: 'Ana Martínez Ruiz', contract_status: 'CONTACTED', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', folio: 'CM-2024-0122', type: 'fault', full_name: 'Roberto Díaz Peña', fault_status: 'SCHEDULED', created_at: new Date(Date.now() - 10800000).toISOString() },
    { id: '5', folio: 'CM-2024-0121', type: 'contract', full_name: 'Laura Sánchez', contract_status: 'VALIDATION', created_at: new Date(Date.now() - 14400000).toISOString() },
];

interface UseDashboardReturn {
    stats: DashboardStats;
    recentTickets: RecentTicket[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

interface UseDashboardOptions {
    isDemoMode?: boolean;
}

const initialStats: DashboardStats = {
    ticketsContratacionHoy: 0,
    ticketsContratacionPendientes: 0,
    ticketsFallasHoy: 0,
    ticketsFallasPendientes: 0,
    instalacionesMes: 0,
    coberturaActiva: 0,
};

export function useDashboard(options: UseDashboardOptions = {}): UseDashboardReturn {
    const { isDemoMode = false } = options;
    const [stats, setStats] = useState<DashboardStats>(initialStats);
    const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        // If in demo mode, use demo data
        if (isDemoMode) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
            setStats(demoStats);
            setRecentTickets(demoTickets);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [statsData, ticketsData] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getRecentTickets(),
            ]);
            setStats(statsData);
            setRecentTickets(ticketsData);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            // Fallback to demo data on error
            setStats(demoStats);
            setRecentTickets(demoTickets);
            setError(err instanceof Error ? err.message : 'Error fetching dashboard');
        } finally {
            setLoading(false);
        }
    }, [isDemoMode]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        stats,
        recentTickets,
        loading,
        error,
        refetch: fetchDashboardData,
    };
}
