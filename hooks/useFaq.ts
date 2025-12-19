/**
 * Custom hook for FAQ categories and items CRUD
 */

import { useState, useEffect, useCallback } from 'react';
import { faqService, FaqCategoryData, FaqItemData } from '@/services/faq.service';

export function useFaq() {
    const [categories, setCategories] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState<'category' | 'item' | null>(null);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [cats, faqs] = await Promise.all([
                faqService.getCategories(),
                faqService.getItems(),
            ]);

            setCategories(cats);
            setItems(faqs);
        } catch (err) {
            console.error('Error fetching FAQ data:', err);
            setError(err instanceof Error ? err.message : 'Error fetching data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filtered items based on category selection
    const filteredItems = selectedCategory
        ? items.filter(item => item.category_id === selectedCategory)
        : items;

    const openCreateCategory = () => {
        setEditItem(null);
        setShowModal('category');
    };

    const openCreateItem = () => {
        setEditItem(null);
        setShowModal('item');
    };

    const openEditCategory = (category: any) => {
        setEditItem(category);
        setShowModal('category');
    };

    const openEditItem = (item: any) => {
        setEditItem(item);
        setShowModal('item');
    };

    const closeModal = () => {
        setShowModal(null);
        setEditItem(null);
    };

    const saveCategory = async (data: FaqCategoryData) => {
        setSaving(true);
        try {
            await faqService.saveCategory({
                ...data,
                sort_order: editItem?.sort_order ?? categories.length,
            }, editItem?.id);
            closeModal();
            await fetchData();
        } catch (err) {
            console.error('Error saving category:', err);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const saveItem = async (data: FaqItemData) => {
        setSaving(true);
        try {
            await faqService.saveItem({
                ...data,
                sort_order: editItem?.sort_order ?? items.length,
            }, editItem?.id);
            closeModal();
            await fetchData();
        } catch (err) {
            console.error('Error saving item:', err);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            await faqService.deleteCategory(id);
            await fetchData();
        } catch (err) {
            console.error('Error deleting category:', err);
            throw err;
        }
    };

    const deleteItem = async (id: string) => {
        try {
            await faqService.deleteItem(id);
            await fetchData();
        } catch (err) {
            console.error('Error deleting item:', err);
            throw err;
        }
    };

    return {
        categories,
        items: filteredItems,
        allItems: items,
        loading,
        error,
        selectedCategory,
        setSelectedCategory,
        showModal,
        editItem,
        saving,
        openCreateCategory,
        openCreateItem,
        openEditCategory,
        openEditItem,
        closeModal,
        saveCategory,
        saveItem,
        deleteCategory,
        deleteItem,
        refetch: fetchData,
    };
}
