import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkCoverageSchema } from '@/lib/schemas';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const ip = getClientIP(request);
        const { allowed, resetIn } = checkRateLimit(
            `coverageCheck:${ip}`,
            RATE_LIMITS.coverageCheck
        );

        if (!allowed) {
            return rateLimitResponse(resetIn);
        }

        const { searchParams } = new URL(request.url);
        const postalCode = searchParams.get('cp') || searchParams.get('postal_code');

        if (!postalCode) {
            return NextResponse.json(
                { error: 'Se requiere código postal' },
                { status: 400 }
            );
        }

        // Validate
        const result = checkCoverageSchema.safeParse({ postal_code: postalCode });
        if (!result.success) {
            return NextResponse.json(
                { error: 'Código postal inválido' },
                { status: 400 }
            );
        }

        // Query coverage
        const { data: coverage, error } = await supabase
            .from('postal_codes')
            .select(`
                id,
                code,
                coverage_status,
                available_packages,
                notes,
                municipality:municipalities(id, name, state),
                communities(id, name, coverage_status, estimated_date)
            `)
            .eq('code', postalCode)
            .eq('is_active', true)
            .single();

        if (error || !coverage) {
            // CP not found in system - might still have coverage
            return NextResponse.json({
                found: false,
                postal_code: postalCode,
                coverage_status: 'unknown',
                message: 'No tenemos información de cobertura para este código postal. Contáctanos para verificar.',
                contact_recommended: true,
            });
        }

        // Get available packages if there's coverage
        let packages = null;
        if (coverage.coverage_status === 'available' || coverage.coverage_status === 'partial') {
            if (coverage.available_packages && coverage.available_packages.length > 0) {
                const { data: pkgs } = await supabase
                    .from('service_packages')
                    .select('id, name, type, speed_mbps, channels_count, monthly_price, features')
                    .in('id', coverage.available_packages)
                    .eq('is_active', true);
                packages = pkgs;
            } else {
                // Get all active packages
                const { data: pkgs } = await supabase
                    .from('service_packages')
                    .select('id, name, type, speed_mbps, channels_count, monthly_price, features')
                    .eq('is_active', true);
                packages = pkgs;
            }
        }

        // Build response
        const statusMessages: Record<string, string> = {
            'available': '¡Excelente! Tenemos cobertura completa en tu zona.',
            'partial': 'Tenemos cobertura parcial en tu zona. Algunas colonias pueden no estar disponibles.',
            'coming_soon': 'Próximamente tendremos cobertura en tu zona. ¡Regístrate para ser notificado!',
            'not_available': 'Actualmente no tenemos cobertura en tu zona. Estamos expandiendo nuestra red.',
        };

        return NextResponse.json({
            found: true,
            postal_code: postalCode,
            coverage_status: coverage.coverage_status,
            message: statusMessages[coverage.coverage_status] || 'Consulta la cobertura de tu zona.',
            municipality: coverage.municipality,
            communities: coverage.communities,
            packages: packages,
            can_contract: coverage.coverage_status === 'available' || coverage.coverage_status === 'partial',
            contact_recommended: coverage.coverage_status !== 'available',
        });

    } catch (error) {
        console.error('Coverage check error:', error);
        return NextResponse.json(
            { error: 'Error al verificar cobertura' },
            { status: 500 }
        );
    }
}
