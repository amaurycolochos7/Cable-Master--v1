import { Suspense } from 'react';
import ContratarClient from './ContratarClient';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

// Loading component for Suspense fallback
function ContratarLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Cargando...</p>
            </div>
        </div>
    );
}

// Server Component page that wraps client component with Suspense
export default function ContratarPage() {
    return (
        <Suspense fallback={<ContratarLoading />}>
            <ContratarClient />
        </Suspense>
    );
}
