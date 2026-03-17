import { ApiProperty } from '@nestjs/swagger';
import { UserRoleEnum } from '../../../shared/enums/user-role.enum.js';

export class UserResponseDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'User unique identifier (UUID)',
    })
    id: string;

    @ApiProperty({
        example: 'admin@glamlavish.com',
        description: 'User email address',
    })
    email: string;

    @ApiProperty({
        example: 'Admin User',
        description: 'User display name',
    })
    name: string;

    @ApiProperty({
        enum: UserRoleEnum,
        example: UserRoleEnum.ADMIN,
        description: 'User role',
    })
    role: UserRoleEnum;

    @ApiProperty({
        example: true,
        description: 'Whether user account is active',
    })
    isActive: boolean;

    @ApiProperty({
        example: '2026-03-15T10:30:00.000Z',
        description: 'Record creation timestamp',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2026-03-15T10:30:00.000Z',
        description: 'Record last update timestamp',
    })
    updatedAt: Date;
}
