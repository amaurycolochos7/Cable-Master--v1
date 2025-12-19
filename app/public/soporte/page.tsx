'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    CheckCircleIcon,
    ClipboardDocumentIcon,
    ExclamationTriangleIcon,
    QuestionMarkCircleIcon,
    PhoneIcon,
    ChatBubbleLeftRightIcon,
    WrenchScrewdriverIcon,
    ChevronDownIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { createFaultTicketSchema, type CreateFaultTicket } from '@/lib/schemas';

// Sample FAQ data (in production, this would come from API)
const faqItems = [
    {
        category: 'Internet',
        icon: '🌐',
        items: [
            { question: '¿Cuál es la velocidad real del servicio?', answer: 'Nuestro servicio es 100% fibra óptica, lo que garantiza velocidades simétricas. La velocidad contratada es la velocidad real.' },
            { question: '¿Tienen límite de datos?', answer: 'No, todos nuestros planes son ilimitados. No tenemos políticas de uso justo.' },
        ]
    },
    {
        category: 'Pagos',
        icon: '💳',
        items: [
            { question: '¿Cuándo debo pagar mi mensualidad?', answer: 'Tu fecha de pago es el día de cada mes correspondiente a tu fecha de instalación. Tienes 5 días de gracia.' },
            { question: '¿Qué métodos de pago aceptan?', answer: 'Aceptamos efectivo en sucursal, transferencia bancaria, y Mercado Pago.' },
        ]
    },
    {
        category: 'Soporte Técnico',
        icon: '🛠️',
        items: [
            { question: 'Mi internet está lento, ¿qué hago?', answer: 'Primero reinicia tu modem desconectándolo por 30 segundos. Si persiste, reporta aquí mismo.' },
            { question: 'No tengo señal de TV', answer: 'Verifica que el decodificador esté encendido y correctamente conectado. Si el problema continúa, repórtalo.' },
        ]
    },
];

