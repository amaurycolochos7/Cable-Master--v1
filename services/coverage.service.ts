/**
 * Coverage Service - Data access layer for municipalities, postal codes, and communities
 */

import { supabase } from '@/lib/supabase';

export interface MunicipalityData {
    name: string;
    coverage_status: string;
    is_active?: boolean;
}

export interface PostalCodeData {
    code: string;
    municipality_id: string;
    coverage_status: string;
}

export interface CommunityData {
    name: string;
    postal_code_id: string;
    coverage_status: string;
}

export const coverageService = {
    /**
     * Get all municipalities
     */
    async getMunicipalities() {
        const { data, error } = await supabase
            .from('municipalities')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get all postal codes
     */
    async getPostalCodes() {
        const { data, error } = await supabase
            .from('postal_codes')
            .select('*')
            .order('code');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get postal codes by municipality
     */
    async getPostalCodesByMunicipality(municipalityId: string) {
        const { data, error } = await supabase
            .from('postal_codes')
            .select('*')
            .eq('municipality_id', municipalityId)
            .order('code');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get all communities
     */
    async getCommunities() {
        const { data, error } = await supabase
            .from('communities')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get communities by postal code
     */
    async getCommunitiesByPostalCode(postalCodeId: string) {
        const { data, error } = await supabase
            .from('communities')
            .select('*')
            .eq('postal_code_id', postalCodeId)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Save municipality (create or update)
     */
    async saveMunicipality(data: MunicipalityData, id?: string) {
        if (id) {
            const { error } = await supabase
                .from('municipalities')
                .update(data)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('municipalities')
                .insert(data);
            if (error) throw error;
        }
    },

    /**
     * Save postal code (create or update)
     */
    async savePostalCode(data: PostalCodeData, id?: string) {
        if (id) {
            const { error } = await supabase
                .from('postal_codes')
                .update({ code: data.code, coverage_status: data.coverage_status })
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('postal_codes')
                .insert(data);
            if (error) throw error;
        }
    },

    /**
     * Save community (create or update)
     */
    async saveCommunity(data: CommunityData, id?: string) {
        if (id) {
            const { error } = await supabase
                .from('communities')
                .update({ name: data.name, coverage_status: data.coverage_status })
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('communities')
                .insert(data);
            if (error) throw error;
        }
    },
};
