import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
    @ApiProperty({
        example: 'admin@glamlavish.com',
        description: 'User email address',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'SecurePassword123!',
        description: 'User password',
    })
    @IsNotEmpty()
    @IsString()
    password: string;
}