export default function SoportePage() {
    const [activeTab, setActiveTab] = useState<'faq' | 'report'>('faq');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [folio, setFolio] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateFaultTicket>({
        resolver: zodResolver(createFaultTicketSchema),
        defaultValues: {
            type: 'fault',
        },
    });

    const onSubmit = async (data: CreateFaultTicket) => {
        setLoading(true);
        try {
            const res = await fetch('/api/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (result.success) {
                setFolio(result.folio);
            } else {
                alert(result.error || 'Error al enviar el reporte');
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

    const resetForm = () => {
        setFolio(null);
        reset();
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
        ctx.fillText('Comprobante de Reporte', 300, 130);

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
        ctx.fillText('Guarda este comprobante para dar seguimiento a tu reporte.', 300, 320);
        ctx.fillText('Consulta el estado en: cablemaster.com/seguimiento', 300, 345);

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Centro de <span className="text-primary">Soporte</span>
                    </h1>
                    <p className="text-xl text-gray-600">
                        Resuelve tus dudas o reporta un problema
                    </p>
                </motion.div>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-xl p-1 shadow-md inline-flex">
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'faq'
                                ? 'bg-primary text-white'
                                : 'text-gray-600 hover:text-primary'
                                }`}
                        >
                            <QuestionMarkCircleIcon className="w-5 h-5 inline mr-2" />
                            Preguntas Frecuentes
                        </button>
                        <button
                            onClick={() => setActiveTab('report')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'report'
                                ? 'bg-primary text-white'
                                : 'text-gray-600 hover:text-primary'
                                }`}
                        >
                            <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
                            Reportar Falla
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* FAQ Tab */}
                    {activeTab === 'faq' && (
                        <motion.div
                            key="faq"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {faqItems.map((category) => (
                                <div key={category.category} className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <span>{category.icon}</span>
                                        {category.category}
                                    </h2>
                                    <div className="space-y-3">
                                        {category.items.map((item, idx) => {
                                            const key = `${category.category}-${idx}`;
                                            return (
                                                <div key={key} className="bg-white rounded-xl shadow-md overflow-hidden">
                                                    <button
                                                        onClick={() => setExpandedFaq(expandedFaq === key ? null : key)}
                                                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                                                    >
                                                        <span className="font-medium text-gray-900">{item.question}</span>
                                                        <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${expandedFaq === key ? 'rotate-180' : ''
                                                            }`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {expandedFaq === key && (
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: 'auto' }}
                                                                exit={{ height: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="px-6 py-4 bg-gray-50 border-t text-gray-600">
                                                                    {item.answer}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="card text-center mt-8">
                                <p className="text-gray-600 mb-4">¿No encontraste respuesta a tu duda?</p>
                                <button
                                    onClick={() => setActiveTab('report')}
                                    className="btn-primary"
                                >
                                    Reportar un Problema
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Report Tab */}
                    {activeTab === 'report' && !folio && (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="card max-w-xl mx-auto"
                        >
                            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
                                <WrenchScrewdriverIcon className="w-7 h-7 text-primary" />
                                Reportar una Falla
                            </h2>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="label text-gray-800 font-semibold">Nombre Completo</label>
                                    <input
                                        {...register('full_name')}
                                        type="text"
                                        placeholder="Juan Pérez García"
                                        className="input-light"
                                    />
                                    {errors.full_name && (
                                        <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Teléfono (10 dígitos)</label>
                                    <input
                                        {...register('phone')}
                                        type="tel"
                                        maxLength={10}
                                        placeholder="9611234567"
                                        className="input-light"
                                    />
                                    {errors.phone && (
                                        <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Número de Servicio (si lo conoces)</label>
                                    <input
                                        {...register('service_number')}
                                        type="text"
                                        placeholder="CM000001"
                                        className="input-light"
                                    />
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Dirección</label>
                                    <input
                                        {...register('address')}
                                        type="text"
                                        placeholder="Calle y número"
                                        className="input-light"
                                    />
                                    {errors.address && (
                                        <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label text-gray-800 font-semibold">Describe el problema</label>
                                    <textarea
                                        {...register('fault_description')}
                                        rows={4}
                                        placeholder="Ej: No tengo señal de internet desde las 3pm..."
                                        className="input-light"
                                    />
                                    {errors.fault_description && (
                                        <p className="text-red-500 text-sm mt-1">{errors.fault_description.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full disabled:opacity-50"
                                >
                                    {loading ? 'Enviando...' : 'Enviar Reporte'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* Success State */}
                    {activeTab === 'report' && folio && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card max-w-xl mx-auto text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircleIcon className="w-12 h-12 text-green-600" />
                            </div>

                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                ¡Reporte Recibido!
                            </h2>

                            <p className="text-gray-600 mb-8">
                                Hemos registrado tu reporte. Nuestro equipo técnico lo revisará y te contactaremos pronto.
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
                                    <p className="text-green-600 text-sm mt-2">¡Copiado!</p>
                                )}
                                <button
                                    onClick={downloadFolioReceipt}
                                    className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                                >
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                    Descargar comprobante
                                </button>
                            </div>

                            <div className="flex gap-4 justify-center">
                                <Link
                                    href={`/public/seguimiento?folio=${folio}`}
                                    className="btn-primary"
                                >
                                    Ver Estado
                                </Link>
                                <button
                                    onClick={resetForm}
                                    className="btn-outline"
                                >
                                    Nuevo Reporte
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Contact Cards */}
                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <div className="card text-center">
                        <PhoneIcon className="w-10 h-10 text-primary mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">Llámanos</h3>
                        <a href="tel:9612483470" className="text-2xl font-bold text-primary">
                            961 248 3470
                        </a>
                        <p className="text-gray-600 text-sm mt-2">Lun-Vie: 9:00 - 18:00</p>
                    </div>

                    <div className="card text-center">
                        <ChatBubbleLeftRightIcon className="w-10 h-10 text-green-500 mx-auto mb-4" />
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">WhatsApp</h3>
                        <a
                            href="https://wa.me/5219612483470"
                            target="_blank"
                            className="text-2xl font-bold text-green-600"
                        >
                            Enviar mensaje
                        </a>
                        <p className="text-gray-600 text-sm mt-2">Respuesta rápida</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
