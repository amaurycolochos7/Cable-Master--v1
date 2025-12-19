-- ============================================
-- CABLE MASTER - MIGRACIÓN COMPLETA
-- ============================================
-- Ejecutar este script COMPLETO en el SQL Editor de Supabase
-- URL: https://supabase.com/dashboard > Tu proyecto > SQL Editor
-- 
-- ⚠️ IMPORTANTE: Ejecutar en ORDEN (el script ya está ordenado)
-- ============================================

-- ====================================
-- PARTE 1: EXTENSIONES Y FUNCIONES BASE
-- ====================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- PARTE 2: TABLAS BASE DEL SISTEMA
-- ====================================

-- TABLA: profiles (usuarios del sistema)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master', 'admin', 'counter', 'tech', 'client')),
  phone TEXT,
  branch_id UUID,
  assigned_locations TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: locations (localidades)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  state TEXT DEFAULT 'Chiapas',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO locations (name) VALUES 
  ('Teopisca'),
  ('Chiapa de Corzo'),
  ('Venustiano Carranza');

-- TABLA: branches (sucursales)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location_id UUID REFERENCES locations(id),
  address TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  schedule TEXT DEFAULT 'Lun-Vie: 9:00-18:00, Sáb: 9:00-14:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO branches (name, location_id, address, phone, whatsapp, latitude, longitude) 
VALUES (
  'Cable Master - Chiapa de Corzo',
  (SELECT id FROM locations WHERE name = 'Chiapa de Corzo'),
  'Centro, Chiapa de Corzo, Chiapas',
  '9612483470',
  '5219612483470',
  16.7059,
  -93.0095
);

-- TABLA: service_packages (paquetes)
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internet', 'tv', 'combo')),
  speed_mbps INTEGER,
  channels_count INTEGER,
  monthly_price DECIMAL(10, 2) NOT NULL,
  installation_fee DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  features TEXT[],
  locations TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO service_packages (name, type, speed_mbps, channels_count, monthly_price, installation_fee, description, features, locations) VALUES
  (
    'Paquete Verano 80 Megas',
    'combo',
    80,
    100,
    450.00,
    0.00,
    '80 MEGAS + 100 Canales - Promoción de Verano',
    ARRAY['80 MEGAS de velocidad', '+100 canales de TV', 'Contrato GRATIS', 'Primera mensualidad GRATIS', '100% FIBRA ÓPTICA'],
    ARRAY['Teopisca', 'Chiapa de Corzo', 'Venustiano Carranza']
  ),
  (
    'Internet 20 Megas',
    'internet',
    20,
    NULL,
    250.00,
    300.00,
    'Internet básico 20 Megas',
    ARRAY['20 MEGAS de velocidad', '100% FIBRA ÓPTICA', 'Sin límite de datos'],
    ARRAY['Teopisca', 'Chiapa de Corzo', 'Venustiano Carranza']
  ),
  (
    'TV Premium 150 Canales',
    'tv',
    NULL,
    150,
    350.00,
    200.00,
    'Televisión por cable premium',
    ARRAY['+150 canales', 'Canales HD', 'Programación variada'],
    ARRAY['Teopisca', 'Chiapa de Corzo']
  );

-- TABLA: promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'free_months', 'free_installation')),
  discount_value DECIMAL(10, 2),
  free_months INTEGER DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE,
  applicable_packages UUID[],
  applicable_locations TEXT[],
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO promotions (name, description, discount_type, free_months, valid_from, valid_until, applicable_locations, terms, is_active) VALUES
  (
    'Promoción Verano 2025',
    'Contrato gratis + Primera mensualidad gratis',
    'free_months',
    1,
    '2025-06-01',
    '2025-09-30',
    ARRAY['Chiapa de Corzo', 'Teopisca', 'Venustiano Carranza'],
    'Aplica para nuevas contrataciones. Incluye instalación gratuita y primer mes sin costo.',
    true
  );

