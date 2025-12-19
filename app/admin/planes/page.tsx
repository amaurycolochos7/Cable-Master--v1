'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CubeIcon, PlusIcon, PencilIcon, TrashIcon, SignalIcon, TvIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Package {
    id: string; name: string; type: string; speed_mbps: number | null; channels_count: number | null;
    monthly_price: number; installation_fee: number; features: string[]; is_active: boolean;
}

const typeIcons: Record<string, any> = { internet: SignalIcon, tv: TvIcon, combo: SparklesIcon };
const typeLabels: Record<string, string> = { internet: 'Internet', tv: 'TV', combo: 'Combo' };

export default function PlanesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<Package | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'internet', speed_mbps: '', channels_count: '', monthly_price: '', installation_fee: '', features: '', is_active: true });

    useEffect(() => { fetchPackages(); }, []);

    const fetchPackages = async () => {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase.from('service_packages').select('*').order('monthly_price');
        if (fetchError) {
            console.error('Error fetching packages:', fetchError);
            setError('Error al cargar paquetes: ' + fetchError.message);
        }
        setPackages(data || []);
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        const payload = {
            name: form.name, type: form.type,
            speed_mbps: form.speed_mbps ? parseInt(form.speed_mbps) : null,
            channels_count: form.channels_count ? parseInt(form.channels_count) : null,
            monthly_price: parseFloat(form.monthly_price), installation_fee: parseFloat(form.installation_fee || '0'),
            features: form.features.split('\n').filter(f => f.trim()),
            is_active: form.is_active
        };

        let saveError = null;
        if (editItem) {
            const { error } = await supabase.from('service_packages').update(payload).eq('id', editItem.id);
            saveError = error;
        } else {
            const { error } = await supabase.from('service_packages').insert(payload);
            saveError = error;
        }

        if (saveError) {
            console.error('Error saving package:', saveError);
            setError('Error al guardar: ' + saveError.message);
            setSaving(false);
            return;
        }

        setSaving(false);
        setShowModal(false);
        resetForm();
        fetchPackages();
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este paquete?')) {
            setError(null);
            const { error: deleteError } = await supabase.from('service_packages').delete().eq('id', id);
            if (deleteError) {
                console.error('Error deleting package:', deleteError);
                setError('Error al eliminar: ' + deleteError.message);
                return;
            }
            fetchPackages();
        }
    };

    const openEdit = (pkg: Package) => {
        setEditItem(pkg);
        setForm({
            name: pkg.name, type: pkg.type, speed_mbps: pkg.speed_mbps?.toString() || '',
            channels_count: pkg.channels_count?.toString() || '', monthly_price: pkg.monthly_price.toString(),
            installation_fee: pkg.installation_fee?.toString() || '0', features: pkg.features?.join('\n') || '',
            is_active: pkg.is_active
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditItem(null);
        setForm({ name: '', type: 'internet', speed_mbps: '', channels_count: '', monthly_price: '', installation_fee: '', features: '', is_active: true });
    };

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"><CubeIcon className="w-7 h-7 text-primary" />Planes y Paquetes</h1>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary"><PlusIcon className="w-5 h-5 mr-2" />Nuevo Paquete</button>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                    <span className="text-red-600 dark:text-red-400">⚠️ {error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map(pkg => {
                    const Icon = typeIcons[pkg.type] || CubeIcon;
                    return (
                        <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-2 border-gray-200 dark:border-gray-700 ${!pkg.is_active ? 'opacity-60' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Icon className="w-8 h-8 text-primary" />
                                    <div><p className="font-semibold text-lg text-gray-900 dark:text-white">{pkg.name}</p><span className="badge badge-info">{typeLabels[pkg.type]}</span></div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(pkg)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(pkg.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                                {pkg.speed_mbps && <p>🚀 {pkg.speed_mbps} Mbps</p>}
                                {pkg.channels_count && <p>📺 {pkg.channels_count} canales</p>}
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-primary">${pkg.monthly_price}</span><span className="text-gray-500 dark:text-gray-400">/mes</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{editItem ? 'Editar' : 'Nuevo'} Paquete</h3>
                        <div className="space-y-4">
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del paquete" className="input" />
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input">
                                <option value="internet">Internet</option><option value="tv">TV</option><option value="combo">Combo</option>
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={form.speed_mbps} onChange={e => setForm({ ...form, speed_mbps: e.target.value })} placeholder="Velocidad Mbps" className="input" />
                                <input type="number" value={form.channels_count} onChange={e => setForm({ ...form, channels_count: e.target.value })} placeholder="# Canales" className="input" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={form.monthly_price} onChange={e => setForm({ ...form, monthly_price: e.target.value })} placeholder="Precio mensual" className="input" />
                                <input type="number" value={form.installation_fee} onChange={e => setForm({ ...form, installation_fee: e.target.value })} placeholder="Precio instalación" className="input" />
                            </div>
                            <textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="Características (una por línea)" rows={4} className="input" />
                            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />Activo</label>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-outline flex-1" disabled={saving}>Cancelar</button>
                            <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
