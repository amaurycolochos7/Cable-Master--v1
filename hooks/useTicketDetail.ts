/**
 * Custom hook for ticket detail with status changes and notes
 */

import { useState, useEffect, useCallback } from 'react';
import { ticketsService } from '@/services';

export function useTicketDetail(ticketId: string) {
    const [ticket, setTicket] = useState<any | null>(null);
    const [statusHistory, setStatusHistory] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    const fetchTicketData = useCallback(async () => {
        if (!ticketId) return;

        setLoading(true);
        setError(null);

        try {
            const [ticketData, historyData, eventsData] = await Promise.all([
                ticketsService.getById(ticketId),
                ticketsService.getStatusHistory(ticketId),
                ticketsService.getEvents(ticketId),
            ]);

            setTicket(ticketData);
            setStatusHistory(historyData);
            setEvents(eventsData);
        } catch (err) {
            console.error('Error fetching ticket:', err);
            setError(err instanceof Error ? err.message : 'Error fetching ticket');
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        fetchTicketData();
    }, [fetchTicketData]);

    const updateStatus = async (
        newStatus: string,
        userId: string,
        reason?: string,
        scheduleData?: { date?: string; timeStart?: string; timeEnd?: string }
    ) => {
        if (!ticket) return;

        setUpdating(true);
        try {
            const ticketType = ticket.type as 'contract' | 'fault';
            const currentStatus = ticketType === 'contract' ? ticket.contract_status : ticket.fault_status;

            await ticketsService.updateStatus(
                ticketId,
                ticketType,
                newStatus,
                currentStatus,
                userId,
                reason,
                scheduleData
            );

            await fetchTicketData();
        } catch (err) {
            console.error('Error updating status:', err);
            throw err;
        } finally {
            setUpdating(false);
        }
    };

    const addNote = async (note: string, isPublic: boolean, userId: string) => {
        if (!ticket) return;

        setUpdating(true);
        try {
            await ticketsService.addNote(ticketId, note, isPublic, userId);
            await fetchTicketData();
        } catch (err) {
            console.error('Error adding note:', err);
            throw err;
        } finally {
            setUpdating(false);
        }
    };

    return {
        ticket,
        statusHistory,
        events,
        loading,
        error,
        updating,
        updateStatus,
        addNote,
        refetch: fetchTicketData,
    };
}
