import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolesEnum } from '..';

export class ErrorDetailDto {
    @ApiProperty({
        example: 'email',
        description: 'Field name related to the error (if applicable)',
    })
    field?: string;

    @ApiProperty({
        example: 'Invalid format',
        description: 'Human readable reason / message for the error',
    })
    reason?: string;

    @ApiPropertyOptional({
        example: { minLength: 'Must be at least 8 characters' },
        description:
            'Optional object containing constraint keys and messages (useful for validation libraries)',
    })
    constraints?: Record<string, string>;

    @ApiPropertyOptional({
        example: 'INVALID_EMAIL',
        description: 'Optional machine-friendly error code',
    })
    code?: string;
}

export class ResponsePayloadDto<T = unknown> {
    @ApiProperty({
        example: true,
        description: 'Indicates if the request was successful',
    })
    success: boolean;

    @ApiProperty({
        example: 200,
        description: 'HTTP status code',
    })
    statusCode: number;

    @ApiProperty({
        example: 'Operation completed successfully',
        description: 'Response message',
    })
    message: string;

    @ApiPropertyOptional({
        description: 'Response data (can be any type)',
    })
    data?: T;

    @ApiPropertyOptional({
        example: [
            {
                field: 'email',
                reason: 'Invalid format',
                constraints: { minLength: 'Must be at least 8 characters' },
            },
        ],
        description:
            'Array of error details (only present on error responses). Always an array of ErrorDetailDto.',
        type: [ErrorDetailDto],
    })
    error?: ErrorDetailDto[];

    @ApiPropertyOptional({
        example: '2024-11-02T10:30:00.000Z',
        description: 'Timestamp of the response',
    })
    timestamp?: string;

    @ApiPropertyOptional({
        example: '/api/v1/products',
        description: 'Request path',
    })
    path?: string;

    constructor(partial: Partial<ResponsePayloadDto<T>>) {
        Object.assign(this, partial);
        this.timestamp = this.timestamp || new Date().toISOString();
    }
}

/**
 * Login Response Payload DTO
 */
export class LoginResponsePayloadDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1...' })
    token?: string;

    @ApiProperty({ example: 'eyJhbGciOiJSZWZyZXNoVG9rZW4...' })
    refreshToken?: string;

    @ApiProperty({
        example: {
            id: 'uuid',
            fullName: 'John Doe',
            email: 'john@example.com',
            role: 'MEMBER',
            isActive: true,
        },
        required: false,
    })
    user?: {
        id: string;
        fullName: string;
        email: string;
        role: RolesEnum;
        isActive: boolean;
    };
}

/**
 * Success Response Helper
 */
export class SuccessResponseDto<T = unknown> extends ResponsePayloadDto<T> {
    constructor(
        data: T,
        message: string = 'Success',
        statusCode: number = 200,
    ) {
        super({
            success: true,
            statusCode,
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Error Response Helper
 */
export class ErrorResponseDto extends ResponsePayloadDto {
    constructor(
        message: string,
        statusCode: number = 500,
        error?: ErrorDetailDto[],
        path?: string,
    ) {
        super({
            success: false,
            statusCode,
            message,
            error,
            path,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Pagination Metadata
 */
export class PaginationMetaDto {
    @ApiProperty({
        example: 1,
        description: 'Current page number',
    })
    page: number;

    @ApiProperty({
        example: 10,
        description: 'Number of items per page',
    })
    limit: number;

    @ApiProperty({
        example: 100,
        description: 'Total number of items',
    })
    total: number;

    @ApiProperty({
        example: 10,
        description: 'Total number of pages',
    })
    totalPages: number;

    @ApiProperty({
        example: true,
        description: 'Whether there is a next page',
    })
    hasNextPage: boolean;

    @ApiProperty({
        example: false,
        description: 'Whether there is a previous page',
    })
    hasPreviousPage: boolean;

    constructor(page: number, limit: number, total: number) {
        this.page = page;
        this.limit = limit;
        this.total = total;
        this.totalPages = Math.ceil(total / limit);
        this.hasNextPage = page < this.totalPages;
        this.hasPreviousPage = page > 1;
    }
}

/**
 * Paginated Response DTO
 * Use this for paginated list endpoints
 */
export class PaginatedResponseDto<T = unknown> extends ResponsePayloadDto<T[]> {
    @ApiProperty({
        description: 'Pagination metadata',
    })
    meta: PaginationMetaDto;

    constructor(
        data: T[],
        page: number,
        limit: number,
        total: number,
        message: string = 'Data retrieved successfully',
    ) {
        super({
            success: true,
            statusCode: 200,
            message,
            data,
            timestamp: new Date().toISOString(),
        });
        this.meta = new PaginationMetaDto(page, limit, total);
    }
}

/**
 * Created Response Helper (201)
 */
export class CreatedResponseDto<T = unknown> extends ResponsePayloadDto<T> {
    constructor(data: T, message: string = 'Resource created successfully') {
        super({
            success: true,
            statusCode: 201,
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * No Content Response Helper (204)
 */
export class NoContentResponseDto extends ResponsePayloadDto {
    constructor(message: string = 'Operation completed successfully') {
        super({
            success: true,
            statusCode: 204,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Deleted Response Helper
 */
export class DeletedResponseDto extends ResponsePayloadDto {
    constructor(message: string = 'Resource deleted successfully') {
        super({
            success: true,
            statusCode: 200,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Updated Response Helper
 */
export class UpdatedResponseDto<T = unknown> extends ResponsePayloadDto<T> {
    constructor(data: T, message: string = 'Resource updated successfully') {
        super({
            success: true,
            statusCode: 200,
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * OTP Send Response DTO
 */
export class OtpResponsePayloadDto extends ResponsePayloadDto<{
    expiresAt: Date;
}> {
    @ApiProperty({
        example: '2023-12-31T23:59:59.999Z',
        description: 'OTP expiration time',
        required: false,
    })
    expiresAt: Date;

    constructor(
        otpSent: boolean,
        expiresAt: Date,
        message: string = 'OTP sent successfully',
    ) {
        super({
            success: true,
            statusCode: 200,
            message,
            data: { expiresAt },
            timestamp: new Date().toISOString(),
        });
        this.expiresAt = expiresAt;
    }
}

/**
 * OTP Verification Response DTO
 */
export class OtpVerifyResponseDto extends ResponsePayloadDto<{
    valid: boolean;
}> {
    @ApiProperty({
        example: true,
        required: false,
        description: 'Indicates if the OTP is valid',
    })
    isValid?: boolean;

    constructor(
        valid: boolean,
        message: string = 'OTP verification successful',
    ) {
        super({
            success: true,
            statusCode: 200,
            message,
            data: { valid },
            timestamp: new Date().toISOString(),
        });
        this.isValid = valid;
    }
}
