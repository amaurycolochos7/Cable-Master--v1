-- ====================================
-- MIGRACIÓN: Agregar campo folio a coverage_requests
-- Ejecutar en Supabase SQL Editor
-- ====================================

-- 1. Agregar columna folio
ALTER TABLE coverage_requests
ADD COLUMN IF NOT EXISTS folio TEXT UNIQUE;

-- 2. Agregar columna phone_last4 para tracking
ALTER TABLE coverage_requests
ADD COLUMN IF NOT EXISTS phone_last4 TEXT GENERATED ALWAYS AS (RIGHT(phone, 4)) STORED;

-- 3. Crear función para generar folio automático
CREATE OR REPLACE FUNCTION generate_coverage_folio()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT := 'COB';
    year_str TEXT;
    next_num INTEGER;
    new_folio TEXT;
BEGIN
    year_str := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Obtener siguiente número para este año
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(folio, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM coverage_requests
    WHERE folio LIKE prefix || '-' || year_str || '-%';
    
    new_folio := prefix || '-' || year_str || '-' || LPAD(next_num::TEXT, 6, '0');
    NEW.folio := new_folio;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para generar folio automático
DROP TRIGGER IF EXISTS trigger_generate_coverage_folio ON coverage_requests;
CREATE TRIGGER trigger_generate_coverage_folio
    BEFORE INSERT ON coverage_requests
    FOR EACH ROW
    WHEN (NEW.folio IS NULL)
    EXECUTE FUNCTION generate_coverage_folio();

-- 5. Agregar índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_coverage_requests_folio ON coverage_requests(folio);
CREATE INDEX IF NOT EXISTS idx_coverage_requests_status ON coverage_requests(status);
CREATE INDEX IF NOT EXISTS idx_coverage_requests_created_at ON coverage_requests(created_at DESC);

-- 6. Actualizar folios existentes que no tengan folio
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 0;
    year_str TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
BEGIN
    FOR rec IN 
        SELECT id FROM coverage_requests 
        WHERE folio IS NULL 
        ORDER BY created_at
    LOOP
        counter := counter + 1;
        UPDATE coverage_requests 
        SET folio = 'COB-' || year_str || '-' || LPAD(counter::TEXT, 6, '0')
        WHERE id = rec.id;
    END LOOP;
END $$;

-- 7. Verificar
SELECT folio, full_name, phone, location, status, created_at
FROM coverage_requests
ORDER BY created_at DESC
LIMIT 10;
