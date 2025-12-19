-- Cable Master Database Schema
-- Ejecutar en Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- TABLA: profiles (usuarios del sistema)
-- ====================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master', 'admin', 'counter', 'tech', 'client')),
  phone TEXT,
  branch_id UUID,
  assigned_locations TEXT[], -- Array de localidades asignadas (para técnicos)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- TABLA: locations (localidades donde opera Cable Master)
-- ====================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  state TEXT DEFAULT 'Chiapas',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar localidades iniciales
INSERT INTO locations (name) VALUES 
  ('Teopisca'),
  ('Chiapa de Corzo'),
  ('Venustiano Carranza');

-- ====================================
-- TABLA: branches (sucursales físicas)
-- ====================================
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

-- Sucursal de ejemplo
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

-- ====================================
-- TABLA: service_packages (paquetes de servicio)
-- ====================================
CREATE TABLE service_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internet', 'tv', 'combo')),
  speed_mbps INTEGER, -- Solo para internet/combo
  channels_count INTEGER, -- Solo para TV/combo
  monthly_price DECIMAL(10, 2) NOT NULL,
  installation_fee DECIMAL(10, 2) DEFAULT 0,
  description TEXT,
  features TEXT[], -- Array de características
  locations TEXT[], -- Array de localidades donde está disponible
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paquetes basados en las imágenes (Promo de Verano)
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

-- ====================================
-- TABLA: promotions (promociones vigentes)
-- ====================================
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'free_months', 'free_installation')),
  discount_value DECIMAL(10, 2),
  free_months INTEGER DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE,
  applicable_packages UUID[], -- IDs de paquetes aplicables
  applicable_locations TEXT[],
  terms TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promoción de Verano (basada en imagen)
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

-- ====================================
-- TABLA: customers (clientes)
-- ====================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Si se registra en portal
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT,
  address TEXT NOT NULL,
  location TEXT NOT NULL,
  neighborhood TEXT,
  reference_notes TEXT, -- Referencias de ubicación
  rfc TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- TABLA: service_contracts (contratos de servicio)
-- ====================================
CREATE TABLE service_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_number TEXT UNIQUE NOT NULL, -- Número de servicio único
  customer_id UUID REFERENCES customers(id) NOT NULL,
  package_id UUID REFERENCES service_packages(id) NOT NULL,
  promotion_id UUID REFERENCES promotions(id),
  status TEXT NOT NULL DEFAULT 'pending_installation' CHECK (status IN ('pending_installation', 'active', 'suspended', 'cancelled')),
  monthly_fee DECIMAL(10, 2) NOT NULL,
  installation_fee DECIMAL(10, 2) DEFAULT 0,
  payment_day INTEGER DEFAULT 1, -- Día del mes para pago
  next_payment_date DATE,
  contract_pdf_url TEXT,
  installed_modem TEXT, -- Modelo o serial del modem
  installed_decoder TEXT, -- Modelo o serial del decodificador
  installation_date DATE,
  cancellation_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para generar número de servicio automático
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

-- ====================================
-- TABLA: payments (registro de pagos)
-- ====================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES service_contracts(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'mercadopago')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('monthly', 'installation', 'reconnection', 'other')),
  period_month INTEGER, -- Mes que se está pagando
  period_year INTEGER, -- Año que se está pagando
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  mercadopago_payment_id TEXT, -- ID de pago de Mercado Pago
  receipt_url TEXT, -- URL del comprobante PDF
  paid_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id), -- Usuario de ventanilla que procesó
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- TABLA: work_orders (órdenes de trabajo)
-- ====================================
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES service_contracts(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('installation', 'maintenance', 'repair', 'reconnection', 'disconnection')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id), -- Técnico asignado
  scheduled_date DATE,
  completed_date DATE,
  description TEXT,
  resolution_notes TEXT, -- Notas del técnico al completar
  photos TEXT[], -- URLs de fotos del trabajo
  customer_signature TEXT, -- URL de firma digital
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- TABLA: incidents (incidencias reportadas)
-- ====================================
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES service_contracts(id),
  type TEXT NOT NULL CHECK (type IN ('no_signal', 'slow_speed', 'equipment_failure', 'cable_damage', 'other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  description TEXT NOT NULL,
  reported_by TEXT NOT NULL, -- Puede ser cliente o técnico
  assigned_to UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- TABLA: coverage_requests (solicitudes de cobertura)
-- ====================================
CREATE TABLE coverage_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  location TEXT NOT NULL,
  coordinates_lat DECIMAL(10, 8),
  coordinates_lng DECIMAL(11, 8),
  service_interest TEXT, -- internet, tv, combo
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected')),
  notes TEXT,
  contacted_by UUID REFERENCES profiles(id),
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- TABLA: system_settings (configuración del sistema)
-- ====================================
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración inicial
INSERT INTO system_settings (key, value, description) VALUES
  ('company_name', '"Cable Master"', 'Nombre de la empresa'),
  ('company_slogan', '"La Mejor Programación"', 'Slogan de la empresa'),
  ('primary_color', '"#E31E24"', 'Color primario (rojo)'),
  ('secondary_color', '"#1E3C96"', 'Color secundario (azul)'),
  ('late_payment_days', '5', 'Días de gracia antes de suspensión'),
  ('default_payment_day', '1', 'Día default de pago mensual');

-- ====================================
-- RLS (Row Level Security) Policies
-- ====================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_requests ENABLE ROW LEVEL SECURITY;

-- Policies para profiles (usuarios pueden ver y actualizar su propio perfil)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policies para clientes (pueden ver solo su información)
CREATE POLICY "Clients can view own customer data" ON customers
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Clients can view own contracts" ON service_contracts
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
  );

CREATE POLICY "Clients can view own payments" ON payments
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM service_contracts 
      WHERE customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
    )
  );

-- Staff puede ver todo (master, admin, tech, counter)
CREATE POLICY "Staff can view all customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('master', 'admin', 'tech', 'counter')
    )
  );

CREATE POLICY "Staff can insert customers" ON customers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('master', 'admin', 'counter')
    )
  );

-- ====================================
-- Funciones auxiliares
-- ====================================

-- Función para actualizar fecha de próximo pago
CREATE OR REPLACE FUNCTION update_next_payment_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    NEW.next_payment_date := (CURRENT_DATE + INTERVAL '1 month')::DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_payment_date
  BEFORE UPDATE ON service_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_next_payment_date();

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
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

-- ====================================
-- NOTA: Los datos de clientes se crean desde la aplicación
-- No incluir datos de ejemplo en el repositorio por seguridad
-- ====================================

-- Storage buckets para archivos
INSERT INTO storage.buckets (id, name, public) VALUES
  ('receipts', 'receipts', true),
  ('contracts', 'contracts', true),
  ('work-orders', 'work-orders', true);

-- Policies para storage
CREATE POLICY "Public access to receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Staff can upload receipts" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
