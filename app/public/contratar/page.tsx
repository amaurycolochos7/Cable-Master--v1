'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    ClipboardDocumentIcon,
    SignalIcon,
    TvIcon,
    SparklesIcon,
    MapPinIcon,
    PhoneIcon,
    UserIcon,
    EnvelopeIcon,
    HomeIcon,
    ArrowDownTrayIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { createContractTicketSchema, type CreateContractTicket } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';

interface Package {
    id: string;
    name: string;
    type: string;
    speed_mbps?: number;
    channels_count?: number;
    monthly_price: number;
    features?: string[];
}

interface Promotion {
    id: string;
    name: string;
    title: string;
    subtitle: string;
    description: string;
    background_color: string;
}

// Loading fallback for Suspense
function ContratarLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Cargando...</p>
            </div>
        </div>
    );
}

// Inner component that uses useSearchParams
function ContratarContent() {
    const searchParams = useSearchParams();
    const promoId = searchParams.get('promo');

    const [step, setStep] = useState(1);
    const [coverageStatus, setCoverageStatus] = useState<string | null>(null);
    const [coverageMessage, setCoverageMessage] = useState('');
    const [packages, setPackages] = useState<Package[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<string>('');
    const [folio, setFolio] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingCoverage, setCheckingCoverage] = useState(false);
    const [activePromo, setActivePromo] = useState<Promotion | null>(null);

    // Fetch promotion if promo parameter is present
    useEffect(() => {
        if (promoId) {
            const fetchPromo = async () => {
                const { data, error } = await supabase
                    .from('banners')
                    .select('id, name, title, subtitle, description, background_color')
                    .eq('id', promoId)
                    .single();

                if (!error && data) {
                    setActivePromo(data);
                }
            };
            fetchPromo();
        }
    }, [promoId]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CreateContractTicket>({
        resolver: zodResolver(createContractTicketSchema),
        defaultValues: {
            type: 'contract',
        },
    });

    const postalCode = watch('postal_code');

    // Check coverage when postal code changes
    useEffect(() => {
        if (postalCode?.length === 5) {
            checkCoverage(postalCode);
        } else {
            setCoverageStatus(null);
            setPackages([]);
        }
    }, [postalCode]);

    const checkCoverage = async (cp: string) => {
        setCheckingCoverage(true);
        try {
            const res = await fetch(`/api/coverage/check?cp=${cp}`);
            const data = await res.json();

            setCoverageStatus(data.coverage_status);
            setCoverageMessage(data.message);

            if (data.can_contract && data.packages) {
                setPackages(data.packages);
            } else {
                setPackages([]);
            }

            if (data.municipality?.name) {
                setValue('municipality', data.municipality.name);
            }
        } catch (error) {
            console.error('Coverage check error:', error);
        } finally {
            setCheckingCoverage(false);
        }
    };

    const onSubmit = async (data: CreateContractTicket) => {
        setLoading(true);
        try {
            // Add promotion info if applicable
            const submitData = {
                ...data,
                promotion_id: activePromo?.id || null,
                promo_notes: activePromo
                    ? `Promoción aplicada: ${activePromo.title}${activePromo.subtitle ? ` - ${activePromo.subtitle}` : ''}`
                    : null
            };

            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            const result = await res.json();

            if (result.success) {
                setFolio(result.folio);
                setStep(3);
            } else {
                alert(result.error || 'Error al enviar la solicitud');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const copyFolio = () => {
        if (folio) {
            navigator.clipboard.writeText(folio);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Generate and download a receipt image with the folio
    const downloadFolioReceipt = () => {
        if (!folio) return;

        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 600, 400);
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 600, 400);

        // Header bar
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 600, 80);

        // Logo text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CABLE MASTER', 300, 52);

        // Title
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Comprobante de Contratación', 300, 130);

        // Folio box
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(100, 160, 400, 80, 12);
        ctx.fill();
        ctx.stroke();

        // Folio label
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Arial';
        ctx.fillText('Tu número de folio es:', 300, 190);

        // Folio number
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(folio, 300, 225);

        // Date
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Arial';
        const date = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        ctx.fillText(`Fecha: ${date}`, 300, 280);

        // Instructions
        ctx.fillStyle = '#374151';
        ctx.font = '13px Arial';
        ctx.fillText('Guarda este comprobante. Te contactaremos para agendar', 300, 320);
        ctx.fillText('tu instalación. Consulta el estado en: cablemaster.com/seguimiento', 300, 345);

        // Footer
        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px Arial';
        ctx.fillText('La Mejor Programación • 961 248 3470', 300, 385);

        // Download
        const link = document.createElement('a');
        link.download = `CableMaster-Folio-${folio}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Active Promotion Banner */}
                {activePromo && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 rounded-xl overflow-hidden shadow-lg"
                        style={{ backgroundColor: activePromo.background_color || '#dc2626' }}
                    >
                        <div className="px-6 py-4 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <TagIcon className="w-6 h-6" />
                                <span className="text-sm font-medium uppercase tracking-wider opacity-90">Promoción Aplicada</span>
                            </div>
                            <h2 className="text-2xl font-bold">{activePromo.title}</h2>
                            {activePromo.subtitle && (
                                <p className="text-lg opacity-90">{activePromo.subtitle}</p>
                            )}
                            {activePromo.description && (
                                <p className="text-sm mt-2 opacity-80">{activePromo.description}</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Contratar <span className="gradient-text">Cable Master</span>
                    </h1>
                    <p className="text-xl text-gray-600">
                        Internet 100% Fibra Óptica + TV Premium
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {step > s ? <CheckCircleIcon className="w-6 h-6" /> : s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Coverage Check */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="card max-w-xl mx-auto"
                        >
                            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
                                <MapPinIcon className="w-7 h-7 text-primary" />
                                Verifica tu Cobertura
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="label text-gray-800 font-semibold">Código Postal</label>
                                    <input
                                        {...register('postal_code')}
                                        type="text"
                                        maxLength={5}
                                        placeholder="29160"
                                        className="input text-2xl text-center tracking-widest text-gray-900 bg-white border-2 border-gray-300"
                                    />
                                    {errors.postal_code && (
                                        <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>
                                    )}
                                </div>

                                {checkingCoverage && (
                                    <div className="text-center py-4">
                                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                                        <p className="text-gray-500 mt-2">Verificando cobertura...</p>
                                    </div>
                                )}

                                {coverageStatus && !checkingCoverage && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`p-4 rounded-lg ${coverageStatus === 'available' ? 'bg-green-50 border border-green-200' :
                                            coverageStatus === 'partial' ? 'bg-yellow-50 border border-yellow-200' :
                                                coverageStatus === 'coming_soon' ? 'bg-blue-50 border border-blue-200' :
                                                    'bg-red-50 border border-red-200'
                                            }`}
                                    >
                                        <p className={`font-medium ${coverageStatus === 'available' ? 'text-green-700' :
                                            coverageStatus === 'partial' ? 'text-yellow-700' :
                                                coverageStatus === 'coming_soon' ? 'text-blue-700' :
                                                    'text-red-700'
                                            }`}>
                                            {coverageMessage}
                                        </p>
                                    </motion.div>
                                )}

                                {/* WHEN PROMOTION IS APPLIED - Show promo confirmation instead of packages */}
                                {activePromo && (coverageStatus === 'available' || coverageStatus === 'partial') && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-6"
                                    >
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                                            <div className="flex items-center gap-2 text-green-700 mb-3">
                                                <CheckCircleIcon className="w-6 h-6" />
                                                <span className="font-semibold">¡Excelente! Tu promoción está disponible</span>
                                            </div>

                                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: activePromo.background_color || '#dc2626' }}
                                                    >
                                                        <TagIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-lg">{activePromo.title}</h4>
                                                        {activePromo.subtitle && (
                                                            <p className="text-gray-600">{activePromo.subtitle}</p>
                                                        )}
                                                        {activePromo.description && (
                                                            <p className="text-sm text-gray-500 mt-1">{activePromo.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-green-600 mt-3 text-center">
                                                ✓ Esta promoción se aplicará a tu contratación
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* NORMAL FLOW - No promotion, show package selection */}
                                {!activePromo && (coverageStatus === 'available' || coverageStatus === 'partial') && packages.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="font-semibold mb-4 text-gray-800 text-lg">Selecciona tu Paquete</h3>
                                        <div className="space-y-3">
                                            {packages.map((pkg) => (
                                                <label
                                                    key={pkg.id}
                                                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedPackage === pkg.id
                                                        ? 'border-primary bg-primary/10 shadow-md'
                                                        : 'border-gray-300 hover:border-primary/50 hover:shadow-sm bg-white'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="package"
                                                        value={pkg.id}
                                                        className="sr-only"
                                                        onChange={() => {
                                                            setSelectedPackage(pkg.id);
                                                            setValue('package_id', pkg.id);
                                                        }}
                                                    />
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            {pkg.type === 'internet' && <SignalIcon className="w-6 h-6 text-primary" />}
                                                            {pkg.type === 'tv' && <TvIcon className="w-6 h-6 text-secondary" />}
                                                            {pkg.type === 'combo' && <SparklesIcon className="w-6 h-6 text-amber-500" />}
                                                            <div>
                                                                <p className="font-bold text-gray-900">{pkg.name}</p>
                                                                <p className="text-sm text-gray-600 font-medium">
                                                                    {pkg.speed_mbps && `${pkg.speed_mbps} Mbps`}
                                                                    {pkg.speed_mbps && pkg.channels_count && ' + '}
                                                                    {pkg.channels_count && `${pkg.channels_count} canales`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-bold text-primary">${pkg.monthly_price}</p>
                                                            <p className="text-xs text-gray-600 font-medium">/mes</p>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    disabled={activePromo ? !(coverageStatus === 'available' || coverageStatus === 'partial') : !selectedPackage}
                                    className="btn-primary w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {activePromo ? 'Continuar con esta Promoción' : 'Continuar'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Personal Data */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="card max-w-xl mx-auto"
                        >
                            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
                                <UserIcon className="w-7 h-7 text-primary" />
                                Tus Datos
                            </h2>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="label text-gray-800 font-semibold">Nombre Completo</label>
                                    <div className="relative">
                                        <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            {...register('full_name')}
                                            type="text"
                                            placeholder="Juan Pérez García"
                                            className="input-light pl-10"
                                        />
                                    </div>
                                    {errors.full_name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Teléfono (10 dígitos)</label>
                                    <div className="relative">
                                        <PhoneIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            {...register('phone')}
                                            type="tel"
                                            maxLength={10}
                                            placeholder="9611234567"
                                            className="input-light pl-10"
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Email (opcional)</label>
                                    <div className="relative">
                                        <EnvelopeIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            {...register('email')}
                                            type="email"
                                            placeholder="tu@email.com"
                                            className="input-light pl-10"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Dirección Completa</label>
                                    <div className="relative">
                                        <HomeIcon className="w-5 h-5 absolute left-3 top-3 text-gray-500" />
                                        <textarea
                                            {...register('address')}
                                            rows={3}
                                            placeholder="Calle, número, colonia"
                                            className="input-light pl-10"
                                        />
                                    </div>
                                    {errors.address && (
                                        <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Referencias (opcional)</label>
                                    <input
                                        {...register('references_text')}
                                        type="text"
                                        placeholder="Entre calles, cerca de..."
                                        className="input-light"
                                    />
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Horario preferido para visita (opcional)</label>
                                    <select {...register('preferred_schedule')} className="input-light">
                                        <option value="">Sin preferencia</option>
                                        <option value="morning">Mañana (9:00 - 13:00)</option>
                                        <option value="afternoon">Tarde (14:00 - 18:00)</option>
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="btn-outline flex-1"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary flex-1 disabled:opacity-50"
                                    >
                                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && folio && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card max-w-xl mx-auto text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircleIcon className="w-12 h-12 text-green-600" />
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                ¡Solicitud Recibida!
                            </h2>

                            <p className="text-gray-600 mb-8">
                                Tu solicitud de contratación ha sido registrada. Te contactaremos pronto para agendar la instalación.
                            </p>

                            <div className="bg-gray-50 rounded-xl p-6 mb-8">
                                <p className="text-sm text-gray-500 mb-2">Tu número de folio es:</p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-4xl font-bold text-primary tracking-wider">
                                        {folio}
                                    </span>
                                    <button
                                        onClick={copyFolio}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Copiar folio"
                                    >
                                        <ClipboardDocumentIcon className="w-6 h-6 text-gray-600" />
                                    </button>
                                </div>
                                {copied && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-green-600 text-sm mt-2"
                                    >
                                        ¡Copiado!
                                    </motion.p>
                                )}
                                <button
                                    onClick={downloadFolioReceipt}
                                    className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                                >
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                    Descargar comprobante
                                </button>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <p className="text-blue-800 text-sm">
                                    💡 <strong>Importante:</strong> Guarda tu folio. Lo necesitarás para dar seguimiento a tu solicitud.
                                </p>
                            </div>

                            <a
                                href={`/public/seguimiento?folio=${folio}`}
                                className="btn-primary inline-block"
                            >
                                Ver Estado de mi Solicitud
                            </a>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Default export wraps content in Suspense for useSearchParams
export default function ContratarPage() {
    return (
        <Suspense fallback={<ContratarLoading />}>
            <ContratarContent />
        </Suspense>
    );
}
