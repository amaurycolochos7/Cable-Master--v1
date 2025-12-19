'use client';

// Force dynamic rendering for all admin pages to avoid SSR issues with context hooks
export const dynamic = 'force-dynamic';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
    HomeIcon,
    TicketIcon,
    ExclamationTriangleIcon,
    MapPinIcon,
    CubeIcon,
    MegaphoneIcon,
    QuestionMarkCircleIcon,
    DocumentTextIcon,
    Squares2X2Icon,
    UsersIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    SunIcon,
    MoonIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    {
        name: 'Tickets Contratación',
        href: '/admin/tickets/contratacion',
        icon: TicketIcon,
    },
    {
        name: 'Tickets Fallas',
        href: '/admin/tickets/fallas',
        icon: ExclamationTriangleIcon,
    },
    { name: 'Solicitudes Cobertura', href: '/admin/cobertura', icon: MapPinIcon },
    { name: 'Zonas Cobertura', href: '/admin/zonas', icon: MapPinIcon },
    { name: 'Planes', href: '/admin/planes', icon: CubeIcon },
    { name: 'Promociones', href: '/admin/promociones', icon: MegaphoneIcon },
    { name: 'FAQ', href: '/admin/faq', icon: QuestionMarkCircleIcon },
    {
        name: 'CMS',
        href: '/admin/cms',
        icon: DocumentTextIcon,
        children: [
            { name: 'Páginas', href: '/admin/cms/paginas' },
            { name: 'Bloques', href: '/admin/cms/bloques' },
            { name: 'Media', href: '/admin/cms/media' },
        ]
    },
    { name: 'Usuarios', href: '/admin/usuarios', icon: UsersIcon },
    { name: 'Reportes', href: '/admin/reportes', icon: ChartBarIcon },
    { name: 'Auditoría', href: '/admin/auditoria', icon: ClipboardDocumentListIcon },
    { name: 'Configuración', href: '/admin/configuracion', icon: Cog6ToothIcon },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, signOut, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    // Protect admin routes
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!profile || !['master', 'admin'].includes(profile.role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="card text-center max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Acceso Denegado</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">No tienes permisos para acceder a esta sección.</p>
                    <Link href="/login" className="btn-primary">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    const isActive = (href: string) => {
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <div className="admin-panel min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors duration-300">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-900 dark:bg-gray-950">
                {/* Logo */}
                <div className="flex items-center h-16 px-6 bg-gray-950 dark:bg-black">
                    <Link href="/admin" className="flex items-center space-x-3">
                        <div className="text-2xl font-bold">
                            <span className="text-primary">C</span>
                            <span className="text-secondary">M</span>
                        </div>
                        <span className="text-white font-semibold">Admin</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <div key={item.name}>
                            {item.children ? (
                                // Menu with children
                                <div>
                                    <button
                                        onClick={() => setExpandedMenu(expandedMenu === item.name ? null : item.name)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-primary text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            {item.name}
                                        </div>
                                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedMenu === item.name ? 'rotate-180' : ''
                                            }`} />
                                    </button>
                                    <AnimatePresence>
                                        {expandedMenu === item.name && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-11 py-2 space-y-1">
                                                    {item.children.map((child) => (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            className={`block px-3 py-2 rounded-lg text-sm ${isActive(child.href)
                                                                ? 'bg-gray-800 text-white'
                                                                : 'text-gray-400 hover:text-white'
                                                                }`}
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                // Simple menu item
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'bg-primary text-white'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                    {item.badge && (
                                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User */}
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                                {profile.full_name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {profile.full_name}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">
                                {profile.role}
                            </p>
                        </div>
                        <button
                            onClick={signOut}
                            className="text-gray-400 hover:text-white p-1"
                            title="Cerrar sesión"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed inset-y-0 left-0 w-72 bg-gray-900 z-50 lg:hidden"
                        >
                            <div className="flex items-center justify-between h-16 px-6 bg-gray-950">
                                <span className="text-white font-semibold">Cable Master Admin</span>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>
                            <nav className="px-4 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-primary text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="lg:pl-64 flex flex-col flex-1">
                {/* Top bar */}
                <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 h-16 flex items-center px-4 lg:px-8 transition-colors duration-300">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4"
                    >
                        <Bars3Icon className="w-6 h-6" />
                    </button>

                    <div className="flex-1" />

                    {/* Quick actions */}
                    <div className="flex items-center gap-4">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                        >
                            {theme === 'dark' ? (
                                <SunIcon className="w-5 h-5" />
                            ) : (
                                <MoonIcon className="w-5 h-5" />
                            )}
                        </button>

                        <Link
                            href="/public"
                            target="_blank"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary"
                        >
                            Ver Sitio →
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

