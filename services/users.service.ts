/**
 * Users service - Supabase data access layer
 */

import { supabase } from '@/lib/supabase';
import type { User, UserFormData } from '@/types';

export const usersService = {
    /**
     * Fetch all users ordered by creation date
     */
    async getAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Create a new user with Supabase Auth + profile
     */
    async create(formData: UserFormData): Promise<{ success: boolean; error?: string }> {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
        });

        if (authError) {
            return { success: false, error: authError.message };
        }

        if (authData.user) {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                email: formData.email,
                full_name: formData.full_name,
                role: formData.role,
                phone: formData.phone || null,
                is_active: true,
            });

            if (profileError) {
                return { success: false, error: profileError.message };
            }
        }

        return { success: true };
    },

    /**
     * Update an existing user profile
     */
    async update(userId: string, formData: Partial<UserFormData>): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: formData.full_name,
                role: formData.role,
                phone: formData.phone || null,
                is_active: formData.is_active,
            })
            .eq('id', userId);

        if (error) throw error;
    },

    /**
     * Toggle user active status
     */
    async toggleActive(user: User): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: !user.is_active })
            .eq('id', user.id);

        if (error) throw error;
    },
};
