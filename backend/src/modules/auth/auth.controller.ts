import {
    Controller,
    Post,
    Body,
    Get,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { Public } from '../../core/decorators/public.decorator.js';
import { CurrentUser } from '../../core/decorators/current-user.decorator.js';
import { LoginDto } from './dtos/login.dto.js';
import { RefreshTokenDto } from './dtos/refresh-token.dto.js';
import { LogoutDto } from './dtos/logout.dto.js';
import type { IJwtPayload } from '../../shared/interfaces/jwt-payload.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }

    @ApiBearerAuth()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body() dto: LogoutDto) {
        return this.authService.logout(dto.refreshToken);
    }

    @ApiBearerAuth()
    @Get('me')
    @HttpCode(HttpStatus.OK)
    async me(@CurrentUser() user: IJwtPayload) {
        return this.authService.getMe(user);
    }
}
