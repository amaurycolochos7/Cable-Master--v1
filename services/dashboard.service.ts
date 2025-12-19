/**
 * Dashboard service - Supabase data access layer
 */

import { supabase } from '@/lib/supabase';
import type { DashboardStats, RecentTicket } from '@/types';

export const dashboardService = {
    /**
     * Fetch all dashboard statistics
     */
    async getStats(): Promise<DashboardStats> {
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
        ).toISOString();

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

        return {
            ticketsContratacionHoy: contractToday || 0,
            ticketsContratacionPendientes: contractPending || 0,
            ticketsFallasHoy: faultToday || 0,
            ticketsFallasPendientes: faultPending || 0,
            instalacionesMes: installations || 0,
            coberturaActiva: coverage || 0,
        };
    },

    /**
     * Fetch recent tickets for dashboard
     */
    async getRecentTickets(limit = 5): Promise<RecentTicket[]> {
        const { data, error } = await supabase
            .from('tickets')
            .select('id, folio, type, full_name, contract_status, fault_status, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },
};
