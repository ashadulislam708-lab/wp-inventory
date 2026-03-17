import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRoleEnum } from '../../../shared/enums/user-role.enum.js';

export class CreateUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'admin@glamlavish.com',
        format: 'email',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'User password (minimum 8 characters)',
        example: 'SecurePassword123!',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({
        description: 'User display name',
        example: 'Admin User',
    })
    @IsString()
    name: string;

    @ApiPropertyOptional({
        description: 'User role',
        enum: UserRoleEnum,
        example: UserRoleEnum.STAFF,
        default: UserRoleEnum.STAFF,
    })
    @IsOptional()
    @IsEnum(UserRoleEnum)
    role?: UserRoleEnum;
}
