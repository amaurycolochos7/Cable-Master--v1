'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Cog6ToothIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function ConfiguracionPage() {
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        company_name: 'Cable Master',
        company_phone: '961 248 3470',
        company_email: 'contacto@cablemaster.com.mx',
        company_address: 'Chiapa de Corzo, Chiapas',
        whatsapp_number: '5219612483470',
        support_hours: 'Lun-Vie 9:00 - 18:00',
        install_price_default: '500',
        folio_prefix_contract: 'CON',
        folio_prefix_fault: 'FAL',
        auto_assign_tickets: true,
        send_whatsapp_notifications: true,
        send_email_notifications: false,
    });

    const handleSave = () => {
        // In production, save to database or API
        localStorage.setItem('cablemaster_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold flex items-center gap-2"><Cog6ToothIcon className="w-7 h-7 text-gray-600" />Configuración</h1>

            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                    <h2 className="font-semibold text-lg mb-4 pb-2 border-b">Datos de la Empresa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Nombre de la empresa</label><input value={settings.company_name} onChange={e => setSettings({ ...settings, company_name: e.target.value })} className="input" /></div>
                        <div><label className="label">Teléfono</label><input value={settings.company_phone} onChange={e => setSettings({ ...settings, company_phone: e.target.value })} className="input" /></div>
                        <div><label className="label">Email</label><input value={settings.company_email} onChange={e => setSettings({ ...settings, company_email: e.target.value })} className="input" /></div>
                        <div><label className="label">WhatsApp</label><input value={settings.whatsapp_number} onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })} className="input" /></div>
                        <div className="md:col-span-2"><label className="label">Dirección</label><input value={settings.company_address} onChange={e => setSettings({ ...settings, company_address: e.target.value })} className="input" /></div>
                        <div><label className="label">Horario de atención</label><input value={settings.support_hours} onChange={e => setSettings({ ...settings, support_hours: e.target.value })} className="input" /></div>
                    </div>
                </div>

                <div>
                    <h2 className="font-semibold text-lg mb-4 pb-2 border-b">Configuración de Tickets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="label">Prefijo folio contratación</label><input value={settings.folio_prefix_contract} onChange={e => setSettings({ ...settings, folio_prefix_contract: e.target.value })} className="input" /></div>
                        <div><label className="label">Prefijo folio fallas</label><input value={settings.folio_prefix_fault} onChange={e => setSettings({ ...settings, folio_prefix_fault: e.target.value })} className="input" /></div>
                        <div><label className="label">Precio instalación por defecto</label><input type="number" value={settings.install_price_default} onChange={e => setSettings({ ...settings, install_price_default: e.target.value })} className="input" /></div>
                    </div>
                </div>

                <div>
                    <h2 className="font-semibold text-lg mb-4 pb-2 border-b">Notificaciones</h2>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.auto_assign_tickets} onChange={e => setSettings({ ...settings, auto_assign_tickets: e.target.checked })} className="rounded w-5 h-5" /><span>Asignar tickets automáticamente</span></label>
                        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.send_whatsapp_notifications} onChange={e => setSettings({ ...settings, send_whatsapp_notifications: e.target.checked })} className="rounded w-5 h-5" /><span>Enviar notificaciones por WhatsApp</span></label>
                        <label className="flex items-center gap-3"><input type="checkbox" checked={settings.send_email_notifications} onChange={e => setSettings({ ...settings, send_email_notifications: e.target.checked })} className="rounded w-5 h-5" /><span>Enviar notificaciones por Email</span></label>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button onClick={handleSave} className="btn-primary">
                        {saved ? <><CheckIcon className="w-5 h-5 mr-2" />Guardado</> : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>
    );
}
