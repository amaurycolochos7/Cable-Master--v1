import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TopBanner from '@/components/TopBanner';
import PromoPopup from '@/components/PromoPopup';
import SidebarBanner from '@/components/SidebarBanner';

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
