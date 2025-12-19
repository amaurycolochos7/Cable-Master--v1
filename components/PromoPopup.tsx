'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
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

export default function PromoPopup() {
    const [banner, setBanner] = useState<Banner | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if popup was already dismissed in this session
        const dismissed = sessionStorage.getItem('popup_dismissed');
        if (dismissed) return;

        const fetchBanner = async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('banners')
                .select('id, title, subtitle, description, image_url, cta_text, background_color')
                .eq('is_active', true)
                .eq('type', 'popup')
                .or(`show_from.is.null,show_from.lte.${now}`)
                .or(`show_until.is.null,show_until.gte.${now}`)
                .order('sort_order', { ascending: true })
                .limit(1)
                .single();

            if (!error && data) {
                setBanner(data);
                // Show popup after 2 seconds
                setTimeout(() => setIsOpen(true), 2000);
            }
        };

        fetchBanner();
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('popup_dismissed', 'true');
    };

    if (!banner) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 z-50"
                    />

                    {/* Popup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
                    >
                        <div
                            className="rounded-2xl overflow-hidden shadow-2xl"
                            style={{ backgroundColor: banner.background_color || '#dc2626' }}
                        >
                            {/* Close button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors z-10"
                            >
                                <XMarkIcon className="w-5 h-5" />
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
                            <div className="p-6 text-white text-center">
                                {banner.title && (
                                    <h2 className="text-2xl font-bold mb-2">{banner.title}</h2>
                                )}
                                {banner.subtitle && (
                                    <p className="text-lg opacity-90 mb-2">{banner.subtitle}</p>
                                )}
                                {banner.description && (
                                    <p className="text-sm opacity-80 mb-4">{banner.description}</p>
                                )}

                                {banner.cta_text && (
                                    <Link
                                        href={`/public/contratar?promo=${banner.id}`}
                                        onClick={handleClose}
                                        className="inline-block px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                                    >
                                        {banner.cta_text}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
