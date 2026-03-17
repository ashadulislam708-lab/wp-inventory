/**
 * Normalize a Bangladeshi phone number to 11-digit format (01XXXXXXXXX).
 * Handles: +8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX
 */
export function normalizeBDPhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
    if (cleaned.startsWith('880') && cleaned.length === 13)
        cleaned = cleaned.substring(3);
    return cleaned;
}
