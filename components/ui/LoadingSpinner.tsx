/**
 * Loading spinner component - unified loading indicator
 */

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div
                className={`animate-spin ${sizeClasses[size]} border-primary border-t-transparent rounded-full`}
            />
        </div>
    );
}

export function PageLoading() {
    return (
        <div className="flex justify-center py-12">
            <LoadingSpinner size="md" />
        </div>
    );
}
