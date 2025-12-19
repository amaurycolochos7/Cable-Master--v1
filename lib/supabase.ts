import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types para la base de datos
export type UserRole = 'master' | 'admin' | 'counter' | 'tech' | 'client';

export type Profile = {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    phone?: string;
    branch_id?: string;
    assigned_locations?: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type Location = {
    id: string;
    name: string;
    state: string;
    is_active: boolean;
    created_at: string;
};

export type ServicePackage = {
    id: string;
    name: string;
    type: 'internet' | 'tv' | 'combo';
    speed_mbps?: number;
    channels_count?: number;
    monthly_price: number;
    installation_fee: number;
    description?: string;
    features?: string[];
    locations?: string[];
    is_active: boolean;
    created_at: string;
};

export type Customer = {
    id: string;
    profile_id?: string;
    full_name: string;
    phone: string;
    alternate_phone?: string;
    email?: string;
    address: string;
    location: string;
    neighborhood?: string;
    references?: string;
    rfc?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
};

export type ServiceContract = {
    id: string;
    service_number: string;
    customer_id: string;
    package_id: string;
    promotion_id?: string;
    status: 'pending_installation' | 'active' | 'suspended' | 'cancelled';
    monthly_fee: number;
    installation_fee: number;
    payment_day: number;
    next_payment_date?: string;
    contract_pdf_url?: string;
    installed_modem?: string;
    installed_decoder?: string;
    installation_date?: string;
    cancellation_date?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
};

export type Payment = {
    id: string;
    contract_id: string;
    amount: number;
    payment_method: 'cash' | 'card' | 'transfer' | 'mercadopago';
    payment_type: 'monthly' | 'installation' | 'reconnection' | 'other';
    period_month?: number;
    period_year?: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    mercadopago_payment_id?: string;
    receipt_url?: string;
    paid_at?: string;
    processed_by?: string;
    notes?: string;
    created_at: string;
};

export type WorkOrder = {
    id: string;
    contract_id: string;
    type: 'installation' | 'maintenance' | 'repair' | 'reconnection' | 'disconnection';
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    assigned_to?: string;
    scheduled_date?: string;
    completed_date?: string;
    description?: string;
    resolution_notes?: string;
    photos?: string[];
    customer_signature?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
};

export type CoverageRequest = {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    address: string;
    location: string;
    coordinates_lat?: number;
    coordinates_lng?: number;
    service_interest?: string;
    status: 'pending' | 'contacted' | 'approved' | 'rejected';
    notes?: string;
    contacted_by?: string;
    contacted_at?: string;
    created_at: string;
};
