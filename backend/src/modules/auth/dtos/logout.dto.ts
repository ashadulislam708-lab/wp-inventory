import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIs...',
        description: 'Refresh token to revoke',
    })
    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}
