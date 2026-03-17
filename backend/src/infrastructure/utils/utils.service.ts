import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

interface DuplicateKeyInfo {
    columnName: string;
    value: string;
}
@Injectable()
export class UtilsService {
    async getHash(text: string): Promise<string> {
        const salt = await bcrypt.genSalt();
        return await bcrypt.hash(text, salt);
    }

    async isMatchHash(first: string, second: string): Promise<boolean> {
        return await bcrypt.compare(first, second);
    }

    generateUniqueOTP(length = 4): number {
        const digits = '0123456789';
        let otp = '';
        while (otp.length < length) {
            const randomDigit =
                digits[Math.floor(Math.random() * digits.length)];
            // preventing the fist digit being 0 and duplicate digit
            if (
                (otp.length == 0 && randomDigit === '0') ||
                otp.includes(randomDigit)
            ) {
                continue;
            } else {
                otp += randomDigit;
            }
        }
        return parseInt(otp);
    }

    extractColumnNameFromError(detail: string): DuplicateKeyInfo {
        const match = detail.match(/\((.*?)\)=\((.*?)\)/);
        return {
            columnName: match ? match[1] : 'unknown',
            value: match ? match[2] : 'unknown',
        };
    }

    generatePassword(
        length: number = 8,
        includeUppercase = true,
        includeLowercase = true,
        includeNumbers = true,
        includeSymbols = true,
        excludeSimilar = true,
        excludeAmbiguous = true,
    ): string {
        const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
        const similarChars = 'il1Lo0O';
        const ambiguousChars = '{}[]()/\\\'"`~,;:.<>';

        let chars = '';

        if (includeUppercase) chars += uppercaseChars;
        if (includeLowercase) chars += lowercaseChars;
        if (includeNumbers) chars += numberChars;
        if (includeSymbols) chars += symbolChars;

        if (excludeSimilar) {
            for (const char of similarChars) {
                chars = chars.replace(new RegExp(char, 'g'), '');
            }
        }

        if (excludeAmbiguous) {
            for (const char of ambiguousChars) {
                chars = chars.replace(new RegExp('\\' + char, 'g'), '');
            }
        }

        let newPassword = '';
        const charsLength = chars.length;

        if (charsLength === 0) return '';

        for (let i = 0; i < length; i++) {
            newPassword += chars.charAt(
                Math.floor(Math.random() * charsLength),
            );
        }

        return newPassword;
    }

    validateFile(
        file: Express.Multer.File,
        fieldName: string,
        allowedTypes: string[],
        maxSizeMB: number,
    ): void {
        if (!allowedTypes.includes(file.mimetype)) {
            const allowedExtensions = allowedTypes
                .map((type) => {
                    const parts = type.split('/');
                    return parts[1]
                        ? parts[1].toUpperCase()
                        : type.toUpperCase();
                })
                .join(', ');
            throw new BadRequestException(
                `${fieldName} must be one of the following formats: ${allowedExtensions}.`,
            );
        }

        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new BadRequestException(
                `${fieldName} must be less than ${maxSizeMB}MB.`,
            );
        }
    }

    handleOpenAIError(error: any): never {
        const errorMap: { [key: number | string]: string } = {
            401: 'OpenAI API key is invalid or missing.',
            429: 'OpenAI rate limit exceeded. Please try again later.',
            400: 'Invalid request to OpenAI API. Please check the image format.',
            500: 'OpenAI server error. Please try again later.',
            503: 'OpenAI service is temporarily unavailable.',
            insufficient_quota:
                'OpenAI quota exceeded. Please try again later.',
            rate_limit_exceeded:
                'OpenAI rate limit exceeded. Please try again later.',
            invalid_request_error: 'Invalid request to OpenAI service.',
            model_not_found: 'OpenAI model not available.',
            server_error: 'OpenAI server error. Please try again later.',
        };

        if (error.status in errorMap || error.code in errorMap) {
            throw new InternalServerErrorException(
                errorMap[error.status] || errorMap[error.code],
            );
        }
        if (error.name === 'OpenAIError' || error.message?.includes('OpenAI')) {
            throw new InternalServerErrorException(
                'OpenAI service error: ' + error.message,
            );
        }
        throw new InternalServerErrorException(
            error.message || 'An unexpected error occurred',
        );
    }
}
