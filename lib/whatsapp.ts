/**
 * Genera un enlace de WhatsApp con mensaje prellenado
 * @param phone Número de WhatsApp (con código de país)
 * @param message Mensaje a prellenar
 * @returns URL de WhatsApp Web
 */
export function generateWhatsAppLink(phone: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
}

/**
 * Genera mensaje de verificación de cobertura
 */
export function getCoverageMessage(data: {
    name: string;
    address: string;
    location: string;
    serviceType?: string;
}): string {
    return `Hola, soy ${data.name}. Me interesa el servicio de ${data.serviceType || 'internet y TV'} en ${data.address}, ${data.location}. ¿Hay cobertura disponible en mi zona?`;
}

/**
 * Genera mensaje para contratar un paquete
 */
export function getPackageContractMessage(data: {
    name: string;
    phone: string;
    packageName: string;
    location: string;
}): string {
    return `Hola, me llamo ${data.name}. Me interesa contratar el paquete "${data.packageName}" en ${data.location}. Mi teléfono es ${data.phone}. ¿Podrían brindarme más información?`;
}

/**
 * Obtiene el número de WhatsApp según la localidad
 */
export function getWhatsAppByLocation(location: string): string {
    const numbers: Record<string, string> = {
        'Teopisca': process.env.NEXT_PUBLIC_WHATSAPP_TEOPISCA || process.env.NEXT_PUBLIC_WHATSAPP_MAIN || '',
        'Chiapa de Corzo': process.env.NEXT_PUBLIC_WHATSAPP_CHIAPA || process.env.NEXT_PUBLIC_WHATSAPP_MAIN || '',
        'Venustiano Carranza': process.env.NEXT_PUBLIC_WHATSAPP_VENUSTIANO || process.env.NEXT_PUBLIC_WHATSAPP_MAIN || '',
    };

    return numbers[location] || process.env.NEXT_PUBLIC_WHATSAPP_MAIN || '';
}
