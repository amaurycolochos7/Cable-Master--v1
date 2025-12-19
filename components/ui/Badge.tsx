/**
 * Badge component for status/role indicators
 */

import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
        >
            {children}
        </span>
    );
}

// Convenience components for common badge types
export function SuccessBadge({ children }: { children: ReactNode }) {
    return <Badge variant="success">{children}</Badge>;
}

export function WarningBadge({ children }: { children: ReactNode }) {
    return <Badge variant="warning">{children}</Badge>;
}

export function DangerBadge({ children }: { children: ReactNode }) {
    return <Badge variant="danger">{children}</Badge>;
}

export function InfoBadge({ children }: { children: ReactNode }) {
    return <Badge variant="info">{children}</Badge>;
}
