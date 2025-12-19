'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MegaphoneIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, PhotoIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Banner {
    id: string;
    name: string;
    type: string;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    image_url: string | null;
    cta_text: string | null;
    cta_url: string | null;
    background_color: string | null;
    position: string;
    sort_order: number;
    is_active: boolean;
    show_from: string | null;
    show_until: string | null;
}

const bannerTypes = [
    { value: 'hero', label: 'Hero Principal', description: 'Banner grande en la página de inicio' },
    { value: 'bar', label: 'Barra Superior', description: 'Barra de anuncio en la parte superior' },
    { value: 'popup', label: 'Popup', description: 'Ventana emergente' },
    { value: 'sidebar', label: 'Sidebar', description: 'Banner lateral' },
];

const positions = [
    { value: 'home_hero', label: 'Hero Inicio' },
    { value: 'home_promo', label: 'Promoción Inicio' },
    { value: 'sidebar', label: 'Sidebar' },
    { value: 'popup', label: 'Popup' },
    { value: 'footer', label: 'Footer' },
];

export default function PromocionesPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<Banner | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'hero',
        title: '',
        subtitle: '',
        description: '',
        image_url: '',
        cta_text: '',
        cta_url: '',
        background_color: '#dc2626',
        position: 'home_hero',
        is_active: true,
        show_from: '',
        show_until: '',
    });

    useEffect(() => { fetchBanners(); }, []);

    const fetchBanners = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching banners:', error);
        }
        setBanners(data || []);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            alert('El nombre es requerido');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: form.name,
                type: form.type,
                title: form.title || null,
                subtitle: form.subtitle || null,
                description: form.description || null,
                image_url: form.image_url || null,
                cta_text: form.cta_text || null,
                cta_url: form.cta_url || null,
                background_color: form.background_color || null,
                position: form.position,
                is_active: form.is_active,
                show_from: form.show_from || null,
                show_until: form.show_until || null,
            };

            if (editItem) {
                const { error } = await supabase.from('banners').update(payload).eq('id', editItem.id);
                if (error) throw error;
            } else {
                // Get max sort_order
                const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.sort_order)) : 0;
                const { error } = await supabase.from('banners').insert({ ...payload, sort_order: maxOrder + 1 });
                if (error) throw error;
            }

            setShowModal(false);
            resetForm();
            fetchBanners();
        } catch (error) {
            console.error('Error saving banner:', error);
            alert('Error al guardar el banner');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este banner? Esta acción no se puede deshacer.')) {
            const { error } = await supabase.from('banners').delete().eq('id', id);
            if (error) {
                console.error('Error deleting banner:', error);
                alert('Error al eliminar');
            } else {
                fetchBanners();
            }
        }
    };

    const toggleActive = async (banner: Banner) => {
        await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
        fetchBanners();
    };

    const moveOrder = async (banner: Banner, direction: 'up' | 'down') => {
        const currentIndex = banners.findIndex(b => b.id === banner.id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= banners.length) return;

        const targetBanner = banners[targetIndex];

        // Swap sort orders
        await supabase.from('banners').update({ sort_order: targetBanner.sort_order }).eq('id', banner.id);
        await supabase.from('banners').update({ sort_order: banner.sort_order }).eq('id', targetBanner.id);

        fetchBanners();
    };

    const resetForm = () => {
        setEditItem(null);
        setForm({
            name: '',
            type: 'hero',
            title: '',
            subtitle: '',
            description: '',
            image_url: '',
            cta_text: '',
            cta_url: '',
            background_color: '#dc2626',
            position: 'home_hero',
            is_active: true,
            show_from: '',
            show_until: '',
        });
    };

    const openEdit = (b: Banner) => {
        setEditItem(b);
        setForm({
            name: b.name || '',
            type: b.type || 'hero',
            title: b.title || '',
            subtitle: b.subtitle || '',
            description: b.description || '',
            image_url: b.image_url || '',
            cta_text: b.cta_text || '',
            cta_url: b.cta_url || '',
            background_color: b.background_color || '#dc2626',
            position: b.position || 'home_hero',
            is_active: b.is_active,
            show_from: b.show_from?.split('T')[0] || '',
            show_until: b.show_until?.split('T')[0] || '',
        });
        setShowModal(true);
    };

    const getTypeLabel = (type: string) => {
        return bannerTypes.find(t => t.value === type)?.label || type;
    };

    const getPositionLabel = (position: string) => {
        return positions.find(p => p.value === position)?.label || position;
    };

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MegaphoneIcon className="w-7 h-7 text-amber-500" />
                        Promociones y Banners
                    </h1>
                    <p className="text-gray-500 mt-1">Gestiona los banners promocionales del sitio público</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nueva Promoción
                </button>
            </div>

            {/* Empty State */}
            {banners.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay promociones</h3>
                    <p className="text-gray-500 mb-6">Crea tu primera promoción para mostrarla en el sitio público</p>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn-primary"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Crear Promoción
                    </button>
                </div>
            )}

            {/* Banners Grid */}
            {banners.length > 0 && (
                <div className="grid gap-4">
                    {banners.map((b, index) => (
                        <div
                            key={b.id}
                            className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${b.is_active ? 'border-green-500' : 'border-gray-300'}`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Preview Thumbnail */}
                                <div
                                    className="w-24 h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                                    style={{ backgroundColor: b.background_color || '#e5e7eb' }}
                                >
                                    {b.image_url ? (
                                        <img src={b.image_url} alt={b.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <PhotoIcon className="w-8 h-8 text-white/50" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate">{b.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {b.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    {b.title && (
                                        <p className="text-sm text-gray-600 truncate">{b.title}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{getTypeLabel(b.type)}</span>
                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{getPositionLabel(b.position)}</span>
                                        {b.show_from && (
                                            <span>📅 {new Date(b.show_from).toLocaleDateString('es-MX')}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => moveOrder(b, 'up')}
                                        disabled={index === 0}
                                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                                        title="Subir"
                                    >
                                        <ArrowUpIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveOrder(b, 'down')}
                                        disabled={index === banners.length - 1}
                                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                                        title="Bajar"
                                    >
                                        <ArrowDownIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => toggleActive(b)}
                                        className={`p-2 rounded ${b.is_active ? 'hover:bg-yellow-100 text-yellow-600' : 'hover:bg-green-100 text-green-600'}`}
                                        title={b.is_active ? 'Desactivar' : 'Activar'}
                                    >
                                        {b.is_active ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => openEdit(b)}
                                        className="p-2 hover:bg-blue-100 text-blue-600 rounded"
                                        title="Editar"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="p-2 hover:bg-red-100 text-red-500 rounded"
                                        title="Eliminar"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl max-w-2xl w-full p-6 my-8"
                    >
                        <h3 className="text-xl font-semibold mb-6">
                            {editItem ? 'Editar' : 'Nueva'} Promoción
                        </h3>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Nombre */}
                            <div>
                                <label className="label">Nombre interno *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ej: Promoción Verano 2024"
                                    className="input"
                                />
                            </div>

                            {/* Tipo y Posición */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Tipo de banner</label>
                                    <select
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value })}
                                        className="input"
                                    >
                                        {bannerTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Posición</label>
                                    <select
                                        value={form.position}
                                        onChange={e => setForm({ ...form, position: e.target.value })}
                                        className="input"
                                    >
                                        {positions.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Título y Subtítulo */}
                            <div>
                                <label className="label">Título principal</label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Ej: 🔥 ¡MEGA OFERTAS DE VERANO!"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="label">Subtítulo</label>
                                <input
                                    value={form.subtitle}
                                    onChange={e => setForm({ ...form, subtitle: e.target.value })}
                                    placeholder="Ej: 80 Megas + 100 Canales HD"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="label">Descripción (opcional)</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Descripción más detallada..."
                                    className="input"
                                    rows={2}
                                />
                            </div>

                            {/* Imagen y Color */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">URL de imagen</label>
                                    <input
                                        value={form.image_url}
                                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                                        placeholder="https://..."
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Color de fondo</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={form.background_color}
                                            onChange={e => setForm({ ...form, background_color: e.target.value })}
                                            className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                                        />
                                        <input
                                            type="text"
                                            value={form.background_color}
                                            onChange={e => setForm({ ...form, background_color: e.target.value })}
                                            className="input flex-1"
                                            placeholder="#dc2626"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CTA - Texto predefinido del botón */}
                            <div>
                                <label className="label">Texto del botón</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {[
                                        '¡Contrata Ahora!',
                                        'Aprovecha la Oferta',
                                        'Ver Promoción',
                                        '¡Lo Quiero!',
                                        'Contratar',
                                        'Más Información'
                                    ].map(text => (
                                        <button
                                            key={text}
                                            type="button"
                                            onClick={() => setForm({ ...form, cta_text: text })}
                                            className={`p-2 text-sm rounded-lg border-2 transition-all ${form.cta_text === text
                                                    ? 'border-primary bg-primary/10 text-primary font-medium'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 El botón llevará automáticamente a la página de contratación con esta promoción aplicada.
                                </p>
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Mostrar desde</label>
                                    <input
                                        type="date"
                                        value={form.show_from}
                                        onChange={e => setForm({ ...form, show_from: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Mostrar hasta</label>
                                    <input
                                        type="date"
                                        value={form.show_until}
                                        onChange={e => setForm({ ...form, show_until: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            {/* Estado */}
                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div>
                                    <span className="font-medium">Activo</span>
                                    <p className="text-sm text-gray-500">El banner se mostrará en el sitio público</p>
                                </div>
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-6 pt-4 border-t">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-outline flex-1"
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-primary flex-1"
                                disabled={saving}
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
