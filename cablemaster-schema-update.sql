-- ====================================
-- CABLEMASTER MVP - SCHEMA UPDATE
-- Ejecutar en Supabase SQL Editor después del schema base
-- ====================================

-- ====================================
-- MÓDULO: TICKETS (Contratación y Fallas)
-- ====================================

-- Tipo de ticket
CREATE TYPE ticket_type AS ENUM ('contract', 'fault');

-- Estados para CONTRATACIÓN
CREATE TYPE contract_status AS ENUM (
    'NEW',           -- Nuevo, sin procesar
    'VALIDATION',    -- En validación de datos/cobertura
    'CONTACTED',     -- Cliente contactado
    'SCHEDULED',     -- Instalación agendada
    'IN_ROUTE',      -- Técnico en camino
    'INSTALLED',     -- Instalado exitosamente
    'CANCELLED',     -- Cancelado por cliente
    'OUT_OF_COVERAGE', -- Fuera de cobertura
    'DUPLICATE'      -- Duplicado
);

-- Estados para FALLAS
CREATE TYPE fault_status AS ENUM (
    'NEW',           -- Nuevo reporte
    'DIAGNOSIS',     -- En diagnóstico
    'SCHEDULED',     -- Visita agendada
    'IN_PROGRESS',   -- En reparación
    'RESOLVED',      -- Resuelto
    'CLOSED',        -- Cerrado
    'NOT_APPLICABLE' -- No aplica / No era falla
);

-- Tabla principal de tickets
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio TEXT UNIQUE NOT NULL,
    type ticket_type NOT NULL,
    
    -- Datos del solicitante
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone_last4 TEXT GENERATED ALWAYS AS (RIGHT(phone, 4)) STORED,
    email TEXT,
    
    -- Ubicación
    address TEXT NOT NULL,
    postal_code TEXT,
    community TEXT,
    municipality TEXT,
    state TEXT DEFAULT 'Chiapas',
    references_text TEXT,
    
    -- Datos de contratación (solo type='contract')
    package_id UUID REFERENCES service_packages(id),
    promotion_id UUID REFERENCES promotions(id),
    preferred_schedule TEXT,
    
    -- Datos de falla (solo type='fault')
    service_number TEXT, -- Número de contrato existente
    fault_description TEXT,
    
    -- Estado y seguimiento
    contract_status contract_status DEFAULT 'NEW',
    fault_status fault_status DEFAULT 'NEW',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Asignación
    assigned_to UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ,
    
    -- Agenda
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    
    -- Nota pública (visible en tracking)
    public_note TEXT,
    
    -- Metadata
    source TEXT DEFAULT 'web' CHECK (source IN ('web', 'phone', 'whatsapp', 'branch', 'admin')),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- Índices para tickets
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
    -- Determinar prefijo según tipo
    IF NEW.type = 'contract' THEN
        prefix := 'CON';
    ELSE
        prefix := 'FAL';
    END IF;
    
    year_str := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Obtener siguiente número para este tipo y año
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

-- Eventos del ticket (notas, agenda, etc.)
CREATE TYPE ticket_event_type AS ENUM (
    'note_internal',    -- Nota interna (solo staff)
    'note_public',      -- Nota pública (visible en tracking)
    'scheduled',        -- Agendado
    'rescheduled',      -- Reagendado
    'assigned',         -- Asignado a responsable
    'attachment',       -- Adjunto agregado
    'call_attempt',     -- Intento de llamada
    'call_success',     -- Llamada exitosa
    'whatsapp_sent',    -- WhatsApp enviado
    'status_change'     -- Cambio de estado
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
-- MÓDULO: COBERTURA JERÁRQUICA
-- ====================================

-- Estados de cobertura
CREATE TYPE coverage_status AS ENUM (
    'available',      -- Disponible
    'partial',        -- Parcial
    'coming_soon',    -- Próximamente
    'not_available'   -- No disponible
);

-- Municipios
CREATE TABLE municipalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    state TEXT DEFAULT 'Chiapas',
    coverage_status coverage_status DEFAULT 'not_available',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Códigos postales
CREATE TABLE postal_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    municipality_id UUID REFERENCES municipalities(id) ON DELETE CASCADE,
    coverage_status coverage_status DEFAULT 'not_available',
    available_packages UUID[], -- IDs de paquetes disponibles
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_postal_codes_code ON postal_codes(code);
CREATE INDEX idx_postal_codes_municipality ON postal_codes(municipality_id);

-- Comunidades/Colonias
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    postal_code_id UUID REFERENCES postal_codes(id) ON DELETE CASCADE,
    coverage_status coverage_status DEFAULT 'not_available',
    estimated_date DATE, -- Para "próximamente"
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, postal_code_id)
);

