'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPinIcon, CheckCircleIcon, XCircleIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Municipality {
    id: string;
    name: string;
    coverage_status: string;
}

interface PostalCode {
    id: string;
    code: string;
    coverage_status: string;
    municipality_id: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
    available: { label: 'Disponible', color: 'text-green-600', icon: CheckCircleIcon, bgColor: 'bg-green-500' },
    partial: { label: 'Cobertura Parcial', color: 'text-yellow-600', icon: ClockIcon, bgColor: 'bg-yellow-500' },
    coming_soon: { label: 'Próximamente', color: 'text-blue-600', icon: ClockIcon, bgColor: 'bg-blue-500' },
    not_available: { label: 'No Disponible', color: 'text-gray-600', icon: XCircleIcon, bgColor: 'bg-gray-400' },
};

// Chiapas municipalities coordinates (simplified)
const municipalityCoords: Record<string, { x: number; y: number }> = {
    'Tuxtla Gutiérrez': { x: 35, y: 45 },
    'San Cristóbal de las Casas': { x: 50, y: 35 },
    'Tapachula': { x: 70, y: 75 },
    'Comitán': { x: 60, y: 55 },
    'Chiapa de Corzo': { x: 38, y: 48 },
    'Palenque': { x: 55, y: 15 },
    'Ocosingo': { x: 60, y: 25 },
    'Tonalá': { x: 45, y: 80 },
    'Villaflores': { x: 30, y: 60 },
    'Cintalapa': { x: 20, y: 50 },
};

