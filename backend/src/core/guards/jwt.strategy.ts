import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { envConfigService } from '../../config/env-config.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                JwtStrategy.extractJWTFromCookie,
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: envConfigService.getAuthJWTConfig().AUTH_JWT_SECRET,
        });
    }

    private static extractJWTFromCookie(
        this: void,
        req: Request,
    ): string | null {
        const cookieName =
            envConfigService.getAuthJWTConfig().AUTH_TOKEN_COOKIE_NAME ||
            'accessToken';
        if (req.cookies && req.cookies[cookieName]) {
            return req.cookies[cookieName];
        }
        return null;
    }

    validate(payload: any) {
        if (!payload.id || !payload.email) {
            throw new UnauthorizedException('Invalid token payload');
        }

        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            firstName: payload.firstName,
            lastName: payload.lastName,
        };
    }
}
