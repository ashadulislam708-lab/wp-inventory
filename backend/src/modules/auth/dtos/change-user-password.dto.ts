import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeUserPasswordDto {
    @ApiProperty({ example: 'admin123' })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(17)
    currentPassword: string;

    @ApiProperty({ example: 'Admin123123' })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(17)
    newPassword: string;
}
