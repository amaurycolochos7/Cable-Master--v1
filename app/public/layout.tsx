'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TopBanner from '@/components/TopBanner';

// Lazy load non-critical components that appear after initial render
const PromoPopup = dynamic(() => import('@/components/PromoPopup'), {
    ssr: false, // Client-only, shows after 2 seconds
});

const SidebarBanner = dynamic(() => import('@/components/SidebarBanner'), {
    ssr: false, // Client-only, non-critical
});

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            <TopBanner />
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
            <PromoPopup />
            <SidebarBanner />
        </div>
    );
}
