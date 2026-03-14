import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'admin@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'admin123' })
    @IsNotEmpty()
    @IsString()
    password: string;

    @ApiProperty({
        example: false,
        description: 'Keep user logged in for 30 days instead of 1 day',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}