-- TABLA: customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  address TEXT NOT NULL,
  location TEXT NOT NULL,
  neighborhood TEXT,
  reference_notes TEXT,
  rfc TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: service_contracts
CREATE TABLE service_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  package_id UUID REFERENCES service_packages(id) NOT NULL,
  promotion_id UUID REFERENCES promotions(id),
  status TEXT NOT NULL DEFAULT 'pending_installation' CHECK (status IN ('pending_installation', 'active', 'suspended', 'cancelled')),
  monthly_fee DECIMAL(10, 2) NOT NULL,
  installation_fee DECIMAL(10, 2) DEFAULT 0,
  payment_day INTEGER DEFAULT 1,
  next_payment_date DATE,
  contract_pdf_url TEXT,
  installed_modem TEXT,
  installed_decoder TEXT,
  installation_date DATE,
  cancellation_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para generar número de servicio
CREATE OR REPLACE FUNCTION generate_service_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  service_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(service_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM service_contracts
  WHERE service_number LIKE 'CM%';
  
  service_num := 'CM' || LPAD(next_number::TEXT, 6, '0');
  RETURN service_num;
END;
$$ LANGUAGE plpgsql;

-- TABLA: payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES service_contracts(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'mercadopago')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('monthly', 'installation', 'reconnection', 'other')),
  period_month INTEGER,
  period_year INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  mercadopago_payment_id TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: work_orders
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES service_contracts(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('installation', 'maintenance', 'repair', 'reconnection', 'disconnection')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id),
  scheduled_date DATE,
  completed_date DATE,
  description TEXT,
  resolution_notes TEXT,
  photos TEXT[],
  customer_signature TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: incidents
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES service_contracts(id),
  type TEXT NOT NULL CHECK (type IN ('no_signal', 'slow_speed', 'equipment_failure', 'cable_damage', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  description TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  assigned_to UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: coverage_requests
CREATE TABLE coverage_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  location TEXT NOT NULL,
  coordinates_lat DECIMAL(10, 8),
  coordinates_lng DECIMAL(11, 8),
  service_interest TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  notes TEXT,
  contacted_by UUID REFERENCES profiles(id),
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: system_settings
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, description) VALUES
  ('company_name', '"Cable Master"', 'Nombre de la empresa'),
  ('company_slogan', '"La Mejor Programación"', 'Slogan de la empresa'),
  ('primary_color', '"#E31E24"', 'Color primario (rojo)'),
  ('secondary_color', '"#1E3C96"', 'Color secundario (azul)'),
  ('late_payment_days', '5', 'Días de gracia antes de suspensión'),
  ('default_payment_day', '1', 'Día default de pago mensual');

-- ====================================
-- PARTE 3: MÓDULO DE TICKETS
-- ====================================

CREATE TYPE ticket_type AS ENUM ('contract', 'fault');

CREATE TYPE contract_status AS ENUM (
    'NEW', 'VALIDATION', 'CONTACTED', 'SCHEDULED', 'IN_ROUTE', 
    'INSTALLED', 'CANCELLED', 'OUT_OF_COVERAGE', 'DUPLICATE'
);

CREATE TYPE fault_status AS ENUM (
    'NEW', 'DIAGNOSIS', 'SCHEDULED', 'IN_PROGRESS', 
    'RESOLVED', 'CLOSED', 'NOT_APPLICABLE'
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio TEXT UNIQUE NOT NULL,
    type ticket_type NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone_last4 TEXT GENERATED ALWAYS AS (RIGHT(phone, 4)) STORED,
    email TEXT,
    address TEXT NOT NULL,
    postal_code TEXT,
    community TEXT,
    municipality TEXT,
    state TEXT DEFAULT 'Chiapas',
    references_text TEXT,
    package_id UUID REFERENCES service_packages(id),
    promotion_id UUID REFERENCES promotions(id),
    preferred_schedule TEXT,
    service_number TEXT,
    fault_description TEXT,
    contract_status contract_status DEFAULT 'NEW',
    fault_status fault_status DEFAULT 'NEW',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ,
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    public_note TEXT,
    source TEXT DEFAULT 'web' CHECK (source IN ('web', 'phone', 'whatsapp', 'branch', 'admin')),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

CREATE INDEX idx_tickets_folio ON tickets(folio);
CREATE INDEX idx_tickets_phone_last4 ON tickets(phone_last4);
CREATE INDEX idx_tickets_type ON tickets(type);
CREATE INDEX idx_tickets_contract_status ON tickets(contract_status) WHERE type = 'contract';
CREATE INDEX idx_tickets_fault_status ON tickets(fault_status) WHERE type = 'fault';
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- Función para generar folio automático
CREATE OR REPLACE FUNCTION generate_ticket_folio()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    year_str TEXT;
    next_num INTEGER;
    new_folio TEXT;
BEGIN
    IF NEW.type = 'contract' THEN
        prefix := 'CON';
    ELSE
        prefix := 'FAL';
    END IF;
    
    year_str := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(folio, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM tickets
    WHERE folio LIKE prefix || '-' || year_str || '-%';
    
    new_folio := prefix || '-' || year_str || '-' || LPAD(next_num::TEXT, 6, '0');
    NEW.folio := new_folio;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_folio
    BEFORE INSERT ON tickets
    FOR EACH ROW
    WHEN (NEW.folio IS NULL)
    EXECUTE FUNCTION generate_ticket_folio();

-- Historial de estados
CREATE TABLE ticket_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_status_history_ticket ON ticket_status_history(ticket_id);

-- Eventos del ticket
CREATE TYPE ticket_event_type AS ENUM (
    'note_internal', 'note_public', 'scheduled', 'rescheduled', 
    'assigned', 'attachment', 'call_attempt', 'call_success', 
    'whatsapp_sent', 'status_change'
);

CREATE TABLE ticket_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    event_type ticket_event_type NOT NULL,
    title TEXT,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    attachment_url TEXT,
    is_visible_to_customer BOOLEAN DEFAULT false,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_events_ticket ON ticket_events(ticket_id);
CREATE INDEX idx_ticket_events_type ON ticket_events(event_type);

-- ====================================
-- PARTE 4: MÓDULO DE COBERTURA
-- ====================================

CREATE TYPE coverage_status AS ENUM (
    'available', 'partial', 'coming_soon', 'not_available'
);

CREATE TABLE municipalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    state TEXT DEFAULT 'Chiapas',
    coverage_status coverage_status DEFAULT 'not_available',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE postal_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE,
    coverage_status coverage_status DEFAULT 'not_available',
    available_packages UUID[],
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_postal_codes_code ON postal_codes(code);
CREATE INDEX idx_postal_codes_municipality ON postal_codes(municipality_id);

CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    postal_code_id UUID REFERENCES postal_codes(id) ON DELETE CASCADE,
    coverage_status coverage_status DEFAULT 'not_available',
    estimated_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, postal_code_id)
);

CREATE INDEX idx_communities_postal_code ON communities(postal_code_id);

CREATE TABLE sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    coverage_status coverage_status DEFAULT 'not_available',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, community_id)
);

