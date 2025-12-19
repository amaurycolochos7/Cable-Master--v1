/**
 * Packages Service - Data access layer for service packages
 */

import { supabase } from '@/lib/supabase';

export interface PackageData {
    name: string;
    type: string;
    speed_mbps?: number | null;
    channels_count?: number | null;
    monthly_price: number;
    install_price: number;
    features: string[];
    is_active: boolean;
    is_featured: boolean;
}

export const packagesService = {
    /**
     * Get all packages ordered by price
     */
    async getAll() {
        const { data, error } = await supabase
            .from('service_packages')
            .select('*')
            .order('monthly_price');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get active packages only
     */
    async getActive() {
        const { data, error } = await supabase
            .from('service_packages')
            .select('*')
            .eq('is_active', true)
            .order('monthly_price');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get package by ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('service_packages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create new package
     */
    async create(packageData: PackageData) {
        const { data, error } = await supabase
            .from('service_packages')
            .insert(packageData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update existing package
     */
    async update(id: string, packageData: Partial<PackageData>) {
        const { data, error } = await supabase
            .from('service_packages')
            .update(packageData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete package
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('service_packages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Toggle package active status
     */
    async toggleActive(id: string, isActive: boolean) {
        const { error } = await supabase
            .from('service_packages')
            .update({ is_active: !isActive })
            .eq('id', id);

        if (error) throw error;
    },
};
