import {
    Body,
    Controller,
    Post,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OtpResponsePayloadDto, OtpVerifyResponseDto } from 'src/shared/dtos';
import { SendOtpDto } from './dtos/send.dto';
import { VerityOtpDto } from './dtos/verify.dto';
import { OtpService } from './otp.service';
import { ApiSwagger } from '@core/decorators';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
    constructor(private otpService: OtpService) {}

    @Post('send')
    @UsePipes(ValidationPipe)
    @ApiSwagger({
        resourceName: 'OTP Send',
        operation: 'custom',
        summary: 'Send OTP to email',
        responseDto: OtpResponsePayloadDto,
        requestDto: SendOtpDto,
        requiresAuth: false,
        errors: [
            { status: 400, description: 'Invalid email format' },
            { status: 429, description: 'Too many requests' },
            { status: 500, description: 'Failed to send OTP' },
        ],
    })
    async send(@Body() dto: SendOtpDto): Promise<OtpResponsePayloadDto> {
        return await this.otpService.send(dto);
    }

    @Post('verify')
    @UsePipes(ValidationPipe)
    @ApiSwagger({
        resourceName: 'OTP Verify',
        operation: 'custom',
        summary: 'Verify OTP code',
        responseDto: OtpVerifyResponseDto,
        requestDto: VerityOtpDto,
        requiresAuth: false,
        errors: [
            { status: 400, description: 'Invalid or expired OTP' },
            { status: 404, description: 'OTP not found' },
        ],
    })
    async verify(@Body() dto: VerityOtpDto): Promise<OtpVerifyResponseDto> {
        return await this.otpService.verify(dto);
    }
}
