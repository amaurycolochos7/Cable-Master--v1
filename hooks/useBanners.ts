/**
 * Custom hook for banners CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { bannersService, BannerData } from '@/services/banners.service';

export function useBanners() {
    const [banners, setBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchBanners = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await bannersService.getAll();
            setBanners(data);
        } catch (err) {
            console.error('Error fetching banners:', err);
            setError(err instanceof Error ? err.message : 'Error fetching banners');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const openCreate = () => {
        setEditItem(null);
        setShowModal(true);
    };

    const openEdit = (banner: any) => {
        setEditItem(banner);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditItem(null);
    };

    const save = async (data: BannerData) => {
        setSaving(true);
        try {
            if (editItem) {
                await bannersService.update(editItem.id, data);
            } else {
                await bannersService.create(data);
            }
            closeModal();
            await fetchBanners();
        } catch (err) {
            console.error('Error saving banner:', err);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        try {
            await bannersService.delete(id);
            await fetchBanners();
        } catch (err) {
            console.error('Error deleting banner:', err);
            throw err;
        }
    };

    const toggleActive = async (banner: any) => {
        try {
            await bannersService.toggleActive(banner.id, banner.is_active);
            await fetchBanners();
        } catch (err) {
            console.error('Error toggling banner:', err);
            throw err;
        }
    };

    return {
        banners,
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
        toggleActive,
        refetch: fetchBanners,
    };
}
