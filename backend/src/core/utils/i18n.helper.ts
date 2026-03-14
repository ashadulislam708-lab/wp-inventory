import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { LanguageEnum } from 'src/shared/enums';

@Injectable()
export class I18nHelper {
    constructor(private readonly i18n: I18nService) {}

    t(key: string, args?: Record<string, any>): string {
        const lang = I18nContext.current()?.lang || LanguageEnum.KOREAN;

        if (process.env.MODE === 'DEV') {
            console.log('[i18nHelper] Translation request:', {
                key,
                lang,
                args,
            });
        }

        const options = args ? { lang, args } : { lang };
        let result = String(this.i18n.t(key, options));

        if (args && result.includes('{{')) {
            Object.keys(args).forEach((argKey) => {
                result = result.replace(
                    new RegExp(`\\{\\{${argKey}\\}\\}`, 'g'),
                    args[argKey],
                );
            });
        }

        if (process.env.MODE === 'DEV') {
            console.log('[i18nHelper] Translation options:', options);
            console.log('[i18nHelper] Translation result:', result);
        }

        return result;
    }

    getCurrentLanguage(): string {
        return I18nContext.current()?.lang || LanguageEnum.KOREAN;
    }

    /**
     * Translate with explicit language.
     * Use this for background jobs, scheduled tasks, or when no request context exists.
     *
     * @param key - Translation key
     * @param lang - Language code ('en', 'ko', etc.)
     * @param args - Optional variables to interpolate
     * @returns Translated string
     *
     * @example
     * // In background job or queue
     * const message = this.i18nHelper.tWithLang(
     *   'translation.email.subject',
     *   user.preferredLanguage,
     *   { name: user.name }
     * );
     */
    tWithLang(key: string, lang: string, args?: Record<string, any>): string {
        const options = args ? { lang, ...args } : { lang };
        return this.i18n.t(key, options);
    }

    isLanguage(lang: string): boolean {
        return this.getCurrentLanguage() === lang;
    }

    getAvailableLanguages(): string[] {
        return Object.values(LanguageEnum);
    }
}