CREATE INDEX idx_communities_postal_code ON communities(postal_code_id);

-- Sectores (subdivisión opcional de comunidades)
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

-- ====================================
-- MÓDULO: CMS PAGE BUILDER
-- ====================================

-- Páginas del sitio
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meta_title TEXT,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false, -- Páginas del sistema (no eliminables)
    template TEXT DEFAULT 'default',
    created_by UUID REFERENCES profiles(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_published ON pages(is_published);

-- Tipos de bloques disponibles
CREATE TYPE block_type AS ENUM (
    'hero',           -- Banner principal con imagen/video
    'text',           -- Texto enriquecido
    'image',          -- Imagen con caption
    'gallery',        -- Galería de imágenes
    'cards',          -- Tarjetas (servicios, features)
    'pricing',        -- Tabla de precios
    'testimonials',   -- Testimonios
    'faq',            -- Preguntas frecuentes
    'cta',            -- Call to action
    'form',           -- Formulario embebido
    'video',          -- Video embebido
    'map',            -- Mapa de ubicación
    'stats',          -- Estadísticas/números
    'team',           -- Equipo
    'timeline',       -- Línea de tiempo
    'tabs',           -- Contenido en pestañas
    'accordion',      -- Acordeón
    'spacer',         -- Espaciador
    'divider',        -- Divisor
    'html_embed',     -- HTML personalizado
    'packages_grid',  -- Grid de paquetes dinámico
    'coverage_checker', -- Verificador de cobertura
    'contact_form'    -- Formulario de contacto
);

-- Bloques de contenido
CREATE TABLE page_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
    block_type block_type NOT NULL,
    title TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Configuración del bloque (JSON flexible)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Contenido del bloque
    content JSONB NOT NULL DEFAULT '{}',
    
    -- Estilos personalizados
    styles JSONB DEFAULT '{}',
    
    -- Visibilidad
    is_visible BOOLEAN DEFAULT true,
    visible_from TIMESTAMPTZ,
    visible_until TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_blocks_page ON page_blocks(page_id);
CREATE INDEX idx_page_blocks_order ON page_blocks(page_id, sort_order);

-- Plantillas de bloques predefinidos
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

-- Assets/Media library
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
-- MÓDULO: FAQ
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

-- ====================================
-- MÓDULO: BANNERS/PROMOCIONES PROGRAMADAS
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
    locations TEXT[], -- Localidades donde mostrar
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_banners_active ON banners(is_active, show_from, show_until);
CREATE INDEX idx_banners_position ON banners(position);

-- ====================================
-- MÓDULO: AUDITORÍA
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

-- Función para auditar cambios
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

-- Aplicar auditoría a tablas críticas
CREATE TRIGGER audit_tickets AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_pages AFTER INSERT OR UPDATE OR DELETE ON pages
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_page_blocks AFTER INSERT OR UPDATE OR DELETE ON page_blocks
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ====================================
-- MÓDULO: PLANTILLAS DE MENSAJES
-- ====================================

CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
    subject TEXT, -- Solo para email
    body TEXT NOT NULL,
    variables TEXT[], -- Variables disponibles como {{nombre}}, {{folio}}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plantillas iniciales
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

Si necesitas reagendar, contáctanos.

Cable Master - La Mejor Programación 📡',
ARRAY['nombre', 'folio', 'fecha', 'horario', 'tecnico']);