CREATE INDEX idx_sectors_community ON sectors(community_id);

-- Datos de cobertura iniciales
INSERT INTO municipalities (name, state, coverage_status) VALUES
('Chiapa de Corzo', 'Chiapas', 'available'),
('Teopisca', 'Chiapas', 'available'),
('Venustiano Carranza', 'Chiapas', 'partial'),
('San Cristóbal de las Casas', 'Chiapas', 'coming_soon'),
('Tuxtla Gutiérrez', 'Chiapas', 'not_available');

INSERT INTO postal_codes (code, municipality_id, coverage_status) VALUES
('29160', (SELECT id FROM municipalities WHERE name = 'Chiapa de Corzo'), 'available'),
('29161', (SELECT id FROM municipalities WHERE name = 'Chiapa de Corzo'), 'available'),
('30570', (SELECT id FROM municipalities WHERE name = 'Teopisca'), 'available'),
('30140', (SELECT id FROM municipalities WHERE name = 'Venustiano Carranza'), 'partial');

INSERT INTO communities (name, postal_code_id, coverage_status) VALUES
('Centro', (SELECT id FROM postal_codes WHERE code = '29160'), 'available'),
('La Pila', (SELECT id FROM postal_codes WHERE code = '29160'), 'available'),
('Ribera Cahuaré', (SELECT id FROM postal_codes WHERE code = '29161'), 'partial'),
('Centro', (SELECT id FROM postal_codes WHERE code = '30570'), 'available'),
('Barrio San Sebastián', (SELECT id FROM postal_codes WHERE code = '30570'), 'available');

