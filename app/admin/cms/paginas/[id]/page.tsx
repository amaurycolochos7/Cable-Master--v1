'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, Reorder } from 'framer-motion';
import { ArrowLeftIcon, PlusIcon, TrashIcon, Bars3Icon, EyeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Page { id: string; slug: string; title: string; }
interface Block { id: string; block_type: string; title: string | null; sort_order: number; config: any; content: any; is_visible: boolean; }

const blockTypes = [
    { type: 'hero', label: 'Hero', icon: '🎯' },
    { type: 'text', label: 'Texto', icon: '📝' },
    { type: 'image', label: 'Imagen', icon: '🖼️' },
    { type: 'cards', label: 'Tarjetas', icon: '🃏' },
    { type: 'pricing', label: 'Precios', icon: '💰' },
    { type: 'faq', label: 'FAQ', icon: '❓' },
    { type: 'cta', label: 'Call to Action', icon: '📣' },
    { type: 'gallery', label: 'Galería', icon: '📸' },
    { type: 'testimonials', label: 'Testimonios', icon: '💬' },
    { type: 'packages_grid', label: 'Grid Paquetes', icon: '📦' },
    { type: 'coverage_checker', label: 'Verificar Cobertura', icon: '📍' },
    { type: 'contact_form', label: 'Formulario', icon: '✉️' },
    { type: 'spacer', label: 'Espaciador', icon: '↕️' },
];

export default function PageBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.id as string;
    const [page, setPage] = useState<Page | null>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddBlock, setShowAddBlock] = useState(false);
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [blockForm, setBlockForm] = useState({ title: '', content: '' });

    useEffect(() => { if (pageId) fetchData(); }, [pageId]);

    const fetchData = async () => {
        const { data: pageData } = await supabase.from('pages').select('id, slug, title').eq('id', pageId).single();
        const { data: blocksData } = await supabase.from('page_blocks').select('*').eq('page_id', pageId).order('sort_order');
        setPage(pageData); setBlocks(blocksData || []); setLoading(false);
    };

    const addBlock = async (type: string) => {
        const newBlock = { page_id: pageId, block_type: type, sort_order: blocks.length, config: {}, content: {}, is_visible: true };
        await supabase.from('page_blocks').insert(newBlock);
        setShowAddBlock(false); fetchData();
    };

    const deleteBlock = async (id: string) => {
        if (confirm('¿Eliminar este bloque?')) { await supabase.from('page_blocks').delete().eq('id', id); fetchData(); }
    };

    const toggleVisibility = async (block: Block) => {
        await supabase.from('page_blocks').update({ is_visible: !block.is_visible }).eq('id', block.id);
        fetchData();
    };

    const handleReorder = async (newOrder: Block[]) => {
        setBlocks(newOrder);
        for (let i = 0; i < newOrder.length; i++) {
            await supabase.from('page_blocks').update({ sort_order: i }).eq('id', newOrder[i].id);
        }
    };

    const saveBlockContent = async () => {
        if (!editingBlock) return;
        await supabase.from('page_blocks').update({ title: blockForm.title || null, content: { text: blockForm.content } }).eq('id', editingBlock.id);
        setEditingBlock(null); fetchData();
    };

    const openEditBlock = (block: Block) => {
        setEditingBlock(block);
        setBlockForm({ title: block.title || '', content: block.content?.text || '' });
    };

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
    if (!page) return <div className="text-center py-12">Página no encontrada</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/cms/paginas" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeftIcon className="w-5 h-5" /></Link>
                    <div><h1 className="text-2xl font-bold">{page.title}</h1><p className="text-gray-500 font-mono text-sm">/{page.slug}</p></div>
                </div>
                <div className="flex gap-2">
                    <a href={`/public/${page.slug}`} target="_blank" className="btn-outline"><EyeIcon className="w-5 h-5 mr-2" />Vista Previa</a>
                    <button onClick={() => setShowAddBlock(true)} className="btn-primary"><PlusIcon className="w-5 h-5 mr-2" />Agregar Bloque</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Blocks List */}
                <div className="lg:col-span-2 space-y-4">
                    {blocks.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <p className="text-gray-500 mb-4">Esta página no tiene bloques</p>
                            <button onClick={() => setShowAddBlock(true)} className="btn-primary">Agregar Primer Bloque</button>
                        </div>
                    ) : (
                        <Reorder.Group values={blocks} onReorder={handleReorder} className="space-y-3">
                            {blocks.map(block => (
                                <Reorder.Item key={block.id} value={block} className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 cursor-move ${!block.is_visible ? 'opacity-50' : ''}`}>
                                    <Bars3Icon className="w-5 h-5 text-gray-400" />
                                    <span className="text-2xl">{blockTypes.find(b => b.type === block.block_type)?.icon || '📦'}</span>
                                    <div className="flex-1">
                                        <p className="font-medium">{block.title || blockTypes.find(b => b.type === block.block_type)?.label}</p>
                                        <p className="text-sm text-gray-500">{block.block_type}</p>
                                    </div>
                                    <button onClick={() => openEditBlock(block)} className="p-2 hover:bg-gray-100 rounded"><Cog6ToothIcon className="w-5 h-5" /></button>
                                    <button onClick={() => toggleVisibility(block)} className="p-2 hover:bg-gray-100 rounded"><EyeIcon className={`w-5 h-5 ${!block.is_visible ? 'text-gray-300' : ''}`} /></button>
                                    <button onClick={() => deleteBlock(block.id)} className="p-2 hover:bg-red-100 rounded text-red-500"><TrashIcon className="w-5 h-5" /></button>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    )}
                </div>

                {/* Block Editor Panel */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="font-semibold mb-4">Editar Bloque</h2>
                    {editingBlock ? (
                        <div className="space-y-4">
                            <div><label className="label">Título del bloque</label><input value={blockForm.title} onChange={e => setBlockForm({ ...blockForm, title: e.target.value })} className="input" /></div>
                            <div><label className="label">Contenido</label><textarea value={blockForm.content} onChange={e => setBlockForm({ ...blockForm, content: e.target.value })} rows={6} className="input" /></div>
                            <button onClick={saveBlockContent} className="btn-primary w-full">Guardar Bloque</button>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">Selecciona un bloque para editar</p>
                    )}
                </div>
            </div>

            {/* Add Block Modal */}
            {showAddBlock && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Agregar Bloque</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {blockTypes.map(bt => (
                                <button key={bt.type} onClick={() => addBlock(bt.type)} className="p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 text-center transition-all">
                                    <span className="text-3xl block mb-2">{bt.icon}</span>
                                    <span className="text-sm font-medium">{bt.label}</span>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowAddBlock(false)} className="btn-outline w-full mt-6">Cancelar</button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
