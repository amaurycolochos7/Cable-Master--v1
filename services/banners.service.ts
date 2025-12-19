/**
 * Banners Service - Data access layer for promotional banners
 */

import { supabase } from '@/lib/supabase';

export interface BannerData {
    title: string;
    subtitle?: string | null;
    image_url?: string | null;
    link_url?: string | null;
    link_text?: string | null;
    position: string;
    is_active: boolean;
    start_date?: string | null;
    end_date?: string | null;
}

export const bannersService = {
    /**
     * Get all banners
     */
    async getAll() {
        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get active banners for a position
     */
    async getActiveByPosition(position: string) {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('banners')
            .select('*')
            .eq('position', position)
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${now}`)
            .or(`end_date.is.null,end_date.gte.${now}`);

        if (error) throw error;
        return data || [];
    },

    /**
     * Create new banner
     */
    async create(bannerData: BannerData) {
        const { data, error } = await supabase
            .from('banners')
            .insert(bannerData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update existing banner
     */
    async update(id: string, bannerData: Partial<BannerData>) {
        const { data, error } = await supabase
            .from('banners')
            .update(bannerData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete banner
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('banners')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Toggle banner active status
     */
    async toggleActive(id: string, currentStatus: boolean) {
        const { error } = await supabase
            .from('banners')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (error) throw error;
    },
};
