'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowLeftIcon,
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    ChatBubbleLeftIcon,
    PaperClipIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Ticket {
    id: string;
    folio: string;
    type: string;
    full_name: string;
    phone: string;
    email: string | null;
    address: string;
    postal_code: string | null;
    community: string | null;
    municipality: string | null;
    references_text: string | null;
    contract_status: string;
    priority: string;
    scheduled_date: string | null;
    scheduled_time_start: string | null;
    scheduled_time_end: string | null;
    public_note: string | null;
    assigned_to: string | null;
    preferred_schedule: string | null;
    created_at: string;
    updated_at: string;
    package?: { name: string; monthly_price: number };
    assignee?: { full_name: string };
}

interface StatusHistory {
    id: string;
    previous_status: string | null;
    new_status: string;
    change_reason: string | null;
    created_at: string;
    changed_by_profile?: { full_name: string };
}

interface TicketEvent {
    id: string;
    event_type: string;
    title: string | null;
    content: string | null;
    is_visible_to_customer: boolean;
    created_at: string;
    created_by_profile?: { full_name: string };
}

const statusLabels: Record<string, { label: string; color: string }> = {
    'CONTACTED': { label: 'Contactado', color: 'bg-purple-500' },
    'SCHEDULED': { label: 'Agendado', color: 'bg-indigo-500' },
    'IN_ROUTE': { label: 'En Camino', color: 'bg-cyan-500' },
    'INSTALLED': { label: 'Instalado', color: 'bg-green-500' },
    'CANCELLED': { label: 'Cancelado', color: 'bg-red-500' },
    'OUT_OF_COVERAGE': { label: 'Sin Cobertura', color: 'bg-gray-500' },
    'DUPLICATE': { label: 'Duplicado', color: 'bg-gray-500' },
};

