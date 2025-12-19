'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    TruckIcon,
    WrenchScrewdriverIcon,
    ExclamationCircleIcon,
    CalendarIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { trackFolioSchema, type TrackFolio } from '@/lib/schemas';

interface TimelineStep {
    status: string;
    label: string;
    completed: boolean;
    current: boolean;
    date?: string;
    note?: string;
}

interface TrackingData {
    found: boolean;
    folio: string;
    type: string;
    type_label: string;
    current_status: string;
    status_label: string;
    scheduled_date?: string;
    scheduled_time?: string;
    public_note?: string;
    created_at: string;
    timeline: TimelineStep[];
}

function SeguimientoContent() {
    const searchParams = useSearchParams();
    const initialFolio = searchParams.get('folio') || '';

    const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<TrackFolio>({
        resolver: zodResolver(trackFolioSchema),
    });

    // Auto-fill folio from URL
    useEffect(() => {
        if (initialFolio) {
            setValue('folio', initialFolio);
        }
    }, [initialFolio, setValue]);

    const onSubmit = async (data: TrackFolio) => {
        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const res = await fetch('/api/tickets/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (res.status === 429) {
                setError('Demasiados intentos. Por favor espera un momento.');
                setTrackingData(null);
                return;
            }

            if (result.found) {
                setTrackingData(result);
            } else {
                setError(result.error || 'No se encontró la solicitud');
                setTrackingData(null);
            }
        } catch (err) {
            console.error('Tracking error:', err);
            setError('Error de conexión. Intenta de nuevo.');
            setTrackingData(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string, isCurrent: boolean) => {
        if (status.includes('INSTALLED') || status.includes('RESOLVED')) {
            return <CheckCircleIcon className={`w-6 h-6 ${isCurrent ? 'text-green-600' : 'text-green-400'}`} />;
        }
        if (status.includes('ROUTE')) {
            return <TruckIcon className={`w-6 h-6 ${isCurrent ? 'text-primary' : 'text-gray-400'}`} />;
        }
        if (status.includes('SCHEDULED')) {
            return <CalendarIcon className={`w-6 h-6 ${isCurrent ? 'text-primary' : 'text-gray-400'}`} />;
        }
        if (status.includes('PROGRESS') || status.includes('DIAGNOSIS')) {
            return <WrenchScrewdriverIcon className={`w-6 h-6 ${isCurrent ? 'text-primary' : 'text-gray-400'}`} />;
        }
        return <ClockIcon className={`w-6 h-6 ${isCurrent ? 'text-primary' : 'text-gray-400'}`} />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Seguimiento de <span className="gradient-text">Solicitud</span>
                    </h1>
                    <p className="text-xl text-gray-600">
                        Consulta el estado de tu solicitud
                    </p>
                </motion.div>

                {/* Search Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card mb-8"
                >
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="label text-gray-800 font-semibold">Número de Folio</label>
                            <input
                                {...register('folio')}
                                type="text"
                                placeholder="CON-2024-000001"
                                className="input-light text-lg uppercase tracking-wider"
                            />
                            {errors.folio && (
                                <p className="text-red-500 text-sm mt-1">{errors.folio.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label text-gray-800 font-semibold">Últimos 4 dígitos de tu teléfono</label>
                            <input
                                {...register('phone_last4')}
                                type="text"
                                maxLength={4}
                                placeholder="1234"
                                className="input-light text-2xl text-center tracking-[0.5em] font-mono"
                            />
                            {errors.phone_last4 && (
                                <p className="text-red-500 text-sm mt-1">{errors.phone_last4.message}</p>
                            )}
                            <p className="text-gray-600 text-sm mt-2">
                                Usamos esto para verificar que eres el titular de la solicitud.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Buscando...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                    Consultar Estado
                                </span>
                            )}
                        </button>
                    </form>
                </motion.div>

                {/* Error State */}
                <AnimatePresence>
                    {error && searched && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="card border-2 border-red-200 bg-red-50"
                        >
                            <div className="flex items-center gap-4">
                                <ExclamationCircleIcon className="w-12 h-12 text-red-500" />
                                <div>
                                    <h3 className="font-semibold text-red-800">No encontrado</h3>
                                    <p className="text-red-600">{error}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tracking Results */}
                <AnimatePresence>
                    {trackingData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Status Card */}
                            <div className="card mb-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500">Folio</p>
                                        <p className="text-2xl font-bold text-primary">{trackingData.folio}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Tipo</p>
                                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${trackingData.type === 'contract'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-orange-500 text-white'
                                            }`}>
                                            {trackingData.type_label}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 text-center">
                                    <p className="text-sm text-gray-500 mb-2">Estado Actual</p>
                                    <p className="text-3xl font-bold text-gray-900">{trackingData.status_label}</p>
                                </div>

                                {/* Scheduled Date */}
                                {trackingData.scheduled_date && (
                                    <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-4">
                                        <CalendarIcon className="w-8 h-8 text-blue-600" />
                                        <div>
                                            <p className="text-sm text-blue-600">Fecha programada</p>
                                            <p className="font-semibold text-blue-800">
                                                {new Date(trackingData.scheduled_date).toLocaleDateString('es-MX', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                                {trackingData.scheduled_time && ` - ${trackingData.scheduled_time}`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Public Note */}
                                {trackingData.public_note && (
                                    <div className="mt-6 p-4 bg-amber-50 rounded-lg flex items-start gap-4">
                                        <DocumentTextIcon className="w-8 h-8 text-amber-600 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-amber-600 mb-1">Nota del equipo</p>
                                            <p className="text-amber-800">{trackingData.public_note}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Timeline */}
                            <div className="card">
                                <h3 className="font-semibold text-lg mb-6">Progreso de tu solicitud</h3>

                                <div className="space-y-0">
                                    {trackingData.timeline.map((step, index) => (
                                        <div key={step.status} className="relative">
                                            {/* Connector Line */}
                                            {index < trackingData.timeline.length - 1 && (
                                                <div className={`absolute left-3 top-8 w-0.5 h-full ${step.completed ? 'bg-green-500' : 'bg-gray-300'
                                                    }`} />
                                            )}

                                            <div className={`flex items-start gap-4 p-4 rounded-lg transition-all ${step.current
                                                ? 'bg-red-50 border-2 border-red-500'
                                                : step.completed
                                                    ? 'bg-green-50'
                                                    : 'bg-gray-50'
                                                }`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed
                                                    ? 'bg-green-500'
                                                    : step.current
                                                        ? 'bg-red-500'
                                                        : 'bg-gray-400'
                                                    }`}>
                                                    {step.completed ? (
                                                        <CheckCircleIcon className="w-5 h-5 text-white" />
                                                    ) : step.current ? (
                                                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                                    ) : (
                                                        <div className="w-2 h-2 bg-white rounded-full" />
                                                    )}
                                                </div>

                                                <div className="flex-grow">
                                                    <p className={`font-medium ${step.current ? 'text-red-600' : step.completed ? 'text-green-700' : 'text-gray-600'
                                                        }`}>
                                                        {step.label}
                                                    </p>
                                                    {step.date && (
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(step.date).toLocaleDateString('es-MX', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Created Date */}
                            <p className="text-center text-gray-500 text-sm mt-6">
                                Solicitud creada el{' '}
                                {new Date(trackingData.created_at).toLocaleDateString('es-MX', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function SeguimientoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        }>
            <SeguimientoContent />
        </Suspense>
    );
}
