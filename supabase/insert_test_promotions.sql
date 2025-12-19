-- ====================================
-- PROMOCIONES DE PRUEBA PARA CABLE MASTER
-- Ejecutar en Supabase SQL Editor
-- ====================================

-- Limpiar promociones existentes (opcional)
-- DELETE FROM banners;

-- Insertar promociones de prueba
INSERT INTO banners (name, type, title, subtitle, description, image_url, cta_text, cta_url, background_color, position, is_active, sort_order) VALUES

-- Promoción Hero Principal
(
    'Promoción Verano 2024',
    'hero',
    '🔥 ¡MEGA OFERTAS DE VERANO!',
    '80 Megas + 100 Canales HD',
    'Internet de alta velocidad + TV Premium por solo $450/mes. ¡Instalación GRATIS!',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
    '¡Contratar Ahora!',
    '/public/contratar',
    '#dc2626',
    'home_hero',
    true,
    1
),

-- Promoción Secundaria
(
    'Descuento Primera Mensualidad',
    'bar',
    '💰 Primera Mensualidad GRATIS',
    'Contrata hoy y no pagues el primer mes',
    NULL,
    NULL,
    'Ver Condiciones',
    '/public/packages',
    '#059669',
    'home_promo',
    true,
    2
),

-- Promoción Navideña
(
    'Promoción Navidad 2024',
    'hero',
    '🎄 NAVIDAD CON CABLE MASTER',
    'Regala conectividad a tu familia',
    'Paquetes especiales con hasta 30% de descuento. Válido hasta el 31 de diciembre.',
    'https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=1200',
    'Ver Promociones',
    '/public/packages',
    '#7c3aed',
    'home_hero',
    true,
    3
),

-- Banner Sidebar
(
    'Referidos',
    'sidebar',
    '👥 Programa de Referidos',
    'Gana $200 por cada amigo',
    'Recomienda Cable Master y recibe crédito en tu cuenta.',
    NULL,
    'Más Información',
    '/public/referidos',
    '#0891b2',
    'sidebar',
    true,
    4
),

-- Popup Urgente
(
    'Oferta Flash',
    'popup',
    '⚡ OFERTA FLASH - Solo hoy',
    '50% de descuento en instalación',
    'Contrata en las próximas 24 horas y obtén instalación a mitad de precio.',
    NULL,
    'Aprovechar Oferta',
    '/public/contratar',
    '#f59e0b',
    'popup',
    false,
    5
);

-- Verificar las promociones insertadas
SELECT id, name, type, title, position, is_active, sort_order 
FROM banners 
ORDER BY sort_order;
