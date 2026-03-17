import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIs...',
        description: 'Refresh token to exchange for new token pair',
    })
    @IsNotEmpty()
    @IsString()
    refreshToken: string;
}
