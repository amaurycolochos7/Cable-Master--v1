import { z } from 'zod';

// ====================================
// TICKET SCHEMAS
// ====================================

export const ticketTypeSchema = z.enum(['contract', 'fault']);
export type TicketType = z.infer<typeof ticketTypeSchema>;

export const contractStatusSchema = z.enum([
    'NEW',
    'VALIDATION',
    'CONTACTED',
    'SCHEDULED',
    'IN_ROUTE',
    'INSTALLED',
    'CANCELLED',
    'OUT_OF_COVERAGE',
    'DUPLICATE'
]);
export type ContractStatus = z.infer<typeof contractStatusSchema>;

export const faultStatusSchema = z.enum([
    'NEW',
    'DIAGNOSIS',
    'SCHEDULED',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
    'NOT_APPLICABLE'
]);
export type FaultStatus = z.infer<typeof faultStatusSchema>;

export const prioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
export type Priority = z.infer<typeof prioritySchema>;

// Schema para crear ticket de contratación
export const createContractTicketSchema = z.object({
    type: z.literal('contract'),
    full_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().min(10, 'La dirección debe tener al menos 10 caracteres'),
    postal_code: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
    community: z.string().optional(),
    municipality: z.string().optional(),
    references_text: z.string().optional(),
    package_id: z.string().uuid('Selecciona un paquete válido').optional(),
    promotion_id: z.string().uuid().optional(),
    preferred_schedule: z.string().optional(),
});
export type CreateContractTicket = z.infer<typeof createContractTicketSchema>;

// Schema para crear ticket de falla
export const createFaultTicketSchema = z.object({
    type: z.literal('fault'),
    full_name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().min(10, 'La dirección debe tener al menos 10 caracteres'),
    postal_code: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos').optional(),
    service_number: z.string().optional(),
    fault_description: z.string().min(10, 'Describe el problema con al menos 10 caracteres'),
});
export type CreateFaultTicket = z.infer<typeof createFaultTicketSchema>;

// Schema unificado para crear ticket
export const createTicketSchema = z.discriminatedUnion('type', [
    createContractTicketSchema,
    createFaultTicketSchema,
]);
export type CreateTicket = z.infer<typeof createTicketSchema>;

// Schema para tracking de folio
export const trackFolioSchema = z.object({
    folio: z.string().regex(/^(CON|FAL)-\d{4}-\d{6}$/, 'Formato de folio inválido'),
    phone_last4: z.string().regex(/^\d{4}$/, 'Ingresa los últimos 4 dígitos de tu teléfono'),
});
export type TrackFolio = z.infer<typeof trackFolioSchema>;

// Schema para actualizar ticket (admin)
export const updateTicketSchema = z.object({
    contract_status: contractStatusSchema.optional(),
    fault_status: faultStatusSchema.optional(),
    priority: prioritySchema.optional(),
    assigned_to: z.string().uuid().optional(),
    scheduled_date: z.string().optional(),
    scheduled_time_start: z.string().optional(),
    scheduled_time_end: z.string().optional(),
    public_note: z.string().optional(),
});
export type UpdateTicket = z.infer<typeof updateTicketSchema>;

// ====================================
// COVERAGE SCHEMAS
// ====================================

export const coverageStatusSchema = z.enum([
    'available',
    'partial',
    'coming_soon',
    'not_available'
]);
export type CoverageStatus = z.infer<typeof coverageStatusSchema>;

export const checkCoverageSchema = z.object({
    postal_code: z.string().regex(/^\d{5}$/, 'Código postal inválido'),
});
export type CheckCoverage = z.infer<typeof checkCoverageSchema>;

export const createMunicipalitySchema = z.object({
    name: z.string().min(2),
    state: z.string().default('Chiapas'),
    coverage_status: coverageStatusSchema.default('not_available'),
});

export const createPostalCodeSchema = z.object({
    code: z.string().regex(/^\d{5}$/),
    municipality_id: z.string().uuid(),
    coverage_status: coverageStatusSchema.default('not_available'),
    available_packages: z.array(z.string().uuid()).optional(),
    notes: z.string().optional(),
});

export const createCommunitySchema = z.object({
    name: z.string().min(2),
    postal_code_id: z.string().uuid(),
    coverage_status: coverageStatusSchema.default('not_available'),
    estimated_date: z.string().optional(),
    notes: z.string().optional(),
});

// ====================================
// CMS / PAGE BUILDER SCHEMAS
// ====================================

export const blockTypeSchema = z.enum([
    'hero',
    'text',
    'image',
    'gallery',
    'cards',
    'pricing',
    'testimonials',
    'faq',
    'cta',
    'form',
    'video',
    'map',
    'stats',
    'team',
    'timeline',
    'tabs',
    'accordion',
    'spacer',
    'divider',
    'html_embed',
    'packages_grid',
    'coverage_checker',
    'contact_form'
]);
export type BlockType = z.infer<typeof blockTypeSchema>;

export const createPageSchema = z.object({
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
    title: z.string().min(1),
    description: z.string().optional(),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    template: z.string().default('default'),
});
export type CreatePage = z.infer<typeof createPageSchema>;

export const createBlockSchema = z.object({
    page_id: z.string().uuid(),
    block_type: blockTypeSchema,
    title: z.string().optional(),
    sort_order: z.number().int().default(0),
    config: z.record(z.string(), z.unknown()).optional(),
    content: z.record(z.string(), z.unknown()).optional(),
    styles: z.record(z.string(), z.unknown()).optional(),
    is_visible: z.boolean().default(true),
    visible_from: z.string().optional(),
    visible_until: z.string().optional(),
});
export type CreateBlock = z.infer<typeof createBlockSchema>;

export const updateBlockSchema = createBlockSchema.partial();
export type UpdateBlock = z.infer<typeof updateBlockSchema>;

// ====================================
// FAQ SCHEMAS
// ====================================

export const createFaqCategorySchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    icon: z.string().optional(),
    sort_order: z.number().int().default(0),
});

export const createFaqItemSchema = z.object({
    category_id: z.string().uuid().optional(),
    question: z.string().min(5),
    answer: z.string().min(10),
    sort_order: z.number().int().default(0),
    is_featured: z.boolean().default(false),
});

// ====================================
// USER/AUTH SCHEMAS
// ====================================

export const userRoleSchema = z.enum(['master', 'admin', 'counter', 'tech', 'client']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    full_name: z.string().min(2),
    role: userRoleSchema,
    phone: z.string().optional(),
    branch_id: z.string().uuid().optional(),
    assigned_locations: z.array(z.string()).optional(),
});
export type CreateUser = z.infer<typeof createUserSchema>;

// ====================================
// TICKET EVENT SCHEMAS
// ====================================

export const ticketEventTypeSchema = z.enum([
    'note_internal',
    'note_public',
    'scheduled',
    'rescheduled',
    'assigned',
    'attachment',
    'call_attempt',
    'call_success',
    'whatsapp_sent',
    'status_change'
]);
export type TicketEventType = z.infer<typeof ticketEventTypeSchema>;

export const createTicketEventSchema = z.object({
    ticket_id: z.string().uuid(),
    event_type: ticketEventTypeSchema,
    title: z.string().optional(),
    content: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    is_visible_to_customer: z.boolean().default(false),
});
export type CreateTicketEvent = z.infer<typeof createTicketEventSchema>;
