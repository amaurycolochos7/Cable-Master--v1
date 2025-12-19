/**
 * Custom hook for coverage management (municipalities, postal codes, communities)
 */

import { useState, useEffect, useCallback } from 'react';
import { coverageService } from '@/services';

export function useCoverage() {
    const [municipalities, setMunicipalities] = useState<any[]>([]);
    const [postalCodes, setPostalCodes] = useState<any[]>([]);
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selection state
    const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null);
    const [selectedPostalCode, setSelectedPostalCode] = useState<string | null>(null);

    // Modal state
    const [showModal, setShowModal] = useState<'municipality' | 'postalCode' | 'community' | null>(null);
    const [editItem, setEditItem] = useState<any | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [munis, cps, comms] = await Promise.all([
                coverageService.getMunicipalities(),
                coverageService.getPostalCodes(),
                coverageService.getCommunities(),
            ]);

            setMunicipalities(munis);
            setPostalCodes(cps);
            setCommunities(comms);
        } catch (err) {
            console.error('Error fetching coverage data:', err);
            setError(err instanceof Error ? err.message : 'Error fetching data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filtered data based on selection
    const filteredPostalCodes = selectedMunicipality
        ? postalCodes.filter(cp => cp.municipality_id === selectedMunicipality)
        : [];

    const filteredCommunities = selectedPostalCode
        ? communities.filter(c => c.postal_code_id === selectedPostalCode)
        : [];

    const selectMunicipality = (id: string | null) => {
        setSelectedMunicipality(id);
        setSelectedPostalCode(null);
    };

    const selectPostalCode = (id: string | null) => {
        setSelectedPostalCode(id);
    };

    const openCreate = (type: 'municipality' | 'postalCode' | 'community') => {
        setEditItem(null);
        setShowModal(type);
    };

    const openEdit = (type: 'municipality' | 'postalCode' | 'community', item: any) => {
        setEditItem(item);
        setShowModal(type);
    };

    const closeModal = () => {
        setShowModal(null);
        setEditItem(null);
    };

    const saveMunicipality = async (data: { name: string; coverage_status: string }) => {
        await coverageService.saveMunicipality(data, editItem?.id);
        closeModal();
        await fetchData();
    };

    const savePostalCode = async (data: { code: string; coverage_status: string }) => {
        if (!selectedMunicipality && !editItem) throw new Error('No municipality selected');

        await coverageService.savePostalCode({
            ...data,
            municipality_id: editItem?.municipality_id || selectedMunicipality!,
        }, editItem?.id);
        closeModal();
        await fetchData();
    };

    const saveCommunity = async (data: { name: string; coverage_status: string }) => {
        if (!selectedPostalCode && !editItem) throw new Error('No postal code selected');

        await coverageService.saveCommunity({
            ...data,
            postal_code_id: editItem?.postal_code_id || selectedPostalCode!,
        }, editItem?.id);
        closeModal();
        await fetchData();
    };

    return {
        // Data
        municipalities,
        postalCodes: filteredPostalCodes,
        communities: filteredCommunities,
        loading,
        error,

        // Selection
        selectedMunicipality,
        selectedPostalCode,
        selectMunicipality,
        selectPostalCode,

        // Modal
        showModal,
        editItem,
        openCreate,
        openEdit,
        closeModal,

        // Actions
        saveMunicipality,
        savePostalCode,
        saveCommunity,
        refetch: fetchData,
    };
}
