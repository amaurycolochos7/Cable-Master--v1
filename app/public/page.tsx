'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import {
    SignalIcon,
    TvIcon,
    BoltIcon,
    CheckCircleIcon,
    GlobeAltIcon,
    SparklesIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import BannerCarousel from '@/components/BannerCarousel';

// Speedtest-style gauge animation - Clean Arc Style
const SpeedGauge = () => {
    const [speed, setSpeed] = useState(0);
    const [phase, setPhase] = useState<'running' | 'complete'>('running');
    const targetSpeed = 300;

    useEffect(() => {
        let animationFrame: number;
        let startTime: number;
        const duration = 2500;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Smooth easing
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentSpeed = Math.round(easeOutQuart * targetSpeed);

            setSpeed(currentSpeed);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setPhase('complete');
            }
        };

        const timer = setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
        }, 500);

        return () => {
            clearTimeout(timer);
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    return (
        <div className="relative w-64 h-40 mx-auto">
            {/* Outer glow effect */}
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/30 via-primary/30 to-purple-500/30 blur-2xl"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Gauge SVG */}
            <svg viewBox="0 0 200 130" className="w-full h-full relative z-10">
                <defs>
                    {/* Arc gradient */}
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="40%" stopColor="#0094c6" />
                        <stop offset="70%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    {/* Glow filter */}
                    <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background arc */}
                <path
                    d="M 25 105 A 75 75 0 0 1 175 105"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="14"
                    strokeLinecap="round"
                />

                {/* Animated colored arc */}
                <motion.path
                    d="M 25 105 A 75 75 0 0 1 175 105"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    filter="url(#arcGlow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: speed / targetSpeed }}
                    transition={{ duration: 0.15, ease: "linear" }}
                />

                {/* Speed markers - positioned outside the arc */}
                <text x="15" y="118" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="500" textAnchor="middle">0</text>
                <text x="58" y="50" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="500" textAnchor="middle">100</text>
                <text x="142" y="50" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="500" textAnchor="middle">200</text>
                <text x="185" y="118" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="500" textAnchor="middle">300</text>
            </svg>

            {/* Center speed display */}
            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
                <motion.div
                    className="text-5xl font-black text-white leading-none"
                    animate={{
                        scale: phase === 'complete' ? [1, 1.1, 1] : 1
                    }}
                    transition={{ duration: 0.4 }}
                >
                    {speed}
                </motion.div>
                <motion.div
                    className="text-primary text-sm font-bold mt-1"
                    animate={{ opacity: phase === 'complete' ? [1, 0.6, 1] : 1 }}
                    transition={{ duration: 1.5, repeat: phase === 'complete' ? Infinity : 0 }}
                >
                    Mbps
                </motion.div>
            </div>
        </div>
    );
};

