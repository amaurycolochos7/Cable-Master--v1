# Cable Master - Plataforma Integral de Telecomunicaciones

Sistema completo de gestión y ventas para Cable Master, empresa de telecomunicaciones en Chiapas.

## 🚀 Características Principales

### Sitio Web Público
- ✅ Landing page moderno con branding Cable Master
- ✅ Catálogo de paquetes (Internet + TV) con filtros por localidad
- ✅ Verificador de cobertura con integración WhatsApp
- ✅ Diseño responsive y animaciones premium
- ✅ Datos basados en promociones reales (80 Megas + 100 canales por $450/mes)

### Panel Administrativo (En desarrollo)
- Sistema de autenticación multi-rol
- Dashboard para superadministrador
- Gestión de usuarios (admin, técnicos, ventanilla)
- Catálogo de servicios y promociones
- Control de pagos y facturación
- Reportes y analytics

### Portal de Clientes (Planificado)
- Dashboard estilo Telmex
- Consulta de servicio y pagos
- Integración con Mercado Pago
- Historial y comprobantes descargables

### Panel de Técnicos (Planificado)
- Órdenes de trabajo
- Actualización de estatus
- Reporte de incidencias

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Cuenta de Supabase (gratuita)
- Credenciales de Mercado Pago Sandbox (para pruebas)

## ⚙️ Configuración Inicial

### 1. Configurar Supabase

1. Ir a [https://supabase.com](https://supabase.com) y crear cuenta
2. Crear nuevo proyecto
3. Ir a **Settings > API** y copiar:
   - `Project URL`
   - `anon public` key
   - `service_role` key (secret)

4. Ir a **SQL Editor** y ejecutar el archivo `supabase-schema.sql` completo
   - Esto creará todas las tablas, funciones y datos de ejemplo

### 2. Crear Usuario Maestro

Después de ejecutar el schema, crear tu primer usuario en Supabase Auth:

1. Ir a **Authentication > Users** en Supabase
2. Click en "Add user" > "Create new user"
3. Ingresar:
   - Email: tu-email@ejemplo.com
   - Password: tu-contraseña-segura
   - Confirm password

4. Una vez creado el usuario AUTH, copiar su UUID

5. Ir a **SQL Editor** y ejecutar:

```sql
-- Reemplaza 'USER_UUID_AQUI' con el UUID del paso anterior
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  'USER_UUID_AQUI',
  'tu-email@ejemplo.com',
  'Tu Nombre Completo',
  'master',
  true
);
```

### 3. Configurar Variables de Entorno

1. Crear archivo `.env.local` en la raíz del proyecto

2. Agregar las siguientes variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Mercado Pago Sandbox (opcional por ahora)
MERCADOPAGO_ACCESS_TOKEN=TEST-token-here
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-public-key-here

# WhatsApp (ya configurados con el número de las imágenes)
NEXT_PUBLIC_WHATSAPP_MAIN=5219612483470
NEXT_PUBLIC_WHATSAPP_TEOPISCA=5219612483470
NEXT_PUBLIC_WHATSAPP_CHIAPA=5219612483470
NEXT_PUBLIC_WHATSAPP_VENUSTIANO=5219612483470

# App Settings
NEXT_PUBLIC_APP_NAME=Cable Master
NEXT_PUBLIC_APP_SLOGAN=La Mejor Programación
```

## 🏃‍♂️ Ejecutar la Aplicación

### Modo Desarrollo (Local)

```powershell
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

### Rutas Disponibles

- `http://localhost:3000` → Redirige al sitio público
- `http://localhost:3000/public` → Landing page pública
- `http://localhost:3000/public/packages` → Catálogo de paquetes
- `http://localhost:3000/public/coverage` → Verificador de cobertura
- `http://localhost:3000/login` → Login para staff

## 🎨 Tecnologías Utilizadas

- **Next.js 14** (App Router) con TypeScript
- **Tailwind CSS** para estilos
- **Framer Motion** para animaciones
- **Supabase** (PostgreSQL + Auth + Storage)
- **Mercado Pago SDK** (integración de pagos)
- **Heroicons** para iconografía

## 🎨 Colores del Branding

- Rojo primario: `#E31E24`
- Azul primario: `#1E3C96`
- Dorado (accent): `#FFD700`

## 📊 Datos de Ejemplo Incluidos

El schema incluye datos de ejemplo basados en las imágenes proporcionadas:

- **Localidades**: Teopisca, Chiapa de Corzo, Venustiano Carranza
- **Paquete Popular**: 80 Megas + 100 canales por $450/mes
- **Promoción Verano**: Contrato GRATIS + Primera mensualidad GRATIS
- **Cliente de prueba**: Juan Pérez García (contrato CM000001)
- **Sucursal**: Cable Master - Chiapa de Corzo

## 🔐 Roles de Usuario

1. **master** (superadministrador): Acceso total al sistema
2. **admin**: Gestión de clientes y servicios
3. **counter** (ventanilla): Registro de contratos y pagos presenciales
4. **tech** (técnico): Órdenes de trabajo y actualizaciones
5. **client**: Portal de autogestión

## 📱 Integración WhatsApp

El sistema usa enlaces `wa.me` para:
- Verificación de cobertura (prellenado automático)
- Contratación de paquetes (mensaje con detalles)
- Mensajes automáticos por localidad

## 🚧 Estado Actual del Desarrollo

### ✅ Completado
- [x] Configuración del proyecto
- [x] Base de datos con schema completo
- [x] Sistema de autenticación
- [x] Sitio web público
  - [x] Landing page
  - [x] Catálogo de paquetes
  - [x] Verificador de cobertura
- [x] Integración WhatsApp
- [x] Diseño responsive

### 🔄 En Progreso
- [ ] Panel de Superadministrador
- [ ] Dashboard principal

### 📋 Pendiente
- [ ] Panel de Ventanilla
- [ ] Panel de Técnicos
- [ ] Portal de Clientes
- [ ] Integración Mercado Pago completa
- [ ] Generación de comprobantes PDF
- [ ] Sistema de notificaciones

## 🐛 Troubleshooting

### Error: "createClient is not a function"
- Verifica que las variables de entorno estén configuradas en `.env.local`
- Reinicia el servidor de desarrollo después de cambiar `.env.local`

### Error: "Cannot read properties of null"
- Asegúrate de haber ejecutado el `supabase-schema.sql` completo
- Verifica que el usuario maestro exista en la tabla `profiles`

### Error de autenticación
- Verifica que el email y contraseña sean correctos
- Asegura que el usuario tenga un registro en `profiles` con el mismo `id` que en `auth.users`

## 🎯 Próximos Pasos

1. Configurar Supabase y variables de entorno
2. Ejecutar `npm run dev`
3. Acceder a `http://localhost:3000/public` para ver el sitio público
4. Probar verificador de cobertura (abrirá WhatsApp)
5. Probar login con usuario maestro creado

---

**Desarrollado para Cable Master - "La Mejor Programación"** 🚀📡
