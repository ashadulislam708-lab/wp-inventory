import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    RolesEnum,
    ActiveStatusEnum,
    SocialLoginTypeEnum,
} from '@shared/enums';

export class UserResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'User unique identifier (UUID)',
    })
    id: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    email: string;

    @ApiPropertyOptional({
        example: 'John',
        description: 'User first name',
    })
    firstName?: string;

    @ApiPropertyOptional({
        example: 'Doe',
        description: 'User last name',
    })
    lastName?: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'User full name',
    })
    fullName: string;

    @ApiProperty({
        enum: RolesEnum,
        example: RolesEnum.USER,
        description: 'User role',
    })
    role: RolesEnum;

    @ApiProperty({
        enum: ActiveStatusEnum,
        example: ActiveStatusEnum.ACTIVE,
        description: 'User active status',
    })
    isActive: ActiveStatusEnum;

    @ApiProperty({
        example: false,
        description: 'Whether user email is verified',
    })
    emailVerified: boolean;

    @ApiPropertyOptional({
        enum: SocialLoginTypeEnum,
        example: SocialLoginTypeEnum.GOOGLE,
        description: 'Social login provider type',
    })
    socialLoginType?: SocialLoginTypeEnum;

    @ApiProperty({
        example: false,
        description: 'Whether user account is verified',
    })
    isVerified: boolean;

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.jpg',
        description: 'User profile image URL',
    })
    image?: string | null;

    @ApiPropertyOptional({
        example: false,
        description: 'Remember me preference',
    })
    rememberMe?: boolean;

    @ApiProperty({
        example: '2024-11-02T10:30:00.000Z',
        description: 'Record creation timestamp',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2024-11-02T10:30:00.000Z',
        description: 'Record last update timestamp',
    })
    updatedAt: Date;

    @ApiPropertyOptional({
        example: null,
        description: 'Record deletion timestamp (soft delete)',
    })
    deletedAt?: Date | null;
}
