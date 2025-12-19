'use client';

import React from 'react';
import { UsersIcon, PlusIcon, PencilIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useUsers } from '@/hooks';
import { ROLE_LABELS } from '@/types';
import { PageLoading, Modal, ModalActions, DataTable, Badge } from '@/components/ui';
import type { User, UserRole } from '@/types';

// Force dynamic rendering to avoid SSR issues with hooks
export const dynamic = 'force-dynamic';

export default function UsuariosPage() {
    const {
        users,
        loading,
        showModal,
        editItem,
        form,
        openCreate,
        openEdit,
        closeModal,
        setForm,
        handleSave,
        toggleActive,
    } = useUsers();

    const [roleFilter, setRoleFilter] = React.useState('');
    const filteredUsers = roleFilter ? users.filter(u => u.role === roleFilter) : users;

    if (loading) return <PageLoading />;

    const columns = [
        {
            key: 'user',
            header: 'Usuario',
            render: (u: User) => (
                <div>
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Rol',
            render: (u: User) => (
                <span className={`badge ${ROLE_LABELS[u.role]?.color}`}>
                    {ROLE_LABELS[u.role]?.label}
                </span>
            ),
        },
        {
            key: 'phone',
            header: 'Teléfono',
            render: (u: User) => <span className="text-sm">{u.phone || '-'}</span>,
        },
        {
            key: 'status',
            header: 'Estado',
            render: (u: User) => (
                <Badge variant={u.is_active ? 'success' : 'default'}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            render: (u: User) => (
                <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-2 hover:bg-gray-100 rounded">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleActive(u)} className="p-2 hover:bg-gray-100 rounded">
                        <ShieldCheckIcon className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <UsersIcon className="w-7 h-7 text-blue-500" />
                    Usuarios del Sistema
                </h1>
                <button onClick={openCreate} className="btn-primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Role filters */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setRoleFilter('')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${!roleFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}
                >
                    Todos ({users.length})
                </button>
                {Object.entries(ROLE_LABELS).map(([role, { label }]) => (
                    <button
                        key={role}
                        onClick={() => setRoleFilter(role)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${roleFilter === role ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}
                    >
                        {label} ({users.filter(u => u.role === role).length})
                    </button>
                ))}
            </div>

            {/* Users table */}
            <DataTable
                columns={columns}
                data={filteredUsers}
                keyExtractor={(u) => u.id}
                rowClassName={(u) => (!u.is_active ? 'opacity-50' : '')}
                emptyMessage="No hay usuarios registrados"
            />

            {/* User form modal */}
            <Modal isOpen={showModal} onClose={closeModal} title={editItem ? 'Editar Usuario' : 'Nuevo Usuario'}>
                <div className="space-y-4">
                    {!editItem && (
                        <>
                            <input
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="Email"
                                type="email"
                                className="input"
                            />
                            <input
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                placeholder="Contraseña"
                                type="password"
                                className="input"
                            />
                        </>
                    )}
                    <input
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        placeholder="Nombre completo"
                        className="input"
                    />
                    <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                        className="input"
                    >
                        {Object.entries(ROLE_LABELS).map(([role, { label }]) => (
                            <option key={role} value={role}>{label}</option>
                        ))}
                    </select>
                    <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Teléfono"
                        className="input"
                    />
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                            className="rounded"
                        />
                        Activo
                    </label>
                </div>
                <ModalActions onCancel={closeModal} onConfirm={handleSave} />
            </Modal>
        </div>
    );
}