-- ====================================
-- PARTE 5: CMS PAGE BUILDER
-- ====================================

CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meta_title TEXT,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    template TEXT DEFAULT 'default',
    created_by UUID REFERENCES profiles(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_published ON pages(is_published);

CREATE TYPE block_type AS ENUM (
    'hero', 'text', 'image', 'gallery', 'cards', 'pricing', 
    'testimonials', 'faq', 'cta', 'form', 'video', 'map', 
    'stats', 'team', 'timeline', 'tabs', 'accordion', 'spacer', 
    'divider', 'html_embed', 'packages_grid', 'coverage_checker', 'contact_form'
);

CREATE TABLE page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    block_type block_type NOT NULL,
    title TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    config JSONB NOT NULL DEFAULT '{}',
    content JSONB NOT NULL DEFAULT '{}',
    styles JSONB DEFAULT '{}',
    is_visible BOOLEAN DEFAULT true,
    visible_from TIMESTAMPTZ,
    visible_until TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_blocks_page ON page_blocks(page_id);
CREATE INDEX idx_page_blocks_order ON page_blocks(page_id, sort_order);

CREATE TABLE block_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    block_type block_type NOT NULL,
    preview_image TEXT,
    default_config JSONB NOT NULL DEFAULT '{}',
    default_content JSONB NOT NULL DEFAULT '{}',
    default_styles JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    folder TEXT DEFAULT 'general',
    metadata JSONB DEFAULT '{}',
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assets_folder ON assets(folder);
CREATE INDEX idx_assets_mime ON assets(mime_type);

-- ====================================
-- PARTE 6: FAQ
-- ====================================

CREATE TABLE faq_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE faq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES faq_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_faq_items_category ON faq_items(category_id);
CREATE INDEX idx_faq_items_featured ON faq_items(is_featured) WHERE is_featured = true;

INSERT INTO faq_categories (name, slug, icon, sort_order) VALUES
('Internet', 'internet', '🌐', 1),
('Televisión', 'television', '📺', 2),
('Pagos', 'pagos', '💳', 3),
('Instalación', 'instalacion', '🔧', 4),
('Soporte Técnico', 'soporte', '🛠️', 5);

INSERT INTO faq_items (category_id, question, answer, sort_order, is_featured) VALUES
((SELECT id FROM faq_categories WHERE slug = 'internet'),
'¿Cuál es la velocidad real del servicio?',
'Nuestro servicio es 100% fibra óptica, lo que garantiza velocidades simétricas. La velocidad contratada es la velocidad real.',
1, true),
((SELECT id FROM faq_categories WHERE slug = 'internet'),
'¿Tienen límite de datos?',
'No, todos nuestros planes son ilimitados. No tenemos políticas de uso justo.',
2, true),
((SELECT id FROM faq_categories WHERE slug = 'pagos'),
'¿Cuándo debo pagar mi mensualidad?',
'Tu fecha de pago es el día de cada mes que corresponda a tu fecha de instalación. Tienes 5 días de gracia.',
1, false),
((SELECT id FROM faq_categories WHERE slug = 'instalacion'),
'¿Cuánto tiempo tarda la instalación?',
'La instalación típicamente toma entre 1 a 2 horas dependiendo de las condiciones de tu hogar.',
1, false);

-- ====================================
-- PARTE 7: BANNERS
-- ====================================

CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'hero' CHECK (type IN ('hero', 'popup', 'bar', 'sidebar')),
    title TEXT,
    subtitle TEXT,
    description TEXT,
    image_url TEXT,
    image_mobile_url TEXT,
    cta_text TEXT,
    cta_url TEXT,
    background_color TEXT,
    text_color TEXT,
    position TEXT DEFAULT 'home',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    show_from TIMESTAMPTZ,
    show_until TIMESTAMPTZ,
    locations TEXT[],
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON banners(is_active, show_from, show_until);
CREATE INDEX idx_banners_position ON banners(position);

-- ====================================
-- PARTE 8: AUDITORÍA
-- ====================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, new_values)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, old_values, new_values)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, entity_type, entity_id, old_values)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_tickets AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_pages AFTER INSERT OR UPDATE OR DELETE ON pages
    FOR EACH ROW EXECUTE FUNCTION log_audit();
