import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
    ConflictException,
    NotFoundException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto, ErrorDetailDto } from '@shared/dtos';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        let message: string;
        let errorDetails: ErrorDetailDto[] | undefined;
        let customResponse: any = null;
        let responseData: any = null;

        if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;

            errorDetails = this.generateErrorDetailsFromException(
                exception,
                status,
                request,
            );
            responseData = null;
        } else if (typeof exceptionResponse === 'object') {
            const responseObj = exceptionResponse as any;

            if (
                responseObj.success === false &&
                responseObj.error &&
                responseObj.message
            ) {
                customResponse = {
                    ...responseObj,
                    timestamp: new Date().toISOString(),
                    path: request.url,
                };
                message = responseObj.message;
                errorDetails = responseObj.error;
                responseData =
                    responseObj.data !== undefined ? responseObj.data : null;
            } else if (Array.isArray(responseObj.message)) {
                const validationDetails = this.parseValidationArray(
                    responseObj.message,
                );
                message = this.formatValidationErrors(validationDetails);
                errorDetails = validationDetails;
            } else {
                message =
                    responseObj.message ||
                    exception.message ||
                    'An error occurred';
                errorDetails = this.generateErrorDetailsFromException(
                    exception,
                    status,
                    request,
                );
                responseData = null;

                if (responseObj.errors) {
                    errorDetails = this.parseValidationArray(
                        responseObj.errors as any[],
                    );
                }
            }
        } else {
            message = exception.message || 'An error occurred';
            errorDetails = this.generateErrorDetailsFromException(
                exception,
                status,
                request,
            );
        }

        let errorResponse;
        if (customResponse) {
            errorResponse = customResponse;
        } else {
            errorResponse = new ErrorResponseDto(
                message,
                status,
                errorDetails,
                request.url,
            );

            if (responseData !== undefined) {
                errorResponse.data = responseData;
            } else if (status === HttpStatus.CONFLICT) {
                errorResponse.data = null;
            }
        }

        this.logger.error(
            `[${status}] ${request.method} ${request.url} - ${message}`,
            JSON.stringify({
                statusCode: status,
                message,
                path: request.url,
                method: request.method,
                body: request.body,
                errorDetails,
            }),
        );

        response.status(status).json(errorResponse);
    }

    private generateErrorDetailsFromException(
        exception: HttpException,
        status: number,
        request: Request,
    ): ErrorDetailDto[] {
        const extractField = (): string | undefined => {
            const body = request.body;
            if (body) {
                if (body.email) return 'email';
                if (body.username) return 'username';
                if (body.id) return 'id';
            }

            const pathSegments = request.url.split('/');
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (
                lastSegment &&
                lastSegment !== '' &&
                !lastSegment.includes('?')
            ) {
                return 'id';
            }

            return undefined;
        };

        if (exception instanceof ConflictException) {
            return [
                {
                    field: extractField() || 'resource',
                    reason: 'Resource with this identifier already exists',
                    code: 'CONFLICT',
                },
            ];
        }

        if (exception instanceof NotFoundException) {
            return [
                {
                    field: extractField() || 'id',
                    reason: 'Resource not found',
                    code: 'NOT_FOUND',
                },
            ];
        }

        if (exception instanceof UnauthorizedException) {
            return [
                {
                    field: 'credentials',
                    reason: 'Invalid credentials or missing authentication',
                    code: 'UNAUTHORIZED',
                },
            ];
        }

        if (exception instanceof ForbiddenException) {
            return [
                {
                    field: 'permissions',
                    reason: 'Insufficient permissions to access this resource',
                    code: 'FORBIDDEN',
                },
            ];
        }

        if (exception instanceof BadRequestException) {
            return [
                {
                    field: extractField(),
                    reason: 'Invalid request data',
                    code: 'BAD_REQUEST',
                },
            ];
        }

        return [
            {
                reason:
                    exception.message || exception.name || 'An error occurred',
                code: exception.name || 'ERROR',
            },
        ];
    }

    private formatValidationErrors(
        errors: ErrorDetailDto[] | string[],
    ): string {
        if (!errors || (Array.isArray(errors) && errors.length === 0))
            return 'Validation failed';
        if (typeof errors[0] === 'string') {
            const msgs = errors as string[];
            return msgs.length === 1
                ? msgs[0]
                : `Validation failed: ${msgs.join('; ')}`;
        }

        const detailMsgs = (errors as ErrorDetailDto[])
            .map((d) =>
                d.field
                    ? `${d.field}: ${d.reason || JSON.stringify(d.constraints)}`
                    : d.reason || JSON.stringify(d.constraints),
            )
            .filter(Boolean);

        return detailMsgs.length === 1
            ? detailMsgs[0]
            : `Validation failed: ${detailMsgs.join('; ')}`;
    }

    private parseValidationArray(items: any[]): ErrorDetailDto[] {
        const results: ErrorDetailDto[] = [];

        items.forEach((it) => {
            if (!it) return;
            if (typeof it === 'string') {
                results.push({ reason: it });
                return;
            }

            if (typeof it === 'object') {
                if (it.property && it.constraints) {
                    const constraints = it.constraints as Record<
                        string,
                        string
                    >;
                    const reason = Object.values(constraints).join('; ');
                    results.push({ field: it.property, reason, constraints });
                    return;
                }

                if (it.field || it.reason) {
                    results.push({
                        field: it.field,
                        reason: it.reason,
                        constraints: it.constraints,
                        code: it.code,
                    });
                    return;
                }

                results.push({ reason: JSON.stringify(it) });
            }
        });

        return results;
    }
}
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Get user-friendly error message
        let message: string;
        if (exception.message) {
            message =
                status === HttpStatus.INTERNAL_SERVER_ERROR
                    ? 'An unexpected error occurred. Please try again later.'
                    : exception.message;
        } else {
            message = 'An unexpected error occurred';
        }

        const baseDetail: ErrorDetailDto = {
            reason:
                exception.message || exception.name || 'InternalServerError',
            code: exception.name || 'InternalServerError',
        };

        if (process.env.MODE === 'DEV') {
            baseDetail.constraints = {
                stack: exception.stack || '',
                originalMessage: exception.message || '',
            } as any;
        }

        const errorDetails: ErrorDetailDto[] = [baseDetail];

        const errorResponse = new ErrorResponseDto(
            message,
            status,
            errorDetails,
            request.url,
        );

        this.logger.error(
            `[${status}] ${request.method} ${request.url} - ${exception.message || 'Unknown error'}`,
            exception.stack || '',
            JSON.stringify({
                statusCode: status,
                path: request.url,
                method: request.method,
                body: request.body,
                query: request.query,
                params: request.params,
                message: exception.message,
            }),
        );

        response.status(status).json(errorResponse);
    }
}
