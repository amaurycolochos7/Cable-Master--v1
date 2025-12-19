'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPinIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface PostalCode {
    id: string;
    code: string;
    coverage_status: string;
    notes: string | null;
    is_active: boolean;
    municipality: {
        name: string;
    } | null;
}

interface Municipality {
    id: string;
    name: string;
    state: string;
    coverage_status: string;
    is_active: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    available: { label: 'Disponible', color: 'text-green-700', bgColor: 'bg-green-100', icon: <CheckCircleIcon className="w-4 h-4" /> },
    partial: { label: 'Parcial', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: <ClockIcon className="w-4 h-4" /> },
    coming_soon: { label: 'Próximamente', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <ClockIcon className="w-4 h-4" /> },
    not_available: { label: 'No disponible', color: 'text-red-700', bgColor: 'bg-red-100', icon: <XCircleIcon className="w-4 h-4" /> },
};

export default function ZonasCobertura() {
    const [activeTab, setActiveTab] = useState<'codigos' | 'municipios'>('codigos');
    const [postalCodes, setPostalCodes] = useState<PostalCode[]>([]);
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    // Form state for postal code
    const [codeForm, setCodeForm] = useState({
        code: '',
        municipality_id: '',
        coverage_status: 'available',
        notes: '',
        is_active: true
    });

    // Form state for municipality
    const [munForm, setMunForm] = useState({
        name: '',
        state: 'Chiapas',
        coverage_status: 'available',
        is_active: true
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'codigos') {
            const { data } = await supabase
                .from('postal_codes')
                .select('*, municipality:municipalities(name)')
                .order('code');
            setPostalCodes(data || []);
        } else {
            const { data } = await supabase
                .from('municipalities')
                .select('*')
                .order('name');
            setMunicipalities(data || []);
        }
        setLoading(false);
    };

    const handleSaveCode = async () => {
        if (!codeForm.code.trim()) {
            alert('El código postal es requerido');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                code: codeForm.code,
                municipality_id: codeForm.municipality_id || null,
                coverage_status: codeForm.coverage_status,
                notes: codeForm.notes || null,
                is_active: codeForm.is_active
            };

            if (editItem) {
                await supabase.from('postal_codes').update(payload).eq('id', editItem.id);
            } else {
                await supabase.from('postal_codes').insert(payload);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        }
        setSaving(false);
    };

    const handleSaveMun = async () => {
        if (!munForm.name.trim()) {
            alert('El nombre es requerido');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: munForm.name,
                state: munForm.state,
                coverage_status: munForm.coverage_status,
                is_active: munForm.is_active
            };

            if (editItem) {
                await supabase.from('municipalities').update(payload).eq('id', editItem.id);
            } else {
                await supabase.from('municipalities').insert(payload);
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string, table: string) => {
        if (confirm('¿Eliminar este registro?')) {
            await supabase.from(table).delete().eq('id', id);
            fetchData();
        }
    };

    const openNewCode = () => {
        setEditItem(null);
        setCodeForm({ code: '', municipality_id: '', coverage_status: 'available', notes: '', is_active: true });
        setShowModal(true);
    };

    const openEditCode = (item: PostalCode) => {
        setEditItem(item);
        setCodeForm({
            code: item.code,
            municipality_id: '',
            coverage_status: item.coverage_status,
            notes: item.notes || '',
            is_active: item.is_active
        });
        setShowModal(true);
    };

    const openNewMun = () => {
        setEditItem(null);
        setMunForm({ name: '', state: 'Chiapas', coverage_status: 'available', is_active: true });
        setShowModal(true);
    };

    const openEditMun = (item: Municipality) => {
        setEditItem(item);
        setMunForm({
            name: item.name,
            state: item.state,
            coverage_status: item.coverage_status,
            is_active: item.is_active
        });
        setShowModal(true);
    };

    const filteredCodes = postalCodes.filter(p =>
        p.code.includes(search) ||
        p.municipality?.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredMunicipalities = municipalities.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-cyan-100 rounded-xl">
                        <MapPinIcon className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Zonas de Cobertura</h1>
                        <p className="text-gray-500">Administra códigos postales y municipios</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm p-2 inline-flex">
                <button
                    onClick={() => setActiveTab('codigos')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'codigos'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Códigos Postales
                </button>
                <button
                    onClick={() => setActiveTab('municipios')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'municipios'
                            ? 'bg-primary text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Municipios
                </button>
            </div>

            {/* Search and Add */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="input pl-10"
                    />
                </div>
                <button
                    onClick={activeTab === 'codigos' ? openNewCode : openNewMun}
                    className="btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {activeTab === 'codigos' ? 'Nuevo Código' : 'Nuevo Municipio'}
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            )}

            {/* Postal Codes Table */}
            {!loading && activeTab === 'codigos' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Municipio</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notas</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredCodes.map(code => (
                                <tr key={code.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 font-mono font-semibold text-lg">{code.code}</td>
                                    <td className="px-4 py-4">{code.municipality?.name || '-'}</td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[code.coverage_status]?.bgColor} ${statusConfig[code.coverage_status]?.color}`}>
                                            {statusConfig[code.coverage_status]?.icon}
                                            {statusConfig[code.coverage_status]?.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-500">{code.notes || '-'}</td>
                                    <td className="px-4 py-4 flex gap-1">
                                        <button onClick={() => openEditCode(code)} className="p-2 hover:bg-gray-100 rounded">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(code.id, 'postal_codes')} className="p-2 hover:bg-red-100 text-red-500 rounded">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCodes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                        No se encontraron códigos postales
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Municipalities Table */}
            {!loading && activeTab === 'municipios' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Municipio</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cobertura</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Activo</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredMunicipalities.map(mun => (
                                <tr key={mun.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 font-semibold">{mun.name}</td>
                                    <td className="px-4 py-4">{mun.state}</td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[mun.coverage_status]?.bgColor} ${statusConfig[mun.coverage_status]?.color}`}>
                                            {statusConfig[mun.coverage_status]?.icon}
                                            {statusConfig[mun.coverage_status]?.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {mun.is_active ? (
                                            <span className="text-green-600">✓ Activo</span>
                                        ) : (
                                            <span className="text-gray-400">Inactivo</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 flex gap-1">
                                        <button onClick={() => openEditMun(mun)} className="p-2 hover:bg-gray-100 rounded">
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(mun.id, 'municipalities')} className="p-2 hover:bg-red-100 text-red-500 rounded">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredMunicipalities.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                                        No se encontraron municipios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-md w-full p-6"
                    >
                        <h3 className="text-lg font-semibold mb-4">
                            {editItem ? 'Editar' : 'Nuevo'} {activeTab === 'codigos' ? 'Código Postal' : 'Municipio'}
                        </h3>

                        {activeTab === 'codigos' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Código Postal *</label>
                                    <input
                                        value={codeForm.code}
                                        onChange={e => setCodeForm({ ...codeForm, code: e.target.value })}
                                        placeholder="29160"
                                        maxLength={5}
                                        className="input text-xl font-mono tracking-widest text-center"
                                    />
                                </div>
                                <div>
                                    <label className="label">Estado de Cobertura</label>
                                    <select
                                        value={codeForm.coverage_status}
                                        onChange={e => setCodeForm({ ...codeForm, coverage_status: e.target.value })}
                                        className="input"
                                    >
                                        {Object.entries(statusConfig).map(([value, config]) => (
                                            <option key={value} value={value}>{config.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Notas</label>
                                    <textarea
                                        value={codeForm.notes}
                                        onChange={e => setCodeForm({ ...codeForm, notes: e.target.value })}
                                        className="input"
                                        rows={2}
                                        placeholder="Observaciones..."
                                    />
                                </div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={codeForm.is_active}
                                        onChange={e => setCodeForm({ ...codeForm, is_active: e.target.checked })}
                                        className="rounded"
                                    />
                                    Activo
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Nombre del Municipio *</label>
                                    <input
                                        value={munForm.name}
                                        onChange={e => setMunForm({ ...munForm, name: e.target.value })}
                                        placeholder="Chiapa de Corzo"
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Estado</label>
                                    <input
                                        value={munForm.state}
                                        onChange={e => setMunForm({ ...munForm, state: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Estado de Cobertura</label>
                                    <select
                                        value={munForm.coverage_status}
                                        onChange={e => setMunForm({ ...munForm, coverage_status: e.target.value })}
                                        className="input"
                                    >
                                        {Object.entries(statusConfig).map(([value, config]) => (
                                            <option key={value} value={value}>{config.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={munForm.is_active}
                                        onChange={e => setMunForm({ ...munForm, is_active: e.target.checked })}
                                        className="rounded"
                                    />
                                    Activo
                                </label>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-outline flex-1">
                                Cancelar
                            </button>
                            <button
                                onClick={activeTab === 'codigos' ? handleSaveCode : handleSaveMun}
                                disabled={saving}
                                className="btn-primary flex-1"
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
