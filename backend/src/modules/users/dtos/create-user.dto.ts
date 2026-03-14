import {
    IsEmail,
    IsString,
    MinLength,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolesEnum } from 'src/shared/enums';

export class CreateUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
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

    @ApiPropertyOptional({
        description: 'User first name',
        example: 'John',
    })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiPropertyOptional({
        description: 'User last name',
        example: 'Doe',
    })
    @IsOptional()
    @IsString()
    lastName?: string;

    @ApiPropertyOptional({
        description: 'User role',
        enum: RolesEnum,
        example: RolesEnum.USER,
        default: RolesEnum.USER,
    })
    @IsOptional()
    @IsEnum(RolesEnum)
    role?: RolesEnum;
}
