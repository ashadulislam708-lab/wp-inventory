import { applyDecorators, Type } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
    ApiCookieAuth,
    ApiExtraModels,
    getSchemaPath,
} from '@nestjs/swagger';
import { ResponsePayloadDto, ErrorDetailDto } from '@shared/dtos';
import { ApiResponseData } from './api-response-data.decorator';

export interface ErrorResponseConfig {
    status: number;
    description?: string;
}

export type ApiOperationType =
    | 'create'
    | 'getAll'
    | 'getOne'
    | 'update'
    | 'delete'
    | 'search'
    | 'count'
    | 'custom';

export interface ApiSwaggerOptions {
    /** Resource name (e.g., 'User', 'Product') */
    resourceName: string;
    /** Request body DTO */
    requestDto?: Type<any>;
    /** Response data DTO (used in ResponsePayloadDto.data) */
    responseDto?: Type<any>;
    /** HTTP success status code (default: 200) */
    successStatus?: number;
    /** If true, response data is an array */
    isArray?: boolean;
    /** Whether endpoint requires bearer auth (default: true) */
    requiresAuth?: boolean;
    /** Array of error responses to document */
    errors?: ErrorResponseConfig[];
    /** Operation type for auto-generating summary and common errors */
    operation?: ApiOperationType;
    /** Custom operation summary (overrides auto-generated) */
    summary?: string;
    /** ID parameter name for getOne/update/delete (default: 'id') */
    paramName?: string;
    /** Add pagination query params for getAll (default: false) */
    withPagination?: boolean;
}

