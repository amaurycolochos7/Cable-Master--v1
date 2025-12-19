# Environment Variables Configuration

Copiar este archivo y crear `.env.local` con los valores reales.

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Mercado Pago Sandbox Credentials
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token-here
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key-here

# WhatsApp Numbers (basado en las imágenes)
NEXT_PUBLIC_WHATSAPP_MAIN=5219612483470
NEXT_PUBLIC_WHATSAPP_TEOPISCA=5219612483470
NEXT_PUBLIC_WHATSAPP_CHIAPA=5219612483470
NEXT_PUBLIC_WHATSAPP_VENUSTIANO=5219612483470

# App Settings
NEXT_PUBLIC_APP_NAME=Cable Master
NEXT_PUBLIC_APP_SLOGAN=La Mejor Programación
```

## Configuración de Supabase

1. Crear proyecto en https://supabase.com
2. Ir a Settings > API
3. Copiar Project URL y Project API Key (anon)
4. Ejecutar el schema.sql en el SQL Editor

## Configuración de Mercado Pago

1. Ir a https://www.mercadopago.com/developers/panel
2. Crear aplicación de prueba
3. Obtener credenciales TEST (Access Token y Public Key)
