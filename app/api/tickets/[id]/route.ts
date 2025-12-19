import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// DELETE a specific ticket by ID
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: 'ID de ticket requerido' },
                { status: 400 }
            );
        }

        // First, delete related records (status history, events)
        await supabase
            .from('ticket_status_history')
            .delete()
            .eq('ticket_id', id);

        await supabase
            .from('ticket_events')
            .delete()
            .eq('ticket_id', id);

        // Now delete the ticket
        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting ticket:', error);
            return NextResponse.json(
                { error: 'Error al eliminar el ticket' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Ticket eliminado correctamente'
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Error inesperado' },
            { status: 500 }
        );
    }
}

// GET a specific ticket by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: ticket, error } = await supabase
            .from('tickets')
            .select(`
                *,
                package:service_packages(name, type, speed_mbps, channels_count, monthly_price),
                assigned_user:profiles!tickets_assigned_to_fkey(full_name)
            `)
            .eq('id', id)
            .single();

        if (error || !ticket) {
            return NextResponse.json(
                { error: 'Ticket no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json(ticket);

    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'Error inesperado' },
            { status: 500 }
        );
    }
}
