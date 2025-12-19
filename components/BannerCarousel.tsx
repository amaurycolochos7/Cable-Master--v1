'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Banner {
    id: string;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    image_url: string | null;
    cta_text: string | null;
    cta_url: string | null;
    background_color: string | null;
}

export default function BannerCarousel() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('banners')
                .select('id, title, subtitle, description, image_url, cta_text, cta_url, background_color')
                .eq('is_active', true)
                .eq('type', 'hero')
                .or(`show_from.is.null,show_from.lte.${now}`)
                .or(`show_until.is.null,show_until.gte.${now}`)
                .order('sort_order', { ascending: true });

            if (!error && data) {
                setBanners(data);
            }
            setLoading(false);
        };

        fetchBanners();
    }, []);

    // Auto-rotate banners
    useEffect(() => {
        if (banners.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [banners.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    }, [banners.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % banners.length);
    }, [banners.length]);

    if (loading) {
        return (
            <div className="h-[500px] bg-gradient-to-r from-primary to-secondary" />
        );
    }

    if (banners.length === 0) {
        return null; // No banners, don't render anything
    }

    const currentBanner = banners[currentIndex];

    return (
        <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBanner.id}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="relative min-h-[500px] flex items-center"
                    style={{
                        backgroundColor: currentBanner.background_color || '#dc2626',
                        backgroundImage: currentBanner.image_url
                            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${currentBanner.image_url})`
                            : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
                        <div className="max-w-3xl">
                            {currentBanner.title && (
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
                                >
                                    {currentBanner.title}
                                </motion.h1>
                            )}
                            {currentBanner.subtitle && (
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl md:text-3xl text-white/90 mb-4 font-semibold"
                                >
                                    {currentBanner.subtitle}
                                </motion.p>
                            )}
                            {currentBanner.description && (
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-lg text-white/80 mb-8"
                                >
                                    {currentBanner.description}
                                </motion.p>
                            )}
                            {currentBanner.cta_text && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <Link
                                        href={`/public/contratar?promo=${currentBanner.id}`}
                                        className="inline-block px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                                    >
                                        {currentBanner.cta_text}
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={goToPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all"
                        aria-label="Anterior"
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-white" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all"
                        aria-label="Siguiente"
                    >
                        <ChevronRightIcon className="w-6 h-6 text-white" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {banners.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white scale-125'
                                : 'bg-white/50 hover:bg-white/70'
                                }`}
                            aria-label={`Ir a banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
