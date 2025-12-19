import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackFolioSchema } from '@/lib/schemas';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        // Strict rate limiting for tracking endpoint
        const ip = getClientIP(request);
        const { allowed, resetIn } = checkRateLimit(
            `trackFolio:${ip}`,
            RATE_LIMITS.trackFolio
        );

        if (!allowed) {
            return rateLimitResponse(resetIn);
        }

        const body = await request.json();

        // Validate input
        const result = trackFolioSchema.safeParse(body);
        if (!result.success) {
            // Generic response to avoid information leakage
            return NextResponse.json(
                { error: 'Datos inválidos. Verifica el folio y los dígitos de tu teléfono.' },
                { status: 400 }
            );
        }

        const { folio, phone_last4 } = result.data;

        // Query ticket with phone verification
        const { data: ticket, error } = await supabase
            .from('tickets')
            .select(`
                id,
                folio,
                type,
                full_name,
                contract_status,
                fault_status,
                scheduled_date,
                scheduled_time_start,
                scheduled_time_end,
                public_note,
                created_at,
                updated_at
            `)
            .eq('folio', folio)
            .eq('phone_last4', phone_last4)
            .single();

        if (error || !ticket) {
            // Generic error to prevent enumeration
            return NextResponse.json(
                {
                    error: 'No se encontró la solicitud. Verifica que el folio y los dígitos sean correctos.',
                    found: false
                },
                { status: 404 }
            );
        }

        // Get status history for timeline
        const { data: statusHistory } = await supabase
            .from('ticket_status_history')
            .select('new_status, created_at')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });

        // Get public-visible events
        const { data: publicEvents } = await supabase
            .from('ticket_events')
            .select('event_type, title, content, created_at')
            .eq('ticket_id', ticket.id)
            .eq('is_visible_to_customer', true)
            .order('created_at', { ascending: true });

        // Determine current status
        const currentStatus = ticket.type === 'contract'
            ? ticket.contract_status
            : ticket.fault_status;

        // Build timeline
        const timeline = buildTimeline(
            ticket.type,
            currentStatus,
            statusHistory || [],
            publicEvents || []
        );

        // Build response (no sensitive data)
        return NextResponse.json({
            found: true,
            folio: ticket.folio,
            type: ticket.type,
            type_label: ticket.type === 'contract' ? 'Contratación' : 'Reporte de Falla',
            current_status: currentStatus,
            status_label: getStatusLabel(ticket.type, currentStatus),
            scheduled_date: ticket.scheduled_date,
            scheduled_time: ticket.scheduled_time_start
                ? `${ticket.scheduled_time_start} - ${ticket.scheduled_time_end}`
                : null,
            public_note: ticket.public_note,
            created_at: ticket.created_at,
            timeline,
        });

    } catch (error) {
        console.error('Track error:', error);
        return NextResponse.json(
            { error: 'Error al consultar. Intenta de nuevo.' },
            { status: 500 }
        );
    }
}

// Status labels in Spanish
function getStatusLabel(type: string, status: string): string {
    const contractLabels: Record<string, string> = {
        'NEW': 'Recibida',
        'VALIDATION': 'En validación',
        'CONTACTED': 'Contactado',
        'SCHEDULED': 'Cita agendada',
        'IN_ROUTE': 'Técnico en camino',
        'INSTALLED': 'Instalado ✓',
        'CANCELLED': 'Cancelado',
        'OUT_OF_COVERAGE': 'Fuera de cobertura',
        'DUPLICATE': 'Duplicado',
    };

    const faultLabels: Record<string, string> = {
        'NEW': 'Reportado',
        'DIAGNOSIS': 'En diagnóstico',
        'SCHEDULED': 'Visita agendada',
        'IN_PROGRESS': 'En reparación',
        'RESOLVED': 'Resuelto ✓',
        'CLOSED': 'Cerrado',
        'NOT_APPLICABLE': 'No aplica',
    };

    return type === 'contract'
        ? contractLabels[status] || status
        : faultLabels[status] || status;
}

// Build visual timeline for tracking
interface TimelineStep {
    status: string;
    label: string;
    completed: boolean;
    current: boolean;
    date?: string;
    note?: string;
}

function buildTimeline(
    type: string,
    currentStatus: string,
    statusHistory: Array<{ new_status: string; created_at: string }>,
    publicEvents: Array<{ event_type: string; content: string | null; created_at: string }>
): TimelineStep[] {
    // Define the steps for each ticket type
    const contractSteps = ['NEW', 'VALIDATION', 'CONTACTED', 'SCHEDULED', 'IN_ROUTE', 'INSTALLED'];
    const faultSteps = ['NEW', 'DIAGNOSIS', 'SCHEDULED', 'IN_PROGRESS', 'RESOLVED'];

    const steps = type === 'contract' ? contractSteps : faultSteps;
    const currentIndex = steps.indexOf(currentStatus);

    // Special case: terminal states not in main flow
    const terminalStates = ['CANCELLED', 'OUT_OF_COVERAGE', 'DUPLICATE', 'NOT_APPLICABLE', 'CLOSED'];
    const isTerminal = terminalStates.includes(currentStatus);

    return steps.map((status, index) => {
        const historyEntry = statusHistory.find(h => h.new_status === status);
        const relatedEvent = publicEvents.find(e =>
            e.event_type === 'note_public' &&
            new Date(e.created_at) >= new Date(historyEntry?.created_at || 0)
        );

        return {
            status,
            label: getStatusLabel(type, status),
            completed: isTerminal ? index <= currentIndex : index < currentIndex,
            current: status === currentStatus,
            date: historyEntry?.created_at,
            note: relatedEvent?.content || undefined,
        };
    });
}