CREATE TRIGGER audit_page_blocks AFTER INSERT OR UPDATE OR DELETE ON page_blocks
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ====================================
-- PARTE 9: PLANTILLAS DE MENSAJES
-- ====================================

CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
    subject TEXT,
    body TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO message_templates (name, channel, body, variables) VALUES
('ticket_created_whatsapp', 'whatsapp', 
'¡Hola {{nombre}}! 👋

Tu solicitud ha sido recibida con el folio: *{{folio}}*

📋 Tipo: {{tipo}}
📍 Dirección: {{direccion}}

Puedes dar seguimiento a tu solicitud en:
{{url_seguimiento}}

¡Gracias por preferir Cable Master! 🚀',
ARRAY['nombre', 'folio', 'tipo', 'direccion', 'url_seguimiento']),

('ticket_scheduled_whatsapp', 'whatsapp',
'¡Hola {{nombre}}! 📅

Tu cita ha sido programada:

📋 Folio: *{{folio}}*
📅 Fecha: {{fecha}}
🕐 Horario: {{horario}}

Nuestro técnico {{tecnico}} te visitará.

Cable Master - La Mejor Programación 📡',
ARRAY['nombre', 'folio', 'fecha', 'horario', 'tecnico']);

-- Páginas del sistema
INSERT INTO pages (slug, title, description, is_published, is_system) VALUES
('home', 'Inicio', 'Página principal de Cable Master', true, true),
('planes', 'Planes y Precios', 'Conoce nuestros paquetes de Internet y TV', true, true),
('cobertura', 'Cobertura', 'Verifica si tenemos cobertura en tu zona', true, true),
('contacto', 'Contacto', 'Contáctanos', true, true);

-- ====================================
-- PARTE 10: RLS (Row Level Security)
-- ====================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Función helper para verificar staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE(
        (SELECT EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master', 'tech', 'counter')
        )),
        false
    );
$$;

-- Políticas públicas (lectura sin autenticación)
CREATE POLICY "Public read packages" ON service_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Public read promotions" ON promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read locations" ON locations FOR SELECT USING (is_active = true);
CREATE POLICY "Public read published pages" ON pages FOR SELECT USING (is_published = true);
CREATE POLICY "Public read visible blocks" ON page_blocks
    FOR SELECT USING (
        is_visible = true 
        AND (visible_from IS NULL OR visible_from <= NOW())
        AND (visible_until IS NULL OR visible_until >= NOW())
    );
CREATE POLICY "Public read active FAQ categories" ON faq_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active FAQ" ON faq_items FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active banners" ON banners
    FOR SELECT USING (
        is_active = true
        AND (show_from IS NULL OR show_from <= NOW())
        AND (show_until IS NULL OR show_until >= NOW())
    );
CREATE POLICY "Public read active coverage" ON municipalities FOR SELECT USING (is_active = true);
CREATE POLICY "Public read postal codes" ON postal_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Public read communities" ON communities FOR SELECT USING (is_active = true);
CREATE POLICY "Public read sectors" ON sectors FOR SELECT USING (is_active = true);