export default function CoberturaPage() {
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [postalCodes, setPostalCodes] = useState<PostalCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchCP, setSearchCP] = useState('');
    const [searchResult, setSearchResult] = useState<{ status: string; municipality?: string } | null>(null);
    const [selectedMuni, setSelectedMuni] = useState<Municipality | null>(null);
    const [hoveredMuni, setHoveredMuni] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: munis } = await supabase.from('municipalities').select('*').eq('is_active', true).order('name');
        const { data: cps } = await supabase.from('postal_codes').select('*');
        setMunicipalities(munis || []);
        setPostalCodes(cps || []);
        setLoading(false);
    };

    const handleSearch = () => {
        if (searchCP.length !== 5) return;

        const found = postalCodes.find(cp => cp.code === searchCP);
        if (found) {
            const muni = municipalities.find(m => m.id === found.municipality_id);
            setSearchResult({ status: found.coverage_status, municipality: muni?.name });
        } else {
            setSearchResult({ status: 'not_available' });
        }
    };

    const getStatusColor = (status: string) => statusConfig[status]?.bgColor || 'bg-gray-400';

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            {/* Hero */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Mapa de <span className="text-primary">Cobertura</span>
                        </h1>
                        <p className="text-white/60 text-lg mb-10">
                            Verifica si tenemos servicio en tu zona
                        </p>
                    </motion.div>

                    {/* Search Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="max-w-md mx-auto mb-16"
                    >
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                            <label className="text-white text-left block mb-2 font-medium">Ingresa tu código postal</label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchCP}
                                        onChange={(e) => {
                                            setSearchCP(e.target.value.replace(/\D/g, '').slice(0, 5));
                                            setSearchResult(null);
                                        }}
                                        placeholder="29000"
                                        maxLength={5}
                                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={searchCP.length !== 5}
                                    className="px-6 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/80 disabled:opacity-50 transition-all"
                                >
                                    Verificar
                                </button>
                            </div>

                            {/* Result */}
                            {searchResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-4 p-4 rounded-xl ${searchResult.status === 'available' ? 'bg-green-500/20' : 'bg-red-500/20'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {searchResult.status === 'available' ? (
                                            <CheckCircleIcon className="w-8 h-8 text-green-400" />
                                        ) : (
                                            <XCircleIcon className="w-8 h-8 text-red-400" />
                                        )}
                                        <div className="text-left">
                                            <p className="font-bold text-white">
                                                {statusConfig[searchResult.status]?.label || 'No disponible'}
                                            </p>
                                            {searchResult.municipality && (
                                                <p className="text-white/60 text-sm">{searchResult.municipality}</p>
                                            )}
                                        </div>
                                    </div>
                                    {searchResult.status === 'available' && (
                                        <Link
                                            href="/public/contratar"
                                            className="mt-3 block w-full py-3 bg-green-500 text-white font-bold rounded-xl text-center hover:bg-green-600"
                                        >
                                            ¡Contratar Ahora!
                                        </Link>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Interactive Map */}
            <section className="pb-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Visual Map */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                        >
                            <h2 className="text-xl font-bold text-white mb-4">Mapa de Cobertura - Chiapas</h2>
                            <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden">
                                {/* Chiapas silhouette (simplified) */}
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                                    <path
                                        d="M15,20 Q5,40 10,60 Q15,80 35,90 Q55,95 75,85 Q90,75 85,50 Q80,25 60,15 Q40,5 20,15 Z"
                                        fill="rgba(255,255,255,0.05)"
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="0.5"
                                    />
                                </svg>

                                {/* Municipality points */}
                                {municipalities.slice(0, 10).map((muni, i) => {
                                    const coords = municipalityCoords[muni.name] || { x: 30 + (i * 7), y: 30 + (i * 5) };
                                    return (
                                        <motion.div
                                            key={muni.id}
                                            className="absolute cursor-pointer group"
                                            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                                            onMouseEnter={() => setHoveredMuni(muni.name)}
                                            onMouseLeave={() => setHoveredMuni(null)}
                                            onClick={() => setSelectedMuni(muni)}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.5 + i * 0.05 }}
                                        >
                                            <motion.div
                                                className={`w-4 h-4 rounded-full ${getStatusColor(muni.coverage_status)} shadow-lg`}
                                                animate={{ scale: hoveredMuni === muni.name ? 1.5 : 1 }}
                                            />
                                            {hoveredMuni === muni.name && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-white rounded-lg shadow-lg whitespace-nowrap z-10">
                                                    <p className="text-sm font-semibold text-gray-900">{muni.name}</p>
                                                    <p className={`text-xs ${statusConfig[muni.coverage_status]?.color}`}>
                                                        {statusConfig[muni.coverage_status]?.label}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
                                        <span className="text-white/60 text-sm">{config.label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Municipality List */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10"
                        >
                            <h2 className="text-xl font-bold text-white mb-4">Municipios con Cobertura</h2>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {loading ? (
                                    <div className="flex justify-center py-10">
                                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                                    </div>
                                ) : (
                                    municipalities.map((muni) => {
                                        const config = statusConfig[muni.coverage_status] || statusConfig.not_available;
                                        const Icon = config.icon;
                                        return (
                                            <motion.div
                                                key={muni.id}
                                                onClick={() => setSelectedMuni(muni)}
                                                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${selectedMuni?.id === muni.id
                                                        ? 'bg-primary/20 border border-primary'
                                                        : 'bg-white/5 hover:bg-white/10'
                                                    }`}
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MapPinIcon className="w-5 h-5 text-white/60" />
                                                    <span className="text-white font-medium">{muni.name}</span>
                                                </div>
                                                <div className={`flex items-center gap-2 ${config.color}`}>
                                                    <Icon className="w-5 h-5" />
                                                    <span className="text-sm">{config.label}</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-10"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4">
                            ¿No encuentras tu zona?
                        </h2>
                        <p className="text-white/80 mb-6">
                            Contáctanos y te informamos sobre próximas expansiones
                        </p>
                        <a
                            href="tel:9612483470"
                            className="inline-block px-8 py-4 bg-white text-primary font-bold rounded-full hover:scale-105 transition-transform"
                        >
                            Llamar: 961 248 3470
                        </a>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
