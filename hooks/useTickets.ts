/**
 * Custom hook for contract tickets list with filtering and pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { ticketsService } from '@/services';

interface UseTicketsOptions {
    type: 'contract' | 'fault';
    initialPage?: number;
    limit?: number;
}

export function useTickets(options: UseTicketsOptions) {
    const { type, initialPage = 1, limit = 15 } = options;

    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(initialPage);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const filters = { status: statusFilter, search, page, limit };
            const result = type === 'contract'
                ? await ticketsService.getContratos(filters)
                : await ticketsService.getFallas(filters);

            setTickets(result.data);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError(err instanceof Error ? err.message : 'Error fetching tickets');
        } finally {
            setLoading(false);
        }
    }, [type, statusFilter, search, page, limit]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleSearch = (searchTerm: string) => {
        setSearch(searchTerm);
        setPage(1);
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setPage(1);
    };

    const nextPage = () => {
        if (page < totalPages) setPage(p => p + 1);
    };

    const prevPage = () => {
        if (page > 1) setPage(p => p - 1);
    };

    return {
        tickets,
        loading,
        error,
        total,
        totalPages,
        page,
        statusFilter,
        search,
        setPage,
        setStatusFilter: handleStatusFilter,
        setSearch: handleSearch,
        nextPage,
        prevPage,
        refetch: fetchTickets,
    };
}
