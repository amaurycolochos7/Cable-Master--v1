'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { CheckCircleIcon, SignalIcon, TvIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { supabase } from '@/lib/supabase';

interface Package {
    id: string;
    name: string;
    type: string;
    speed_mbps?: number;
    channels_count?: number;
    monthly_price: number;
    installation_fee?: number;
    features?: string[];
    is_active: boolean;
    locations?: string[];
}

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('Todas');
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<string[]>(['Todas']);

    // Fetch locations from database
    useEffect(() => {
        const fetchLocations = async () => {
            const { data, error } = await supabase
                .from('locations')
                .select('name')
                .eq('is_active', true)
                .order('name');

            if (!error && data) {
                setLocations(['Todas', ...data.map(l => l.name)]);
            }
        };
        fetchLocations();
    }, []);

    useEffect(() => {
        fetchPackages();
    }, [selectedLocation]);

    const fetchPackages = async () => {
        setLoading(true);

        try {
            // Fetch active packages from Supabase
            let query = supabase
                .from('service_packages')
                .select('*')
                .eq('is_active', true)
                .order('monthly_price');

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching packages:', error);
                setPackages([]);
            } else {
                // Filter by location if needed
                let filtered = data || [];
                if (selectedLocation !== 'Todas') {
                    filtered = filtered.filter(pkg =>
                        pkg.locations?.includes(selectedLocation)
                    );
                }
                setPackages(filtered);
            }
        } catch (err) {
            console.error('Error:', err);
            setPackages([]);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Nuestros Paquetes
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Encuentra el paquete perfecto para tus necesidades
                    </p>

                    {/* Location Filter */}
                    <div className="flex justify-center flex-wrap gap-2">
                        {locations.map((location) => (
                            <button
                                key={location}
                                onClick={() => setSelectedLocation(location)}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${selectedLocation === location
                                    ? 'bg-primary text-white shadow-lg scale-105'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
                                    }`}
                            >
                                {location}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                )}

                {/* Packages Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.map((pkg, index) => {
                            const isPopular = pkg.name?.toLowerCase().includes('verano');
                            return (
                                <motion.div
                                    key={pkg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className={`bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 flex flex-col h-full ${isPopular ? 'ring-4 ring-accent relative mt-6' : ''}`}
                                >
                                    {/* Popular Badge */}
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                                            <span className="bg-accent px-6 py-2 rounded-full text-gray-900 font-bold text-sm shadow-lg whitespace-nowrap">
                                                🔥 MÁS POPULAR
                                            </span>
                                        </div>
                                    )}

                                    {/* Type Badge */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-2">
                                            {(pkg.type === 'internet' || pkg.type === 'combo') && (
                                                <SignalIcon className="h-6 w-6 text-primary" />
                                            )}
                                            {(pkg.type === 'tv' || pkg.type === 'combo') && (
                                                <TvIcon className="h-6 w-6 text-secondary" />
                                            )}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pkg.type === 'combo' ? 'bg-purple-100 text-purple-700' :
                                            pkg.type === 'internet' ? 'bg-blue-100 text-blue-700' :
                                                'bg-pink-100 text-pink-700'
                                            }`}>
                                            {pkg.type === 'combo' ? 'Internet + TV' : pkg.type === 'internet' ? 'Solo Internet' : 'Solo TV'}
                                        </span>
                                    </div>

                                    {/* Content wrapper with flex-grow */}
                                    <div className="flex-grow">
                                        {/* Package Name */}
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                            {pkg.name}
                                        </h3>

                                        {/* Specs */}
                                        <div className="mb-4">
                                            {pkg.speed_mbps && pkg.speed_mbps > 0 && (
                                                <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
                                                    {pkg.speed_mbps} MEGAS
                                                </div>
                                            )}
                                            {pkg.channels_count && pkg.channels_count > 0 && (
                                                <div className="text-2xl font-semibold text-gray-700">
                                                    +{pkg.channels_count} Canales
                                                </div>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="mb-4">
                                            <div className="text-4xl font-bold text-primary mb-1">
                                                {formatCurrency(pkg.monthly_price)}
                                                <span className="text-lg text-gray-600">/mes</span>
                                            </div>
                                            {pkg.installation_fee === 0 && (
                                                <p className="text-sm text-green-600 font-semibold">
                                                    ✅ Instalación GRATIS
                                                </p>
                                            )}
                                        </div>

                                        {/* Features */}
                                        {pkg.features && pkg.features.length > 0 && (
                                            <ul className="space-y-2 mb-4">
                                                {pkg.features.slice(0, 4).map((feature: string, idx: number) => (
                                                    <li key={idx} className="flex items-start text-sm text-gray-700">
                                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* CTA Button - always at bottom */}
                                    <Link
                                        href="/public/contratar"
                                        className="block w-full text-center py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors mt-auto"
                                    >
                                        ¡Contratar Ahora!
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* No packages */}
                {!loading && packages.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-600">
                            No hay paquetes disponibles para {selectedLocation}.
                        </p>
                        <p className="text-gray-500 mt-2">
                            Selecciona otra localidad o contáctanos para más información.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
