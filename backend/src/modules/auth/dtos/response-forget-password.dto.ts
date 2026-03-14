import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ example: 'OTP sent to your email (expires in 2 minutes)' })
    message: string;

    @ApiProperty({ example: 'admin@example.com' })
    email: string;
}
