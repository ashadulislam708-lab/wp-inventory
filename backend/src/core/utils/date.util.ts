export class DateUtil {
    /**
     * Add days to a date
     */
    static addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Add hours to a date
     */
    static addHours(date: Date, hours: number): Date {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }

    /**
     * Check if date is in the past
     */
    static isPast(date: Date): boolean {
        return date < new Date();
    }

    /**
     * Check if date is in the future
     */
    static isFuture(date: Date): boolean {
        return date > new Date();
    }

    /**
     * Format date to ISO string
     */
    static toISOString(date: Date): string {
        return date.toISOString();
    }
}
