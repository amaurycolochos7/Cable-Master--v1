/**
 * User types and role configuration
 */

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    phone: string | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    branch_id?: string;
    assigned_locations?: string[];
}

export type UserRole = 'master' | 'admin' | 'counter' | 'tech' | 'client';

export interface RoleConfig {
    label: string;
    color: string;
}

export const ROLE_LABELS: Record<UserRole, RoleConfig> = {
    master: { label: 'Master', color: 'bg-purple-100 text-purple-800' },
    admin: { label: 'Administrador', color: 'bg-blue-100 text-blue-800' },
    counter: { label: 'Mostrador', color: 'bg-green-100 text-green-800' },
    tech: { label: 'Técnico', color: 'bg-orange-100 text-orange-800' },
    client: { label: 'Cliente', color: 'bg-gray-100 text-gray-800' },
};

export interface UserFormData {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    phone: string;
    is_active: boolean;
}

export const DEFAULT_USER_FORM: UserFormData = {
    email: '',
    password: '',
    full_name: '',
    role: 'counter',
    phone: '',
    is_active: true,
};
