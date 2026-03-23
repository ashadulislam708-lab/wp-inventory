import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'New password for the user (minimum 8 characters)',
        example: 'NewSecurePassword123!',
        minLength: 8,
    })
    @IsString()
    @MinLength(8)
    newPassword: string;
}
