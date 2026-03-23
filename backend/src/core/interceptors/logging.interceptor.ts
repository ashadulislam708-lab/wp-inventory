import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);
    private readonly isDevMode = process.env.MODE === 'DEV';

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const { method, url, body } = request;
        const now = Date.now();

        const sanitizedBody = this.isDevMode ? body : this.sanitizeBody(body);

        this.logger.log(
            `Incoming Request: ${method} ${url}${this.isDevMode ? ` - Body: ${JSON.stringify(sanitizedBody)}` : ''}`,
        );

        return next.handle().pipe(
            tap(() => {
                const response = ctx.getResponse();
                const { statusCode } = response;
                const responseTime = Date.now() - now;

                this.logger.log(
                    `Response: ${method} ${url} - Status: ${statusCode} - ${responseTime}ms`,
                );
            }),
            catchError((error) => {
                const responseTime = Date.now() - now;
                const status = error?.status || 500;

                this.logger.error(
                    `Error: ${method} ${url} - Status: ${status} - ${responseTime}ms - ${error.message}`,
                );

                return throwError(() => error);
            }),
        );
    }

    private sanitizeBody(body: any): any {
        if (!body || typeof body !== 'object') return body;

        const sensitiveFields = [
            'password',
            'currentPassword',
            'newPassword',
            'confirmPassword',
            'token',
            'accessToken',
            'refreshToken',
            'secret',
            'apiKey',
            'privateKey',
            'creditCard',
            'ssn',
            'otp',
        ];

        const sanitized = { ...body };

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '***REDACTED***';
            }
        }

        return sanitized;
    }
}