export default function PublicHomePage() {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const [packages, setPackages] = useState<any[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const { data, error } = await supabase
                    .from('service_packages')
                    .select('*')
                    .eq('is_active', true)
                    .order('monthly_price')
                    .limit(4);

                if (!error && data) {
                    setPackages(data);
                }
            } catch (err) {
                console.error('Error fetching packages:', err);
            }
            setPackagesLoading(false);
        };
        fetchPackages();
    }, []);

    const features = [
        { icon: BoltIcon, title: '100% Fibra Óptica', description: 'Velocidad y estabilidad garantizada', color: 'from-yellow-400 to-orange-500' },
        { icon: TvIcon, title: '+100 Canales HD', description: 'La mejor programación', color: 'from-purple-400 to-pink-500' },
        { icon: SignalIcon, title: 'Conexión Estable', description: 'Sin interrupciones', color: 'from-cyan-400 to-blue-500' },
        { icon: GlobeAltIcon, title: 'Cobertura Amplia', description: 'Toda la región', color: 'from-green-400 to-emerald-500' },
    ];

    return (
        <div>
            {/* Dynamic Banner Carousel - Shows promotions from database */}
            <BannerCarousel />

            {/* Hero Section - Light/Gradient Design */}
            <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-primary/30">
                {/* Animated accent orbs - subtle */}
                <motion.div
                    className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 8, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-20 right-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.3, 0.2] }}
                    transition={{ duration: 6, repeat: Infinity }}
                />

                <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div className="text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="inline-flex items-center gap-2 bg-accent/90 rounded-full px-4 py-2 mb-6"
                            >
                                <SparklesIcon className="w-4 h-4 text-gray-900" />
                                <span className="text-gray-900 text-sm font-bold">¡Promoción Especial!</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
                            >
                                LA MEJOR
                                <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
                                    PROGRAMACIÓN
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-xl text-white/80 mb-8"
                            >
                                Internet de alta velocidad por <span className="text-primary font-semibold">Fibra Óptica</span>
                                <br />+100 canales HD • Conexión ultra rápida
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                            >
                                <Link
                                    href="/public/contratar"
                                    className="px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-full text-white font-bold text-lg hover:scale-105 transition-transform shadow-lg"
                                >
                                    Contratar Ahora
                                </Link>
                                <Link
                                    href="/public/cobertura"
                                    className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-full text-white font-bold text-lg hover:bg-white/20 transition-all"
                                >
                                    Ver Cobertura
                                </Link>
                            </motion.div>
                        </div>

                        {/* Right - Speed Gauge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-col items-center"
                        >
                            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                                <p className="text-white/60 text-sm text-center mb-4">Velocidad de hasta</p>
                                <SpeedGauge />
                                <p className="text-white/80 text-center mt-4 font-semibold">Fibra Óptica Real</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Promo banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-16 text-center"
                    >
                        <div className="inline-block bg-gradient-to-r from-accent/90 to-yellow-400 px-8 py-3 rounded-full shadow-lg">
                            <p className="text-gray-900 font-bold">
                                🎉 Contrato + Primera Mensualidad <span className="underline">GRATIS</span>
                            </p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                >
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                            <motion.div className="w-1 h-2 bg-white rounded-full" animate={{ opacity: [1, 0] }} transition={{ duration: 1, repeat: Infinity }} />
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Section - LIGHT */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Por qué elegir Cable Master?</h2>
                        <p className="text-gray-600 text-lg">Tecnología de vanguardia y servicio de calidad</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10 }}
                                className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 border border-gray-100"
                            >
                                <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Packages Grid - LIGHT */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Elige tu Plan Ideal</h2>
                        <p className="text-gray-600 text-lg">Todos incluyen Internet + TV + Contrato GRATIS</p>
                    </motion.div>

                    {packagesLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : packages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {packages.map((pkg, index) => {
                                const isPopular = pkg.name?.includes('Premium') || pkg.name?.includes('Verano');
                                return (
                                    <motion.div
                                        key={pkg.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        className={`relative rounded-2xl p-8 ${isPopular
                                            ? 'bg-gradient-to-b from-primary to-primary/80 text-white shadow-xl scale-105'
                                            : 'bg-white border border-gray-200 shadow-sm'
                                            }`}
                                    >
                                        {isPopular && (
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent px-4 py-1 rounded-full text-gray-900 text-sm font-bold">
                                                Más Popular
                                            </div>
                                        )}
                                        <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</h3>
                                        {pkg.speed_mbps && (
                                            <div className={`text-5xl font-black mb-1 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                                                {pkg.speed_mbps}<span className="text-lg font-normal opacity-60">Mb</span>
                                            </div>
                                        )}
                                        {pkg.channels_count && (
                                            <div className={`mb-6 ${isPopular ? 'text-white/80' : 'text-gray-500'}`}>+ {pkg.channels_count} canales HD</div>
                                        )}
                                        <div className={`text-3xl font-bold mb-6 ${isPopular ? 'text-accent' : 'text-primary'}`}>
                                            ${pkg.monthly_price}<span className="text-sm font-normal opacity-60">/mes</span>
                                        </div>
                                        <Link
                                            href="/public/contratar"
                                            className={`block text-center py-3 rounded-xl font-bold transition-all ${isPopular
                                                ? 'bg-white text-primary hover:bg-gray-100'
                                                : 'bg-primary text-white hover:bg-primary/90'
                                                }`}
                                        >
                                            Contratar
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No hay paquetes disponibles en este momento.
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 bg-gradient-to-r from-primary to-secondary">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                        <h2 className="text-4xl font-bold text-white mb-6">¿Listo para la mejor conexión?</h2>
                        <p className="text-xl text-white/80 mb-10">Únete a miles de familias que ya disfrutan de Cable Master</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/public/contratar" className="px-10 py-4 bg-white text-primary font-bold text-lg rounded-full hover:scale-105 transition-transform">
                                Contratar Ahora
                            </Link>
                            <a href="tel:9612483470" className="px-10 py-4 bg-white/10 text-white font-bold text-lg rounded-full border border-white/30 hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                <PhoneIcon className="w-5 h-5" /> 961 248 3470
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
