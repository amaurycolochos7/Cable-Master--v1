'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DocumentTextIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Page { id: string; slug: string; title: string; description: string | null; is_published: boolean; template: string; created_at: string; updated_at: string; }

export default function CMSPaginasPage() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<Page | null>(null);
    const [form, setForm] = useState({ slug: '', title: '', description: '', template: 'default', is_published: false });

    useEffect(() => { fetchPages(); }, []);

    const fetchPages = async () => {
        const { data } = await supabase.from('pages').select('*').order('title');
        setPages(data || []); setLoading(false);
    };

    const handleSave = async () => {
        const payload = { slug: form.slug, title: form.title, description: form.description || null, template: form.template, is_published: form.is_published };
        if (editItem) await supabase.from('pages').update(payload).eq('id', editItem.id);
        else await supabase.from('pages').insert(payload);
        setShowModal(false); resetForm(); fetchPages();
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar esta página y todos sus bloques?')) {
            await supabase.from('pages').delete().eq('id', id);
            fetchPages();
        }
    };

    const togglePublish = async (page: Page) => {
        await supabase.from('pages').update({ is_published: !page.is_published }).eq('id', page.id);
        fetchPages();
    };

    const resetForm = () => { setEditItem(null); setForm({ slug: '', title: '', description: '', template: 'default', is_published: false }); };

    const openEdit = (p: Page) => {
        setEditItem(p);
        setForm({ slug: p.slug, title: p.title, description: p.description || '', template: p.template, is_published: p.is_published });
        setShowModal(true);
    };

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2"><DocumentTextIcon className="w-7 h-7 text-indigo-500" />CMS - Páginas</h1>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary"><PlusIcon className="w-5 h-5 mr-2" />Nueva Página</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map(page => (
                    <motion.div key={page.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-white rounded-xl shadow-sm p-6 border-2 ${page.is_published ? 'border-green-200' : 'border-transparent'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-lg">{page.title}</h3>
                                <p className="text-sm text-gray-500 font-mono">/{page.slug}</p>
                            </div>
                            <span className={`badge ${page.is_published ? 'badge-success' : 'bg-gray-100'}`}>{page.is_published ? 'Publicada' : 'Borrador'}</span>
                        </div>
                        {page.description && <p className="text-gray-600 text-sm mb-4">{page.description}</p>}
                        <div className="flex gap-2 pt-4 border-t">
                            <Link href={`/admin/cms/paginas/${page.id}`} className="btn-outline flex-1 text-center text-sm py-2"><PencilIcon className="w-4 h-4 inline mr-1" />Editar</Link>
                            <button onClick={() => togglePublish(page)} className="p-2 hover:bg-gray-100 rounded"><GlobeAltIcon className="w-5 h-5" /></button>
                            <a href={`/public/${page.slug}`} target="_blank" className="p-2 hover:bg-gray-100 rounded"><EyeIcon className="w-5 h-5" /></a>
                            <button onClick={() => handleDelete(page.id)} className="p-2 hover:bg-red-100 rounded text-red-500"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">{editItem ? 'Editar' : 'Nueva'} Página</h3>
                        <div className="space-y-4">
                            <div><label className="label">Título</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} className="input" /></div>
                            <div><label className="label">Slug (URL)</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input font-mono" /></div>
                            <div><label className="label">Descripción</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input" /></div>
                            <div><label className="label">Template</label><select value={form.template} onChange={e => setForm({ ...form, template: e.target.value })} className="input">
                                <option value="default">Default</option><option value="landing">Landing Page</option><option value="legal">Legal</option>
                            </select></div>
                            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="rounded" />Publicar inmediatamente</label>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="btn-outline flex-1">Cancelar</button>
                            <button onClick={handleSave} className="btn-primary flex-1">Guardar</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