-- ====================================
-- RLS POLICIES PARA NUEVAS TABLAS
-- ====================================

-- Habilitar RLS
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
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (lectura)
CREATE POLICY "Public can read published pages" ON pages
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read visible blocks" ON page_blocks
    FOR SELECT USING (
        is_visible = true 
        AND (visible_from IS NULL OR visible_from <= NOW())
        AND (visible_until IS NULL OR visible_until >= NOW())
    );

CREATE POLICY "Public can read active FAQ" ON faq_items
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read active banners" ON banners
    FOR SELECT USING (
        is_active = true
        AND (show_from IS NULL OR show_from <= NOW())
        AND (show_until IS NULL OR show_until >= NOW())
    );

CREATE POLICY "Public can read active coverage" ON municipalities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read postal codes" ON postal_codes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read communities" ON communities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read sectors" ON sectors
    FOR SELECT USING (is_active = true);

-- Políticas para inserción de tickets (público puede crear)
CREATE POLICY "Anyone can create tickets" ON tickets
    FOR INSERT WITH CHECK (true);

-- Políticas de staff (lectura completa)
CREATE POLICY "Staff can read all tickets" ON tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('master', 'admin', 'counter', 'tech')
        )
    );

CREATE POLICY "Staff can update tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('master', 'admin', 'counter', 'tech')
        )
    );

CREATE POLICY "Staff can manage pages" ON pages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('master', 'admin')
        )
    );

CREATE POLICY "Staff can manage blocks" ON page_blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('master', 'admin')
        )
    );

CREATE POLICY "Admin can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'master'
        )
    );

-- ====================================
-- DATOS DE EJEMPLO
-- ====================================

-- Municipios iniciales
INSERT INTO municipalities (name, state, coverage_status) VALUES
('Chiapa de Corzo', 'Chiapas', 'available'),
('Teopisca', 'Chiapas', 'available'),
('Venustiano Carranza', 'Chiapas', 'partial'),
('San Cristóbal de las Casas', 'Chiapas', 'coming_soon'),
('Tuxtla Gutiérrez', 'Chiapas', 'not_available');

-- Códigos postales de ejemplo
INSERT INTO postal_codes (code, municipality_id, coverage_status) VALUES
('29160', (SELECT id FROM municipalities WHERE name = 'Chiapa de Corzo'), 'available'),
('29161', (SELECT id FROM municipalities WHERE name = 'Chiapa de Corzo'), 'available'),
('30570', (SELECT id FROM municipalities WHERE name = 'Teopisca'), 'available'),
('30140', (SELECT id FROM municipalities WHERE name = 'Venustiano Carranza'), 'partial');

-- Comunidades de ejemplo
INSERT INTO communities (name, postal_code_id, coverage_status) VALUES
('Centro', (SELECT id FROM postal_codes WHERE code = '29160'), 'available'),
('La Pila', (SELECT id FROM postal_codes WHERE code = '29160'), 'available'),
('Ribera Cahuaré', (SELECT id FROM postal_codes WHERE code = '29161'), 'partial'),
('Centro', (SELECT id FROM postal_codes WHERE code = '30570'), 'available'),
('Barrio San Sebastián', (SELECT id FROM postal_codes WHERE code = '30570'), 'available');

-- FAQ categorías
INSERT INTO faq_categories (name, slug, icon, sort_order) VALUES
('Internet', 'internet', '🌐', 1),
('Televisión', 'television', '📺', 2),
('Pagos', 'pagos', '💳', 3),
('Instalación', 'instalacion', '🔧', 4),
('Soporte Técnico', 'soporte', '🛠️', 5);

