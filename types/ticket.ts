/**
 * Ticket types for contracts and faults
 */

export type TicketType = 'contract' | 'fault';

export type ContractStatus = 'NEW' | 'VALIDATION' | 'CONTACTED' | 'SCHEDULED' | 'INSTALLED' | 'CANCELLED';
export type FaultStatus = 'NEW' | 'DIAGNOSIS' | 'SCHEDULED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export interface Ticket {
    id: string;
    folio: string;
    type: TicketType;
    full_name: string;
    phone: string;
    email?: string;
    address: string;
    location: string;
    contract_status?: ContractStatus;
    fault_status?: FaultStatus;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    assigned_to?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

export interface RecentTicket {
    id: string;
    folio: string;
    type: TicketType;
    full_name: string;
    contract_status?: ContractStatus;
    fault_status?: FaultStatus;
    created_at: string;
}

export interface DashboardStats {
    ticketsContratacionHoy: number;
    ticketsContratacionPendientes: number;
    ticketsFallasHoy: number;
    ticketsFallasPendientes: number;
    instalacionesMes: number;
    coberturaActiva: number;
}

export const DEMO_STATS: DashboardStats = {
    ticketsContratacionHoy: 8,
    ticketsContratacionPendientes: 15,
    ticketsFallasHoy: 3,
    ticketsFallasPendientes: 7,
    instalacionesMes: 42,
    coberturaActiva: 64,
};

export const DEMO_TICKETS: RecentTicket[] = [
    { id: '1', folio: 'CM-2024-0125', type: 'contract', full_name: 'María González López', contract_status: 'NEW', created_at: new Date().toISOString() },
    { id: '2', folio: 'CM-2024-0124', type: 'fault', full_name: 'Carlos Hernández', fault_status: 'DIAGNOSIS', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', folio: 'CM-2024-0123', type: 'contract', full_name: 'Ana Martínez Ruiz', contract_status: 'CONTACTED', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', folio: 'CM-2024-0122', type: 'fault', full_name: 'Roberto Díaz Peña', fault_status: 'SCHEDULED', created_at: new Date(Date.now() - 10800000).toISOString() },
    { id: '5', folio: 'CM-2024-0121', type: 'contract', full_name: 'Laura Sánchez', contract_status: 'VALIDATION', created_at: new Date(Date.now() - 14400000).toISOString() },
];