export function ApiSwagger(
    options: ApiSwaggerOptions | string,
    requestDto?: Type<any>,
    responseDto?: Type<any>,
    successStatus = 200,
    isArray = false,
    requiresAuth = true,
    errors?: ErrorResponseConfig[],
) {
    let config: ApiSwaggerOptions;

    if (typeof options === 'string') {
        config = {
            resourceName: options,
            requestDto,
            responseDto,
            successStatus,
            isArray,
            requiresAuth,
            errors,
            operation: 'custom',
        };
    } else {
        config = {
            successStatus: 200,
            isArray: false,
            requiresAuth: true,
            withPagination: false,
            paramName: 'id',
            operation: 'custom',
            ...options,
        };
    }
    const decorators: Array<
        ClassDecorator | MethodDecorator | PropertyDecorator
    > = [];

    decorators.push(ApiExtraModels(ResponsePayloadDto, ErrorDetailDto));

    let summary = config.summary;
    if (!summary && config.operation) {
        const resourceLower = config.resourceName.toLowerCase();
        switch (config.operation) {
            case 'create':
                summary = `Create a new ${resourceLower}`;
                break;
            case 'getAll':
                summary = `Get all ${resourceLower}`;
                break;
            case 'getOne':
                summary = `Get ${resourceLower} by ${config.paramName}`;
                break;
            case 'update':
                summary = `Update ${resourceLower}`;
                break;
            case 'delete':
                summary = `Delete ${resourceLower}`;
                break;
            case 'search':
                summary = `Search ${resourceLower}`;
                break;
            case 'count':
                summary = `Count ${resourceLower}`;
                break;
            default:
                summary = config.resourceName;
        }
    }

    decorators.push(ApiOperation({ summary }));

    if (
        config.operation &&
        ['getOne', 'update', 'delete'].includes(config.operation)
    ) {
        const ApiParam = require('@nestjs/swagger').ApiParam;
        decorators.push(
            ApiParam({
                name: config.paramName,
                type: String,
                format: 'uuid',
                description: `${config.resourceName} ${config.paramName}`,
            }),
        );
    }

    if (config.operation === 'getAll' && config.withPagination) {
        const ApiQuery = require('@nestjs/swagger').ApiQuery;
        decorators.push(
            ApiQuery({
                name: 'page',
                required: false,
                type: Number,
                example: 1,
                description: 'Page number',
            }),
            ApiQuery({
                name: 'limit',
                required: false,
                type: Number,
                example: 10,
                description: 'Items per page',
            }),
            ApiQuery({
                name: 'search',
                required: false,
                type: String,
                description: 'Search query',
            }),
            ApiQuery({
                name: 'sortBy',
                required: false,
                type: String,
                example: 'createdAt',
                description: 'Sort by field',
            }),
            ApiQuery({
                name: 'sortOrder',
                required: false,
                enum: ['ASC', 'DESC'],
                example: 'DESC',
                description: 'Sort order',
            }),
        );
    }

    if (config.requiresAuth) {
        decorators.push(ApiBearerAuth());
        decorators.push(ApiCookieAuth('accessToken'));
        decorators.push(
            ApiResponse({
                status: 401,
                description:
                    'Unauthorized - Invalid or missing authentication token',
                schema: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        statusCode: { type: 'number', example: 401 },
                        message: {
                            type: 'string',
                            example:
                                'Unauthorized - Invalid or missing authentication token',
                        },
                        data: { type: 'null', nullable: true, example: null },
                        error: {
                            type: 'array',
                            items: { $ref: getSchemaPath(ErrorDetailDto) },
                            example: [
                                {
                                    field: 'authorization',
                                    reason: 'Invalid or missing authentication token',
                                    code: 'UNAUTHORIZED',
                                },
                            ],
                        },
                        timestamp: {
                            type: 'string',
                            example: '2024-11-02T10:30:00.000Z',
                        },
                        path: { type: 'string', example: '/api/v1/users' },
                    },
                },
            }),
        );
    }

    if (config.requestDto) {
        decorators.push(ApiBody({ type: config.requestDto }));
    }

    if (config.responseDto) {
        decorators.push(
            ApiResponseData(
                config.responseDto,
                config.successStatus,
                config.isArray,
            ) as any,
        );
    } else {
        decorators.push(
            ApiResponse({
                status: config.successStatus,
                description: 'Successful response',
                schema: { $ref: getSchemaPath(ResponsePayloadDto) },
            }),
        );
    }

    const autoErrors: ErrorResponseConfig[] = [];

    if (config.operation === 'create') {
        autoErrors.push(
            { status: 400, description: 'Validation failed' },
            {
                status: 409,
                description: `${config.resourceName} already exists`,
            },
        );
    } else if (
        config.operation === 'getOne' ||
        config.operation === 'update' ||
        config.operation === 'delete'
    ) {
        autoErrors.push({
            status: 404,
            description: `${config.resourceName} not found`,
        });
        if (config.operation === 'update') {
            autoErrors.push(
                { status: 400, description: 'Validation failed' },
                {
                    status: 409,
                    description:
                        'Conflict - Resource already exists with given data',
                },
            );
        }
    }

    const allErrors = [...autoErrors, ...(config.errors || [])];
    const uniqueErrors = Array.from(
        new Map(allErrors.map((e) => [e.status, e])).values(),
    );

    if (uniqueErrors.length > 0) {
        uniqueErrors.forEach((error) => {
            const defaultDescriptions: Record<number, string> = {
                400: 'Bad request or validation failed',
                404: `${config.resourceName} not found`,
                409: `${config.resourceName} already exists`,
                500: 'Internal server error',
            };

            const description =
                error.description ||
                defaultDescriptions[error.status] ||
                `Error ${error.status}`;

            let exampleError: any[];
            if (error.status === 400) {
                exampleError = [
                    {
                        field: 'email',
                        reason: 'Invalid email format',
                        constraints: { isEmail: 'email must be an email' },
                        code: 'VALIDATION_ERROR',
                    },
                ];
            } else if (error.status === 404) {
                exampleError = [
                    {
                        reason: description,
                        code: 'NOT_FOUND',
                    },
                ];
            } else if (error.status === 409) {
                exampleError = [
                    {
                        field: 'email',
                        reason: description,
                        code: 'CONFLICT',
                    },
                ];
            } else {
                exampleError = [
                    {
                        reason: description,
                        code: `ERROR_${error.status}`,
                    },
                ];
            }

            decorators.push(
                ApiResponse({
                    status: error.status,
                    description,
                    schema: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            statusCode: {
                                type: 'number',
                                example: error.status,
                            },
                            message: { type: 'string', example: description },
                            data: {
                                type: 'null',
                                nullable: true,
                                example: null,
                            },
                            error: {
                                type: 'array',
                                items: { $ref: getSchemaPath(ErrorDetailDto) },
                                example: exampleError,
                            },
                            timestamp: {
                                type: 'string',
                                example: '2024-11-02T10:30:00.000Z',
                            },
                            path: {
                                type: 'string',
                                example: `/api/v1/${config.resourceName.toLowerCase()}s`,
                            },
                        },
                    },
                }),
            );
        });
    }

    return applyDecorators(...decorators);
}
