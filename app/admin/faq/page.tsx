'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QuestionMarkCircleIcon, PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface FaqCategory { id: string; name: string; slug: string; icon: string | null; sort_order: number; }
interface FaqItem { id: string; category_id: string | null; question: string; answer: string; sort_order: number; is_featured: boolean; }

export default function FaqPage() {
    const [categories, setCategories] = useState<FaqCategory[]>([]);
    const [items, setItems] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState<'category' | 'item' | null>(null);
    const [editItem, setEditItem] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', icon: '', question: '', answer: '', category_id: '', is_featured: false });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const { data: cats } = await supabase.from('faq_categories').select('*').order('sort_order');
        const { data: faqs } = await supabase.from('faq_items').select('*').order('sort_order');
        setCategories(cats || []); setItems(faqs || []); setLoading(false);
    };

    const handleSaveCategory = async () => {
        const payload = { name: form.name, slug: form.slug, icon: form.icon || null, sort_order: categories.length };
        if (editItem) await supabase.from('faq_categories').update(payload).eq('id', editItem.id);
        else await supabase.from('faq_categories').insert(payload);
        setShowModal(null); resetForm(); fetchData();
    };

    const handleSaveItem = async () => {
        const payload = { question: form.question, answer: form.answer, category_id: form.category_id || null, is_featured: form.is_featured, sort_order: items.length };
        if (editItem) await supabase.from('faq_items').update(payload).eq('id', editItem.id);
        else await supabase.from('faq_items').insert(payload);
        setShowModal(null); resetForm(); fetchData();
    };

    const handleDelete = async (type: 'category' | 'item', id: string) => {
        if (confirm('¿Eliminar?')) {
            await supabase.from(type === 'category' ? 'faq_categories' : 'faq_items').delete().eq('id', id);
            fetchData();
        }
    };

    const resetForm = () => {
        setEditItem(null);
        setForm({ name: '', slug: '', icon: '', question: '', answer: '', category_id: '', is_featured: false });
    };

    const filteredItems = selectedCategory ? items.filter(i => i.category_id === selectedCategory) : items;

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2"><QuestionMarkCircleIcon className="w-7 h-7 text-green-500" />Preguntas Frecuentes</h1>
                <div className="flex gap-2">
                    <button onClick={() => { resetForm(); setShowModal('category'); }} className="btn-outline"><PlusIcon className="w-5 h-5 mr-2" />Categoría</button>
                    <button onClick={() => { resetForm(); setShowModal('item'); }} className="btn-primary"><PlusIcon className="w-5 h-5 mr-2" />Pregunta</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Categories */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <h2 className="font-semibold mb-4">Categorías</h2>
                    <div className="space-y-2">
                        <button onClick={() => setSelectedCategory(null)} className={`w-full text-left p-3 rounded-lg ${!selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}>Todas ({items.length})</button>
                        {categories.map(c => (
                            <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg ${selectedCategory === c.id ? 'bg-primary/10' : 'hover:bg-gray-50'}`}>
                                <button onClick={() => setSelectedCategory(c.id)} className="flex-1 text-left flex items-center gap-2">
                                    <span>{c.icon}</span><span>{c.name}</span><span className="text-gray-400">({items.filter(i => i.category_id === c.id).length})</span>
                                </button>
                                <button onClick={() => handleDelete('category', c.id)} className="p-1 hover:bg-red-100 rounded text-red-500"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Items */}
                <div className="lg:col-span-3 space-y-4">
                    {filteredItems.map(item => (
                        <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{item.question}</p>
                                    <p className="text-gray-600 mt-2">{item.answer}</p>
                                    <div className="flex gap-2 mt-2">
                                        {item.is_featured && <span className="badge badge-warning">⭐ Destacada</span>}
                                        {categories.find(c => c.id === item.category_id) && <span className="badge badge-info">{categories.find(c => c.id === item.category_id)?.name}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditItem(item); setForm({ ...form, question: item.question, answer: item.answer, category_id: item.category_id || '', is_featured: item.is_featured }); setShowModal('item'); }} className="p-2 hover:bg-gray-100 rounded"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete('item', item.id)} className="p-2 hover:bg-red-100 rounded text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            {showModal === 'category' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">{editItem ? 'Editar' : 'Nueva'} Categoría</h3>
                        <div className="space-y-4">
                            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s/g, '-') })} placeholder="Nombre" className="input" />
                            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Slug" className="input" />
                            <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="Emoji ícono" className="input" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(null)} className="btn-outline flex-1">Cancelar</button>
                            <button onClick={handleSaveCategory} className="btn-primary flex-1">Guardar</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {showModal === 'item' && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">{editItem ? 'Editar' : 'Nueva'} Pregunta</h3>
                        <div className="space-y-4">
                            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="input">
                                <option value="">Sin categoría</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Pregunta" className="input" />
                            <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="Respuesta" rows={4} className="input" />
                            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />Destacada</label>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowModal(null)} className="btn-outline flex-1">Cancelar</button>
                            <button onClick={handleSaveItem} className="btn-primary flex-1">Guardar</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
