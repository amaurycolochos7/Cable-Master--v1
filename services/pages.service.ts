/**
 * Pages Service - Data access layer for CMS pages and blocks
 */

import { supabase } from '@/lib/supabase';

export interface PageData {
    slug: string;
    title: string;
    description?: string | null;
    template: string;
    is_published: boolean;
}

export interface PageBlockData {
    page_id: string;
    block_type: string;
    title?: string | null;
    sort_order: number;
    config?: any;
    content?: any;
    is_visible: boolean;
}

export const pagesService = {
    /**
     * Get all pages
     */
    async getAll() {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .order('title');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get published pages only
     */
    async getPublished() {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('is_published', true)
            .order('title');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get page by ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get page by slug
     */
    async getBySlug(slug: string) {
        const { data, error } = await supabase
            .from('pages')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Save page (create or update)
     */
    async save(pageData: PageData, id?: string) {
        if (id) {
            const { error } = await supabase
                .from('pages')
                .update(pageData)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('pages')
                .insert(pageData);
            if (error) throw error;
        }
    },

    /**
     * Delete page and its blocks
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('pages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Toggle page published status
     */
    async togglePublish(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('pages')
            .update({ is_published: !currentStatus })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get blocks for a page
     */
    async getBlocks(pageId: string) {
        const { data, error } = await supabase
            .from('page_blocks')
            .select('*')
            .eq('page_id', pageId)
            .order('sort_order');

        if (error) throw error;
        return data || [];
    },

    /**
     * Add block to page
     */
    async addBlock(blockData: PageBlockData) {
        const { error } = await supabase
            .from('page_blocks')
            .insert(blockData);

        if (error) throw error;
    },

    /**
     * Update block
     */
    async updateBlock(id: string, blockData: Partial<PageBlockData>) {
        const { error } = await supabase
            .from('page_blocks')
            .update(blockData)
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Delete block
     */
    async deleteBlock(id: string) {
        const { error } = await supabase
            .from('page_blocks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Toggle block visibility
     */
    async toggleBlockVisibility(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('page_blocks')
            .update({ is_visible: !currentStatus })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Reorder blocks
     */
    async reorderBlocks(blocks: { id: string; sort_order: number }[]) {
        for (const block of blocks) {
            await supabase
                .from('page_blocks')
                .update({ sort_order: block.sort_order })
                .eq('id', block.id);
        }
    },
};
