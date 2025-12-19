'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ChatBubbleLeftIcon,
    ClockIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CoverageRequest {
    id: string;
    folio: string;
    full_name: string;
    phone: string;
    email: string | null;
    address: string;
    location: string;
    service_interest: string;
    status: string;
    notes: string | null;
    contacted_by: string | null;
    contacted_at: string | null;
    created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    contacted: { label: 'Contactado', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    approved: { label: 'Aprobado', color: 'text-green-700', bgColor: 'bg-green-100' },
    rejected: { label: 'Rechazado', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const serviceLabels: Record<string, string> = {
    internet: 'Solo Internet',
    tv: 'Solo TV',
    combo: 'Internet + TV',
};

export default function CoberturaAdminPage() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<CoverageRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedRequest, setSelectedRequest] = useState<CoverageRequest | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [notes, setNotes] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const fetchRequests = async () => {
        setLoading(true);
        let query = supabase
            .from('coverage_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (filterStatus !== 'all') {
            query = query.eq('status', filterStatus);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching coverage requests:', error);
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    const openModal = (request: CoverageRequest) => {
        setSelectedRequest(request);
        setNewStatus(request.status);
        setNotes(request.notes || '');
        setShowModal(true);
    };

    const handleUpdate = async () => {
        if (!selectedRequest) return;
        setUpdating(true);

        try {
            const updateData: any = {
                status: newStatus,
                notes: notes || null,
            };

            // If status changed to contacted, record who and when
            if (newStatus === 'contacted' && selectedRequest.status !== 'contacted') {
                updateData.contacted_by = profile?.id;
                updateData.contacted_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('coverage_requests')
                .update(updateData)
                .eq('id', selectedRequest.id);

            if (error) throw error;

            setShowModal(false);
            fetchRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Error al actualizar la solicitud');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusCounts = () => {
        const counts = { all: requests.length, pending: 0, contacted: 0, approved: 0, rejected: 0 };
        requests.forEach(r => {
            if (counts[r.status as keyof typeof counts] !== undefined) {
                counts[r.status as keyof typeof counts]++;
            }
        });
        return counts;
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <MapPinIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Cobertura</h1>
                        <p className="text-gray-500">Gestiona las verificaciones de cobertura</p>
                    </div>
                </div>
                {pendingCount > 0 && (
                    <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-medium">
                        ⏳ {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <FunnelIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-500">Filtrar:</span>
                    {['all', 'pending', 'contacted', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : statusConfig[status]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Requests List */}
            {requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay solicitudes</h3>
                    <p className="text-gray-500">No hay solicitudes de cobertura {filterStatus !== 'all' && `con estado "${statusConfig[filterStatus]?.label}"`}</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Folio</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ubicación</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Servicio</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {requests.map((request) => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <span className="font-mono text-sm font-semibold text-primary">{request.folio}</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">{request.full_name}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <PhoneIcon className="w-3 h-3" /> {request.phone}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm text-gray-900">{request.location}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{request.address}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-gray-700">
                                            {serviceLabels[request.service_interest] || request.service_interest}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[request.status]?.bgColor} ${statusConfig[request.status]?.color}`}>
                                            {statusConfig[request.status]?.label || request.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-500">
                                        {new Date(request.created_at).toLocaleDateString('es-MX', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => openModal(request)}
                                            className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-lg w-full p-6"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold">Solicitud {selectedRequest.folio}</h3>
                                <p className="text-sm text-gray-500">Verificación de Cobertura</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig[selectedRequest.status]?.bgColor} ${statusConfig[selectedRequest.status]?.color}`}>
                                {statusConfig[selectedRequest.status]?.label}
                            </span>
                        </div>

                        {/* Client Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{selectedRequest.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                <a href={`tel:${selectedRequest.phone}`} className="text-primary hover:underline">
                                    {selectedRequest.phone}
                                </a>
                            </div>
                            {selectedRequest.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                    <a href={`mailto:${selectedRequest.email}`} className="text-primary hover:underline">
                                        {selectedRequest.email}
                                    </a>
                                </div>
                            )}
                            <div className="flex items-start gap-2 text-sm">
                                <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                <span>{selectedRequest.address}, {selectedRequest.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                <span>Servicio: {serviceLabels[selectedRequest.service_interest]}</span>
                            </div>
                        </div>

                        {/* Status Change */}
                        <div className="mb-4">
                            <label className="label">Cambiar Estado</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(statusConfig).map(([value, config]) => (
                                    <button
                                        key={value}
                                        onClick={() => setNewStatus(value)}
                                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${newStatus === value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label className="label">Notas internas</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="input"
                                rows={3}
                                placeholder="Agrega observaciones..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-outline flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={updating}
                                className="btn-primary flex-1 disabled:opacity-50"
                            >
                                {updating ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
