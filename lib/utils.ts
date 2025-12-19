import { format, addMonths, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una fecha a formato legible en español
 */
export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: es });
}

/**
 * Calcula la próxima fecha de pago
 */
export function getNextPaymentDate(paymentDay: number): Date {
    const today = new Date();
    const nextMonth = addMonths(today, 1);
    nextMonth.setDate(paymentDay);
    return nextMonth;
}

/**
 * Calcula días restantes hasta una fecha
 */
export function getDaysUntil(targetDate: string | Date): number {
    const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate;
    return differenceInDays(target, new Date());
}

/**
 * Determina el estado de pago según días restantes
 */
export function getPaymentStatus(days: number): {
    status: 'good' | 'warning' | 'overdue';
    color: string;
    message: string;
} {
    if (days > 5) {
        return {
            status: 'good',
            color: 'green',
            message: 'Al corriente',
        };
    } else if (days > 0) {
        return {
            status: 'warning',
            color: 'yellow',
            message: `${days} días para vencer`,
        };
    } else {
        return {
            status: 'overdue',
            color: 'red',
            message: `Vencido ${Math.abs(days)} días`,
        };
    }
}

/**
 * Formatea cantidad a moneda mexicana
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(amount);
}