-- FAQ items de ejemplo
INSERT INTO faq_items (category_id, question, answer, sort_order, is_featured) VALUES
((SELECT id FROM faq_categories WHERE slug = 'internet'),
'¿Cuál es la velocidad real del servicio?',
'Nuestro servicio es 100% fibra óptica, lo que garantiza velocidades simétricas (misma velocidad de subida y bajada). La velocidad contratada es la velocidad real que recibirás.',
1, true),

((SELECT id FROM faq_categories WHERE slug = 'internet'),
'¿Tienen límite de datos?',
'No, todos nuestros planes son ilimitados. No tenemos políticas de uso justo ni limitamos tu consumo.',
2, true),

((SELECT id FROM faq_categories WHERE slug = 'pagos'),
'¿Cuándo debo pagar mi mensualidad?',
'Tu fecha de pago es el día de cada mes que corresponda a tu fecha de instalación. Tienes 5 días de gracia después de esa fecha.',
1, false),

((SELECT id FROM faq_categories WHERE slug = 'instalacion'),
'¿Cuánto tiempo tarda la instalación?',
'La instalación típicamente toma entre 1 a 2 horas dependiendo de las condiciones de tu hogar.',
1, false);

-- Página de inicio (sistema)
INSERT INTO pages (slug, title, description, is_published, is_system) VALUES
('home', 'Inicio', 'Página principal de Cable Master', true, true),
('planes', 'Planes y Precios', 'Conoce nuestros paquetes de Internet y TV', true, true),
('cobertura', 'Cobertura', 'Verifica si tenemos cobertura en tu zona', true, true),
('contacto', 'Contacto', 'Contáctanos', true, true);

-- Bloques de ejemplo para home
INSERT INTO page_blocks (page_id, block_type, title, sort_order, config, content) VALUES
((SELECT id FROM pages WHERE slug = 'home'), 'hero', 'Banner Principal', 1,
'{"fullWidth": true, "height": "600px", "overlay": true}',
'{"title": "Internet de Alta Velocidad", "subtitle": "100% Fibra Óptica en Chiapas", "ctaText": "Ver Planes", "ctaUrl": "/public/packages", "backgroundImage": "/hero-bg.jpg"}'),

((SELECT id FROM pages WHERE slug = 'home'), 'packages_grid', 'Nuestros Planes', 2,
'{"columns": 3, "showPrices": true}',
'{"title": "Elige tu Plan Ideal", "subtitle": "Tenemos el paquete perfecto para ti"}'),

((SELECT id FROM pages WHERE slug = 'home'), 'coverage_checker', 'Verificador de Cobertura', 3,
'{"style": "inline"}',
'{"title": "¿Tenemos cobertura en tu zona?", "placeholder": "Ingresa tu código postal"}'),

((SELECT id FROM pages WHERE slug = 'home'), 'stats', 'Estadísticas', 4,
'{"columns": 4, "animated": true}',
'{"items": [{"value": "10,000+", "label": "Clientes felices"}, {"value": "100%", "label": "Fibra óptica"}, {"value": "24/7", "label": "Soporte técnico"}, {"value": "99.9%", "label": "Uptime"}]}');

-- Trigger para updated_at en nuevas tablas
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
-- FIN DEL SCHEMA UPDATE
-- ====================================

-- Después de ejecutar este script:
-- 1. Verificar que todas las tablas se crearon correctamente
-- 2. Los folios se generan automáticamente al crear tickets
-- 3. La auditoría registra cambios en tickets y páginas
-- 4. Las políticas RLS protegen los datos apropiadamente

COMMENT ON TABLE tickets IS 'Tickets de contratación y reportes de fallas con folio automático';
COMMENT ON TABLE page_blocks IS 'Bloques del Page Builder para CMS';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de cambios en el sistema';
