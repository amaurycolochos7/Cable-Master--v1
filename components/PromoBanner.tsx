'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Banner {
    id: string;
    title: string;
    subtitle: string | null;
    link_url: string | null;
    link_text: string | null;
    position: string;
    background_color: string | null;
    text_color: string | null;
}

interface PromoBannerProps {
    position?: 'top' | 'popup' | 'floating';
}

export default function PromoBanner({ position = 'top' }: PromoBannerProps) {
    const [banner, setBanner] = useState<Banner | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveBanner();
    }, []);

    const fetchActiveBanner = async () => {
        const now = new Date().toISOString();

        // Fetch active banner for this position
        const { data } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true)
            .eq('position', position === 'top' ? 'home_hero' : position)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .limit(1)
            .single();

        if (data) {
            setBanner(data);
            // Check if user dismissed this banner
            const dismissed = localStorage.getItem(`banner_dismissed_${data.id}`);
            if (dismissed) setIsVisible(false);
        }
        setLoading(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        if (banner) {
            localStorage.setItem(`banner_dismissed_${banner.id}`, 'true');
        }
    };

    if (loading || !banner || !isVisible) return null;

    // Top banner style
    if (position === 'top') {
        return (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-gradient-to-r from-accent via-yellow-400 to-accent text-gray-900 relative overflow-hidden"
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-4 text-center">
                    <SparklesIcon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <p className="font-bold">{banner.title}</p>
                        {banner.subtitle && <p className="hidden sm:block">{banner.subtitle}</p>}
                        {banner.link_url && (
                            <Link
                                href={banner.link_url}
                                className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-800 transition"
                            >
                                {banner.link_text || 'Ver más'}
                            </Link>
                        )}
                    </div>
                    <button onClick={handleDismiss} className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        );
    }

    // Floating banner style
    if (position === 'floating') {
        return (
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ delay: 3 }}
                className="fixed bottom-6 right-6 z-50 max-w-sm"
            >
                <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                    <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center flex-shrink-0">
                            <MegaphoneIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">{banner.title}</p>
                            {banner.subtitle && <p className="text-gray-600 text-sm mt-1">{banner.subtitle}</p>}
                            {banner.link_url && (
                                <Link
                                    href={banner.link_url}
                                    className="inline-block mt-3 text-primary font-semibold hover:underline"
                                >
                                    {banner.link_text || 'Conocer más'} →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Popup modal style
    if (position === 'popup') {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={handleDismiss}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
                    >
                        <div className="bg-gradient-to-r from-primary to-secondary p-8 text-center text-white">
                            <SparklesIcon className="w-12 h-12 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold">{banner.title}</h2>
                        </div>
                        <div className="p-8 text-center">
                            {banner.subtitle && <p className="text-gray-600 mb-6">{banner.subtitle}</p>}
                            <div className="flex gap-4 justify-center">
                                {banner.link_url && (
                                    <Link
                                        href={banner.link_url}
                                        className="px-6 py-3 bg-primary text-white font-bold rounded-full hover:bg-primary/90"
                                    >
                                        {banner.link_text || '¡Lo quiero!'}
                                    </Link>
                                )}
                                <button onClick={handleDismiss} className="px-6 py-3 text-gray-500 hover:text-gray-700">
                                    Ahora no
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return null;
}
