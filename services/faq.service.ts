/**
 * FAQ Service - Data access layer for FAQ categories and items
 */

import { supabase } from '@/lib/supabase';

export interface FaqCategoryData {
    name: string;
    slug: string;
    icon?: string | null;
    sort_order?: number;
}

export interface FaqItemData {
    question: string;
    answer: string;
    category_id?: string | null;
    is_featured: boolean;
    sort_order?: number;
}

export const faqService = {
    /**
     * Get all categories
     */
    async getCategories() {
        const { data, error } = await supabase
            .from('faq_categories')
            .select('*')
            .order('sort_order');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get all FAQ items
     */
    async getItems() {
        const { data, error } = await supabase
            .from('faq_items')
            .select('*')
            .order('sort_order');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get items by category
     */
    async getItemsByCategory(categoryId: string) {
        const { data, error } = await supabase
            .from('faq_items')
            .select('*')
            .eq('category_id', categoryId)
            .order('sort_order');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get featured items
     */
    async getFeaturedItems() {
        const { data, error } = await supabase
            .from('faq_items')
            .select('*')
            .eq('is_featured', true)
            .order('sort_order');

        if (error) throw error;
        return data || [];
    },

    /**
     * Save category (create or update)
     */
    async saveCategory(categoryData: FaqCategoryData, id?: string) {
        if (id) {
            const { error } = await supabase
                .from('faq_categories')
                .update(categoryData)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('faq_categories')
                .insert(categoryData);
            if (error) throw error;
        }
    },

    /**
     * Save item (create or update)
     */
    async saveItem(itemData: FaqItemData, id?: string) {
        if (id) {
            const { error } = await supabase
                .from('faq_items')
                .update(itemData)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('faq_items')
                .insert(itemData);
            if (error) throw error;
        }
    },

    /**
     * Delete category
     */
    async deleteCategory(id: string) {
        const { error } = await supabase
            .from('faq_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Delete item
     */
    async deleteItem(id: string) {
        const { error } = await supabase
            .from('faq_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
