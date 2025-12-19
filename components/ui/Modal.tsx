'use client';

/**
 * Modal component with Framer Motion animation
 */

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white dark:bg-gray-800 rounded-xl ${maxWidthClasses[maxWidth]} w-full p-6`}
            >
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    {title}
                </h3>
                {children}
            </motion.div>
        </div>
    );
}

interface ModalActionsProps {
    onCancel: () => void;
    onConfirm: () => void;
    cancelText?: string;
    confirmText?: string;
    loading?: boolean;
}

export function ModalActions({
    onCancel,
    onConfirm,
    cancelText = 'Cancelar',
    confirmText = 'Guardar',
    loading = false,
}: ModalActionsProps) {
    return (
        <div className="flex gap-3 mt-6">
            <button onClick={onCancel} className="btn-outline flex-1" disabled={loading}>
                {cancelText}
            </button>
            <button onClick={onConfirm} className="btn-primary flex-1" disabled={loading}>
                {loading ? 'Guardando...' : confirmText}
            </button>
        </div>
    );
}
