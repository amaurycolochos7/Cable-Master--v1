'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Banner {
    id: string;
    title: string | null;
    subtitle: string | null;
    cta_text: string | null;
    background_color: string | null;
}

export default function TopBanner() {
    const [banner, setBanner] = useState<Banner | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const fetchBanner = async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('banners')
                .select('id, title, subtitle, cta_text, background_color')
                .eq('is_active', true)
                .eq('type', 'bar')
                .or(`show_from.is.null,show_from.lte.${now}`)
                .or(`show_until.is.null,show_until.gte.${now}`)
                .order('sort_order', { ascending: true })
                .limit(1)
                .single();

            if (!error && data) {
                setBanner(data);
            }
        };

        fetchBanner();
    }, []);

    if (!banner || dismissed) {
        return null;
    }

    return (
        <div
            className="relative py-2 px-4 text-center text-white text-sm font-medium"
            style={{ backgroundColor: banner.background_color || '#dc2626' }}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
                {banner.title && (
                    <span className="font-bold">{banner.title}</span>
                )}
                {banner.subtitle && (
                    <span className="opacity-90">{banner.subtitle}</span>
                )}
                {banner.cta_text && (
                    <Link
                        href={`/public/contratar?promo=${banner.id}`}
                        className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-semibold transition-colors"
                    >
                        {banner.cta_text}
                    </Link>
                )}
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Cerrar"
            >
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
}
