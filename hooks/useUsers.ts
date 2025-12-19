/**
 * Custom hook for user management
 */

import { useState, useEffect, useCallback } from 'react';
import { usersService } from '@/services';
import type { User, UserFormData, DEFAULT_USER_FORM } from '@/types';

interface UseUsersReturn {
    users: User[];
    loading: boolean;
    error: string | null;
    // Modal state
    showModal: boolean;
    editItem: User | null;
    form: UserFormData;
    // Actions
    openCreate: () => void;
    openEdit: (user: User) => void;
    closeModal: () => void;
    setForm: React.Dispatch<React.SetStateAction<UserFormData>>;
    handleSave: () => Promise<void>;
    toggleActive: (user: User) => Promise<void>;
    refetch: () => Promise<void>;
}

const defaultForm: UserFormData = {
    email: '',
    password: '',
    full_name: '',
    role: 'counter',
    phone: '',
    is_active: true,
};

export function useUsers(): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<User | null>(null);
    const [form, setForm] = useState<UserFormData>(defaultForm);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await usersService.getAll();
            setUsers(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const resetForm = useCallback(() => {
        setEditItem(null);
        setForm(defaultForm);
    }, []);

    const openCreate = useCallback(() => {
        resetForm();
        setShowModal(true);
    }, [resetForm]);

    const openEdit = useCallback((user: User) => {
        setEditItem(user);
        setForm({
            email: user.email,
            password: '',
            full_name: user.full_name,
            role: user.role,
            phone: user.phone || '',
            is_active: user.is_active,
        });
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        resetForm();
    }, [resetForm]);

    const handleSave = useCallback(async () => {
        try {
            if (editItem) {
                await usersService.update(editItem.id, form);
            } else {
                const result = await usersService.create(form);
                if (!result.success) {
                    alert(result.error);
                    return;
                }
            }
            closeModal();
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error saving user');
        }
    }, [editItem, form, closeModal, fetchUsers]);

    const toggleActive = useCallback(async (user: User) => {
        try {
            await usersService.toggleActive(user);
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error toggling user status');
        }
    }, [fetchUsers]);

    return {
        users,
        loading,
        error,
        showModal,
        editItem,
        form,
        openCreate,
        openEdit,
        closeModal,
        setForm,
        handleSave,
        toggleActive,
        refetch: fetchUsers,
    };
}
