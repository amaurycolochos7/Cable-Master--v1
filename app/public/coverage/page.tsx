'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MapPinIcon, CheckCircleIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

export default function CoveragePage() {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        location: '',
        serviceInterest: 'combo',
    });

    const [submitted, setSubmitted] = useState(false);
    const [folio, setFolio] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);

    // Fetch locations from database
    useEffect(() => {
        const fetchLocations = async () => {
            const { data, error } = await supabase
                .from('locations')
                .select('name')
                .eq('is_active', true)
                .order('name');

            if (!error && data && data.length > 0) {
                const locationNames = data.map(l => l.name);
                setLocations(locationNames);
                setFormData(prev => ({ ...prev, location: locationNames[0] }));
            }
        };
        fetchLocations();
    }, []);

    const serviceTypes = [
        { value: 'internet', label: 'Solo Internet' },
        { value: 'tv', label: 'Solo TV' },
        { value: 'combo', label: 'Internet + TV' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Insertar solicitud en base de datos
            const { data, error } = await supabase
                .from('coverage_requests')
                .insert([
                    {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        email: formData.email || null,
                        address: formData.address,
                        location: formData.location,
                        service_interest: formData.serviceInterest,
                        status: 'pending',
                    },
                ])
                .select('folio')
                .single();

            if (error) {
                console.error('Error:', error);
                alert('Hubo un error al enviar tu solicitud. Por favor, intenta nuevamente.');
                return;
            }

            setFolio(data.folio);
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting coverage request:', error);
            alert('Hubo un error al enviar tu solicitud. Por favor, intenta nuevamente.');
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

    // Confirmation Screen
    if (submitted && folio) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl w-full"
                >
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircleIcon className="w-12 h-12 text-green-500" />
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            ¡Solicitud Recibida!
                        </h2>

                        <p className="text-lg text-gray-600 mb-6">
                            Tu solicitud de verificación de cobertura ha sido registrada correctamente.
                        </p>

                        {/* Folio Card */}
                        <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 mb-6">
                            <p className="text-white/80 text-sm mb-2">Tu número de folio</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-3xl font-black text-white tracking-wider">{folio}</span>
                                <button
                                    onClick={copyFolio}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    title="Copiar folio"
                                >
                                    <DocumentDuplicateIcon className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            {copied && (
                                <p className="text-white/80 text-sm mt-2">✓ Copiado al portapapeles</p>
                            )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                            <p className="font-semibold text-gray-900 mb-4">📋 Datos registrados:</p>
                            <ul className="space-y-2 text-gray-600">
                                <li>📍 <strong>Ubicación:</strong> {formData.address}, {formData.location}</li>
                                <li>📞 <strong>Teléfono:</strong> {formData.phone}</li>
                                <li>📡 <strong>Servicio:</strong> {serviceTypes.find(s => s.value === formData.serviceInterest)?.label}</li>
                            </ul>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-blue-800 text-sm">
                                💡 <strong>¿Qué sigue?</strong> Nuestro equipo técnico revisará la disponibilidad
                                de cobertura en tu zona y te contactaremos en un máximo de 24-48 horas.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href={`/public/seguimiento?folio=${folio}`}
                                className="btn-primary flex-1"
                            >
                                📍 Dar Seguimiento
                            </Link>
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setFolio(null);
                                    setFormData({
                                        fullName: '',
                                        phone: '',
                                        email: '',
                                        address: '',
                                        location: locations[0] || '',
                                        serviceInterest: 'combo',
                                    });
                                }}
                                className="btn-outline flex-1"
                            >
                                Enviar Otra Solicitud
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">
                            Verifica tu Cobertura
                        </h1>
                        <p className="text-xl text-gray-600">
                            Ingresa tus datos y te notificaremos sobre la disponibilidad en tu zona
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        {/* Info Banner */}
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8">
                            <div className="flex items-start space-x-3">
                                <MapPinIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        ¿Cómo funciona?
                                    </h3>
                                    <p className="text-sm text-gray-700">
                                        1. Completa el formulario con tus datos<br />
                                        2. Recibirás un folio de seguimiento<br />
                                        3. Nuestro equipo verificará la cobertura en tu zona<br />
                                        4. Te contactaremos con la respuesta
                                    </p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Nombre completo */}
                            <div>
                                <label htmlFor="fullName" className="label">
                                    Nombre completo *
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="input-light"
                                    placeholder="Juan Pérez García"
                                />
                            </div>

                            {/* Teléfono */}
                            <div>
                                <label htmlFor="phone" className="label">
                                    Teléfono *
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="input-light"
                                    placeholder="961 234 5678"
                                />
                            </div>

                            {/* Email (opcional) */}
                            <div>
                                <label htmlFor="email" className="label">
                                    Email (opcional)
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-light"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>

                            {/* Localidad */}
                            <div>
                                <label htmlFor="location" className="label">
                                    Localidad *
                                </label>
                                <select
                                    id="location"
                                    required
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="input-light"
                                >
                                    {locations.map((loc) => (
                                        <option key={loc} value={loc}>
                                            {loc}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Dirección */}
                            <div>
                                <label htmlFor="address" className="label">
                                    Dirección completa *
                                </label>
                                <textarea
                                    id="address"
                                    required
                                    rows={3}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input-light"
                                    placeholder="Calle, número, colonia, referencias..."
                                />
                            </div>

                            {/* Tipo de servicio */}
                            <div>
                                <label className="label">
                                    Servicio de interés *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {serviceTypes.map((service) => (
                                        <button
                                            key={service.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, serviceInterest: service.value })}
                                            className={`p-4 rounded-lg border-2 font-semibold transition-all duration-200 ${formData.serviceInterest === service.value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
                                                }`}
                                        >
                                            {service.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full text-lg py-4 disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Enviando...
                                    </span>
                                ) : (
                                    '📍 Verificar Cobertura'
                                )}
                            </button>

                            <p className="text-sm text-gray-600 text-center">
                                Al enviar, aceptas que te contactemos para informarte sobre la disponibilidad de nuestro servicio.
                            </p>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
