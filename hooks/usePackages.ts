/**
 * Custom hook for packages CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { packagesService, PackageData } from '@/services/packages.service';

export function usePackages() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchPackages = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await packagesService.getAll();
            setPackages(data);
        } catch (err) {
            console.error('Error fetching packages:', err);
            setError(err instanceof Error ? err.message : 'Error fetching packages');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    const openCreate = () => {
        setEditItem(null);
        setShowModal(true);
    };

    const openEdit = (pkg: any) => {
        setEditItem(pkg);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
    };

    const save = async (data: PackageData) => {
        setSaving(true);
        try {
            if (editItem) {
                await packagesService.update(editItem.id, data);
            } else {
                await packagesService.create(data);
            }
            closeModal();
            await fetchPackages();
        } catch (err) {
            console.error('Error saving package:', err);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        try {
            await packagesService.delete(id);
            await fetchPackages();
        } catch (err) {
            console.error('Error deleting package:', err);
            throw err;
        }
    };

    return {
        packages,
        loading,
        error,
        showModal,
        editItem,
        saving,
        openCreate,
        openEdit,
        closeModal,
        save,
        remove,
        refetch: fetchPackages,
    };
}
