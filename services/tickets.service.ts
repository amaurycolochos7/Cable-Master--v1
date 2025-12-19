/**
 * Tickets Service - Data access layer for tickets
 */

import { supabase } from '@/lib/supabase';

export interface TicketFilters {
    type: 'contract' | 'fault';
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    totalPages: number;
}

export const ticketsService = {
    /**
     * Get paginated list of contract tickets
     */
    async getContratos(filters: Omit<TicketFilters, 'type'>): Promise<PaginatedResult<any>> {
        const { status, search, page = 1, limit = 15 } = filters;

        let query = supabase
            .from('tickets')
            .select(`
                *,
                package:service_packages(name)
            `, { count: 'exact' })
            .eq('type', 'contract')
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (status) {
            query = query.eq('contract_status', status);
        }

        if (search) {
            query = query.or(`folio.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        };
    },

    /**
     * Get paginated list of fault tickets
     */
    async getFallas(filters: Omit<TicketFilters, 'type'>): Promise<PaginatedResult<any>> {
        const { status, page = 1, limit = 15 } = filters;

        let query = supabase
            .from('tickets')
            .select('*', { count: 'exact' })
            .eq('type', 'fault')
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (status) {
            query = query.eq('fault_status', status);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        };
    },

    /**
     * Get ticket by ID with related data
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                package:service_packages(name, monthly_price),
                assignee:profiles!tickets_assigned_to_fkey(full_name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get status history for a ticket
     */
    async getStatusHistory(ticketId: string) {
        const { data, error } = await supabase
            .from('ticket_status_history')
            .select(`
                *,
                changed_by_profile:profiles(full_name)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get events for a ticket
     */
    async getEvents(ticketId: string) {
        const { data, error } = await supabase
            .from('ticket_events')
            .select(`
                *,
                created_by_profile:profiles(full_name)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Update ticket status
     */
    async updateStatus(
        ticketId: string,
        ticketType: 'contract' | 'fault',
        newStatus: string,
        previousStatus: string,
        userId: string,
        reason?: string,
        scheduleData?: { date?: string; timeStart?: string; timeEnd?: string }
    ) {
        const statusField = ticketType === 'contract' ? 'contract_status' : 'fault_status';

        // Update ticket
        const updateData: any = { [statusField]: newStatus };

        if (newStatus === 'SCHEDULED' && scheduleData?.date) {
            updateData.scheduled_date = scheduleData.date;
            updateData.scheduled_time_start = scheduleData.timeStart || null;
            updateData.scheduled_time_end = scheduleData.timeEnd || null;
        }

        const { error: updateError } = await supabase
            .from('tickets')
            .update(updateData)
            .eq('id', ticketId);

        if (updateError) throw updateError;

        // Add status history
        await supabase.from('ticket_status_history').insert({
            ticket_id: ticketId,
            previous_status: previousStatus,
            new_status: newStatus,
            change_reason: reason || null,
            changed_by: userId,
        });

        // Add event
        await supabase.from('ticket_events').insert({
            ticket_id: ticketId,
            event_type: 'status_change',
            title: `Estado cambiado a ${newStatus}`,
            content: reason || null,
            created_by: userId,
        });
    },

    /**
     * Add note to ticket
     */
    async addNote(ticketId: string, note: string, isPublic: boolean, userId: string) {
        await supabase.from('ticket_events').insert({
            ticket_id: ticketId,
            event_type: isPublic ? 'note_public' : 'note_internal',
            content: note,
            is_visible_to_customer: isPublic,
            created_by: userId,
        });

        // If public, update public_note on ticket
        if (isPublic) {
            await supabase
                .from('tickets')
                .update({ public_note: note })
                .eq('id', ticketId);
        }
    },
};
