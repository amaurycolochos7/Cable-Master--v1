'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { ChartBarIcon, ArrowDownTrayIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface Stats { totalContratos: number; contratosInstalados: number; totalFallas: number; fallasResueltas: number; ticketsHoy: number; ticketsSemana: number; ticketsMes: number; }

export default function ReportesPage() {
    const [stats, setStats] = useState<Stats>({ totalContratos: 0, contratosInstalados: 0, totalFallas: 0, fallasResueltas: 0, ticketsHoy: 0, ticketsSemana: 0, ticketsMes: 0 });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [{ count: totalContratos }, { count: contratosInstalados }, { count: totalFallas }, { count: fallasResueltas }, { count: ticketsHoy }, { count: ticketsSemana }, { count: ticketsMes }] = await Promise.all([
            supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('type', 'contract'),
            supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('type', 'contract').eq('contract_status', 'INSTALLED'),
            supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('type', 'fault'),
            supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('type', 'fault').eq('fault_status', 'RESOLVED'),
            supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', today),
            supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
            supabase.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo),
        ]);

        setStats({
            totalContratos: totalContratos || 0, contratosInstalados: contratosInstalados || 0,
            totalFallas: totalFallas || 0, fallasResueltas: fallasResueltas || 0,
            ticketsHoy: ticketsHoy || 0, ticketsSemana: ticketsSemana || 0, ticketsMes: ticketsMes || 0,
        });
        setLoading(false);
    };

    const exportCSV = async (type: 'contracts' | 'faults') => {
        const { data } = await supabase.from('tickets').select('folio, full_name, phone, address, created_at, contract_status, fault_status').eq('type', type === 'contracts' ? 'contract' : 'fault').order('created_at', { ascending: false });
        if (!data) return;

        const headers = ['Folio', 'Nombre', 'Teléfono', 'Dirección', 'Fecha', 'Estado'];
        const csv = [headers.join(','), ...data.map(r => [r.folio, `"${r.full_name}"`, r.phone, `"${r.address}"`, new Date(r.created_at).toLocaleDateString(), r.contract_status || r.fault_status].join(','))].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    };

    if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center gap-2"><ChartBarIcon className="w-7 h-7 text-purple-500" />Reportes y Estadísticas</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-3xl font-bold text-primary">{stats.totalContratos}</p><p className="text-gray-500 text-sm">Total Contrataciones</p></div>
                <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-3xl font-bold text-green-600">{stats.contratosInstalados}</p><p className="text-gray-500 text-sm">Instalados</p></div>
                <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-3xl font-bold text-red-500">{stats.totalFallas}</p><p className="text-gray-500 text-sm">Total Fallas</p></div>
                <div className="bg-white rounded-xl shadow-sm p-6"><p className="text-3xl font-bold text-green-600">{stats.fallasResueltas}</p><p className="text-gray-500 text-sm">Fallas Resueltas</p></div>
            </div>

            {/* Time-based Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold mb-4">Actividad</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold">{stats.ticketsHoy}</p><p className="text-sm text-gray-500">Hoy</p></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold">{stats.ticketsSemana}</p><p className="text-sm text-gray-500">Últimos 7 días</p></div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg"><p className="text-2xl font-bold">{stats.ticketsMes}</p><p className="text-sm text-gray-500">Últimos 30 días</p></div>
                </div>
            </div>

            {/* Export */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold mb-4">Exportar Datos</h2>
                <div className="flex gap-4 flex-wrap">
                    <button onClick={() => exportCSV('contracts')} className="btn-outline"><ArrowDownTrayIcon className="w-5 h-5 mr-2" />Exportar Contrataciones (CSV)</button>
                    <button onClick={() => exportCSV('faults')} className="btn-outline"><ArrowDownTrayIcon className="w-5 h-5 mr-2" />Exportar Fallas (CSV)</button>
                </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold mb-4">Tasas de Conversión</h2>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Contrataciones → Instalaciones</p>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalContratos ? (stats.contratosInstalados / stats.totalContratos * 100) : 0}%` }} />
                        </div>
                        <p className="text-right text-sm font-semibold mt-1">{stats.totalContratos ? (stats.contratosInstalados / stats.totalContratos * 100).toFixed(1) : 0}%</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Fallas → Resueltas</p>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalFallas ? (stats.fallasResueltas / stats.totalFallas * 100) : 0}%` }} />
                        </div>
                        <p className="text-right text-sm font-semibold mt-1">{stats.totalFallas ? (stats.fallasResueltas / stats.totalFallas * 100).toFixed(1) : 0}%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
