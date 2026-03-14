import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'New password for the user',
        example: 'NewPassword123!',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(17)
    newPassword: string;

    @ApiProperty({
        description: 'Confirm new password - must match newPassword',
        example: 'NewPassword123!',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    @MaxLength(17)
    confirmNewPassword: string;
}