// Main visual flow for progress bar
const statusFlow = ['CONTACTED', 'SCHEDULED', 'IN_ROUTE', 'INSTALLED'];

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const ticketId = params.id as string;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
    const [events, setEvents] = useState<TicketEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'notes'>('details');

    // Modals state
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusReason, setStatusReason] = useState('');
    const [newNote, setNewNote] = useState('');
    const [noteIsPublic, setNoteIsPublic] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTimeStart, setScheduleTimeStart] = useState('');
    const [scheduleTimeEnd, setScheduleTimeEnd] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (ticketId) {
            fetchTicketData();
        }
    }, [ticketId]);

    const fetchTicketData = async () => {
        setLoading(true);
        try {
            // Fetch ticket
            const { data: ticketData, error: ticketError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    package:service_packages(name, monthly_price),
                    assignee:profiles!tickets_assigned_to_fkey(full_name)
                `)
                .eq('id', ticketId)
                .single();

            if (ticketError) throw ticketError;
            setTicket(ticketData);

            // Fetch status history
            const { data: historyData } = await supabase
                .from('ticket_status_history')
                .select(`
                    *,
                    changed_by_profile:profiles(full_name)
                `)
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: false });

            setStatusHistory(historyData || []);

            // Fetch events
            const { data: eventsData } = await supabase
                .from('ticket_events')
                .select(`
                    *,
                    created_by_profile:profiles(full_name)
                `)
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: false });

            setEvents(eventsData || []);

        } catch (error) {
            console.error('Error fetching ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async () => {
        if (!newStatus || !ticket) return;
        setUpdating(true);

        try {
            // Update ticket status
            const { error: updateError } = await supabase
                .from('tickets')
                .update({
                    contract_status: newStatus,
                    ...(newStatus === 'SCHEDULED' && scheduleDate ? {
                        scheduled_date: scheduleDate,
                        scheduled_time_start: scheduleTimeStart || null,
                        scheduled_time_end: scheduleTimeEnd || null,
                    } : {})
                })
                .eq('id', ticket.id);

            if (updateError) throw updateError;

            // Add status history
            await supabase.from('ticket_status_history').insert({
                ticket_id: ticket.id,
                previous_status: ticket.contract_status,
                new_status: newStatus,
                change_reason: statusReason || null,
                changed_by: profile?.id,
            });

            // Add event
            await supabase.from('ticket_events').insert({
                ticket_id: ticket.id,
                event_type: 'status_change',
                title: `Estado cambiado a ${statusLabels[newStatus]?.label || newStatus}`,
                content: statusReason || null,
                created_by: profile?.id,
            });

            setShowStatusModal(false);
            setNewStatus('');
            setStatusReason('');
            fetchTicketData();

        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote || !ticket) return;
        setUpdating(true);

        try {
            await supabase.from('ticket_events').insert({
                ticket_id: ticket.id,
                event_type: noteIsPublic ? 'note_public' : 'note_internal',
                content: newNote,
                is_visible_to_customer: noteIsPublic,
                created_by: profile?.id,
            });

            // If public, also update public_note on ticket
            if (noteIsPublic) {
                await supabase
                    .from('tickets')
                    .update({ public_note: newNote })
                    .eq('id', ticket.id);
            }

            setShowNoteModal(false);
            setNewNote('');
            setNoteIsPublic(false);
            fetchTicketData();

        } catch (error) {
            console.error('Error adding note:', error);
            alert('Error al agregar nota');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Ticket no encontrado</p>
                <Link href="/admin/tickets/contratacion" className="text-primary hover:underline mt-4 inline-block">
                    ← Volver a la lista
                </Link>
            </div>
        );
    }

    const currentStatusIndex = statusFlow.indexOf(ticket.contract_status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/tickets/contratacion"
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{ticket.folio}</h1>
                        <p className="text-gray-500">Ticket de Contratación</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowNoteModal(true)}
                        className="btn-outline"
                    >
                        <ChatBubbleLeftIcon className="w-5 h-5 mr-2" />
                        Agregar Nota
                    </button>
                    <button
                        onClick={() => setShowStatusModal(true)}
                        className="btn-primary"
                    >
                        Cambiar Estado
                    </button>
                </div>
            </div>

            {/* Status Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Progreso</h2>
                <div className="flex items-center justify-between">
                    {statusFlow.map((status, index) => {
                        const isCompleted = index < currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;
                        const statusInfo = statusLabels[status];

                        return (
                            <div key={status} className="flex items-center flex-1">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500' :
                                        isCurrent ? statusInfo.color :
                                            'bg-gray-200'
                                        }`}>
                                        {isCompleted ? (
                                            <CheckCircleIcon className="w-6 h-6 text-white" />
                                        ) : (
                                            <span className="text-white font-semibold">{index + 1}</span>
                                        )}
                                    </div>
                                    <span className={`text-xs mt-2 ${isCurrent ? 'font-semibold text-gray-900' : 'text-gray-500'
                                        }`}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                                {index < statusFlow.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="border-b">
                    <nav className="flex gap-4 px-6">
                        {[
                            { id: 'details', label: 'Detalles' },
                            { id: 'timeline', label: 'Historial' },
                            { id: 'notes', label: 'Notas' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="font-semibold text-gray-900">Datos del Cliente</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Nombre</p>
                                            <p className="font-medium">{ticket.full_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <PhoneIcon className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-500">Teléfono</p>
                                            <a href={`tel:${ticket.phone}`} className="font-medium text-primary">
                                                {ticket.phone}
                                            </a>
                                        </div>
                                    </div>
                                    {ticket.email && (
                                        <div className="flex items-center gap-3">
                                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500">Email</p>
                                                <a href={`mailto:${ticket.email}`} className="font-medium text-primary">
                                                    {ticket.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-3">
                                        <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-500">Dirección</p>
                                            <p className="font-medium">{ticket.address}</p>
                                            {ticket.postal_code && (
                                                <p className="text-sm text-gray-500">CP: {ticket.postal_code}</p>
                                            )}
                                            {ticket.references_text && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Ref: {ticket.references_text}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-semibold text-gray-900">Datos del Servicio</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500">Paquete Seleccionado</p>
                                        <p className="font-semibold text-lg">{ticket.package?.name || 'No especificado'}</p>
                                        {ticket.package?.monthly_price && (
                                            <p className="text-primary font-bold">${ticket.package.monthly_price}/mes</p>
                                        )}
                                    </div>
                                    {ticket.scheduled_date && (
                                        <div className="flex items-center gap-3">
                                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500">Fecha Agendada</p>
                                                <p className="font-medium">
                                                    {new Date(ticket.scheduled_date).toLocaleDateString('es-MX', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                {ticket.scheduled_time_start && (
                                                    <p className="text-sm text-gray-500">
                                                        {ticket.scheduled_time_start} - {ticket.scheduled_time_end}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {ticket.preferred_schedule && (
                                        <div className="flex items-center gap-3">
                                            <ClockIcon className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500">Horario Preferido</p>
                                                <p className="font-medium">
                                                    {ticket.preferred_schedule === 'morning' ? 'Mañana' : 'Tarde'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-500 border-t pt-4 mt-4">
                                        <p>Creado: {new Date(ticket.created_at).toLocaleString('es-MX')}</p>
                                        <p>Actualizado: {new Date(ticket.updated_at).toLocaleString('es-MX')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-4">
                            {statusHistory.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No hay historial de estados</p>
                            ) : (
                                statusHistory.map((history, index) => (
                                    <div key={history.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full ${statusLabels[history.new_status]?.color || 'bg-gray-400'
                                                }`} />
                                            {index < statusHistory.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 mt-2" />
                                            )}
                                        </div>
                                        <div className="pb-6">
                                            <p className="font-medium">
                                                {statusLabels[history.new_status]?.label || history.new_status}
                                            </p>
                                            {history.change_reason && (
                                                <p className="text-sm text-gray-600 mt-1">{history.change_reason}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(history.created_at).toLocaleString('es-MX')}
                                                {history.changed_by_profile && ` • ${history.changed_by_profile.full_name}`}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Notes Tab */}
                    {activeTab === 'notes' && (
                        <div className="space-y-4">
                            {events.filter(e => e.event_type.includes('note')).length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No hay notas</p>
                            ) : (
                                events
                                    .filter(e => e.event_type.includes('note'))
                                    .map((event) => (
                                        <div key={event.id} className={`p-4 rounded-lg ${event.is_visible_to_customer
                                            ? 'bg-green-50 border border-green-200'
                                            : 'bg-gray-50'
                                            }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="text-gray-900">{event.content}</p>
                                                </div>
                                                {event.is_visible_to_customer && (
                                                    <span className="badge badge-success ml-4">Pública</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(event.created_at).toLocaleString('es-MX')}
                                                {event.created_by_profile && ` • ${event.created_by_profile.full_name}`}
                                            </p>
                                        </div>
                                    ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-semibold mb-4">Cambiar Estado</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Nuevo Estado</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="input"
                                >
                                    <option value="">Seleccionar...</option>
                                    {Object.entries(statusLabels).map(([value, { label }]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            {newStatus === 'SCHEDULED' && (
                                <>
                                    <div>
                                        <label className="label">Fecha</label>
                                        <input
                                            type="date"
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            className="input"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Hora Inicio</label>
                                            <input
                                                type="time"
                                                value={scheduleTimeStart}
                                                onChange={(e) => setScheduleTimeStart(e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Hora Fin</label>
                                            <input
                                                type="time"
                                                value={scheduleTimeEnd}
                                                onChange={(e) => setScheduleTimeEnd(e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="label">Motivo (opcional)</label>
                                <textarea
                                    value={statusReason}
                                    onChange={(e) => setStatusReason(e.target.value)}
                                    className="input"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="btn-outline flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleStatusChange}
                                disabled={!newStatus || updating}
                                className="btn-primary flex-1 disabled:opacity-50"
                            >
                                {updating ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Add Note Modal */}
            {showNoteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-semibold mb-4">Agregar Nota</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Nota</label>
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="input"
                                    rows={4}
                                    placeholder="Escribe tu nota aquí..."
                                />
                            </div>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={noteIsPublic}
                                    onChange={(e) => setNoteIsPublic(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm">
                                    <strong>Nota pública</strong> - El cliente podrá ver esta nota en el seguimiento
                                </span>
                            </label>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowNoteModal(false)}
                                className="btn-outline flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddNote}
                                disabled={!newNote || updating}
                                className="btn-primary flex-1 disabled:opacity-50"
                            >
                                {updating ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
