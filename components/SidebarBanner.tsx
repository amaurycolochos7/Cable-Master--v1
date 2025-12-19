'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Banner {
    id: string;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    image_url: string | null;
    cta_text: string | null;
    background_color: string | null;
}

export default function SidebarBanner() {
    const [banner, setBanner] = useState<Banner | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if sidebar was dismissed in this session
        const wasDismissed = sessionStorage.getItem('sidebar_banner_dismissed');
        if (wasDismissed) {
            setDismissed(true);
            return;
        }

        const fetchBanner = async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('banners')
                .select('id, title, subtitle, description, image_url, cta_text, background_color')
                .eq('is_active', true)
                .eq('type', 'sidebar')
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

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem('sidebar_banner_dismissed', 'true');
    };

    if (!banner || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ delay: 1, type: 'spring', damping: 20 }}
                className="fixed right-4 bottom-24 z-40 w-72 hidden lg:block"
            >
                <div
                    className="rounded-xl overflow-hidden shadow-2xl border border-white/10"
                    style={{ backgroundColor: banner.background_color || '#dc2626' }}
                >
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>

                    {/* Image */}
                    {banner.image_url && (
                        <div className="aspect-video w-full">
                            <img
                                src={banner.image_url}
                                alt={banner.title || 'Promoción'}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-4 text-white">
                        {banner.title && (
                            <h3 className="font-bold text-lg leading-tight mb-1">{banner.title}</h3>
                        )}
                        {banner.subtitle && (
                            <p className="text-sm opacity-90 mb-1">{banner.subtitle}</p>
                        )}
                        {banner.description && (
                            <p className="text-xs opacity-75 mb-3">{banner.description}</p>
                        )}

                        {banner.cta_text && (
                            <Link
                                href={`/public/contratar?promo=${banner.id}`}
                                className="block w-full text-center px-4 py-2 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-sm"
                            >
                                {banner.cta_text}
                            </Link>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