-- Políticas para tickets (público puede crear)
CREATE POLICY "public_create_tickets" ON tickets
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff_view_tickets" ON tickets
    FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "staff_update_tickets" ON tickets
    FOR UPDATE TO authenticated USING (is_staff());

CREATE POLICY "public_insert_status_history" ON ticket_status_history
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff_view_status_history" ON ticket_status_history
    FOR SELECT TO authenticated USING (is_staff());

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can view all profiles" ON profiles
    FOR SELECT USING (is_staff());
CREATE POLICY "Staff can insert profiles" ON profiles
    FOR INSERT WITH CHECK (is_staff());

-- Políticas para customers
CREATE POLICY "Clients can view own customer data" ON customers
    FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Staff can view all customers" ON customers
    FOR SELECT USING (is_staff());
CREATE POLICY "Staff can insert customers" ON customers
    FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "Staff can update customers" ON customers
    FOR UPDATE USING (is_staff());

-- Políticas para contracts
CREATE POLICY "Clients can view own contracts" ON service_contracts
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
    );
CREATE POLICY "Staff can view all contracts" ON service_contracts
    FOR SELECT USING (is_staff());
CREATE POLICY "Staff can manage contracts" ON service_contracts
    FOR ALL USING (is_staff());

-- Políticas para payments
CREATE POLICY "Clients can view own payments" ON payments
    FOR SELECT USING (
        contract_id IN (
            SELECT id FROM service_contracts 
            WHERE customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
        )
    );
CREATE POLICY "Staff can view all payments" ON payments
    FOR SELECT USING (is_staff());
CREATE POLICY "Staff can manage payments" ON payments
    FOR ALL USING (is_staff());

-- Políticas para work_orders, incidents, coverage_requests
CREATE POLICY "Staff can manage work_orders" ON work_orders FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage incidents" ON incidents FOR ALL USING (is_staff());
CREATE POLICY "Public can create coverage_requests" ON coverage_requests
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff can view coverage_requests" ON coverage_requests
    FOR SELECT USING (is_staff());

-- Políticas para auditoría
CREATE POLICY "Admin can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master')
    );

-- Políticas para gestión de contenido (admin)
CREATE POLICY "Staff can manage pages" ON pages FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage blocks" ON page_blocks FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage banners" ON banners FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage FAQ categories" ON faq_categories FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage FAQ items" ON faq_items FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage packages" ON service_packages FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage promotions" ON promotions FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage municipalities" ON municipalities FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage postal_codes" ON postal_codes FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage communities" ON communities FOR ALL USING (is_staff());
CREATE POLICY "Staff can manage sectors" ON sectors FOR ALL USING (is_staff());

-- ====================================
-- PARTE 11: TRIGGERS DE UPDATED_AT
-- ====================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON service_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_municipalities_updated_at BEFORE UPDATE ON municipalities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_postal_codes_updated_at BEFORE UPDATE ON postal_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_page_blocks_updated_at BEFORE UPDATE ON page_blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faq_items_updated_at BEFORE UPDATE ON faq_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- PARTE 12: STORAGE BUCKETS
-- ====================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('receipts', 'receipts', true),
  ('contracts', 'contracts', true),
  ('work-orders', 'work-orders', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public access to receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');
CREATE POLICY "Staff can upload receipts" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Public access to contracts" ON storage.objects FOR SELECT
  USING (bucket_id = 'contracts');
CREATE POLICY "Staff can upload contracts" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');

-- ============================================
-- ✅ FIN DE LA MIGRACIÓN
-- ============================================
-- Después de ejecutar:
-- 1. Crear un usuario admin en Authentication > Users
-- 2. Insertar el perfil admin manualmente:
--    INSERT INTO profiles (id, email, full_name, role)
--    VALUES ('[el-uuid-del-usuario]', 'tu@email.com', 'Tu Nombre', 'master');
-- ============================================
