import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppleLoginDto {
    @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
    @IsNotEmpty()
    @IsString()
    id_token: string;

    @ApiProperty({
        example:
            '{"email":"user@privaterelay.appleid.com","firstName":"John","lastName":"Doe"}',
        description: 'User data from Apple (only provided on first sign-in)',
    })
    @IsOptional()
    @IsString()
    user?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    nonce: string;

    @ApiProperty({
        example: false,
        description: 'Keep user logged in for 30 days instead of 1 day',
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    termsAndConditionsAccepted?: boolean;
}
