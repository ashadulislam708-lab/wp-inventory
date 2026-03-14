import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IJwtPayload } from '@shared/interfaces';

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        // TODO IF NEED
    }

    getAccessToken(payload: IJwtPayload, rememberMe?: boolean) {
        const expiresIn = rememberMe
            ? this.configService.get<string>(
                  'AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME',
              )
            : this.configService.get<string>('AUTH_TOKEN_EXPIRED_TIME');

        const expiresInNumber = Number(expiresIn);

        // Log only in development mode
        if (process.env.MODE === 'DEV') {
            console.log(
                '[TokenService] getAccessToken - expiresIn:',
                expiresIn,
                'parsed:',
                expiresInNumber,
                'isNaN:',
                isNaN(expiresInNumber),
            );
        }

        if (isNaN(expiresInNumber)) {
            throw new Error(
                `Invalid JWT expiry time: ${expiresIn}. Check your .env file.`,
            );
        }

        return this.jwtService.sign(payload, {
            expiresIn: expiresInNumber,
        });
    }

    getRefreshToken(payload: IJwtPayload) {
        const refreshExpiresIn = this.configService.get<string>(
            'AUTH_REFRESH_TOKEN_EXPIRED_TIME',
        );
        const refreshExpiresInNumber = Number(refreshExpiresIn);

        // Log only in development mode
        if (process.env.MODE === 'DEV') {
            console.log(
                '[TokenService] getRefreshToken - refreshExpiresIn:',
                refreshExpiresIn,
                'parsed:',
                refreshExpiresInNumber,
                'isNaN:',
                isNaN(refreshExpiresInNumber),
            );
        }

        if (isNaN(refreshExpiresInNumber)) {
            throw new Error(
                `Invalid JWT refresh expiry time: ${refreshExpiresIn}. Check your .env file.`,
            );
        }

        return this.jwtService.sign(payload, {
            expiresIn: refreshExpiresInNumber,
        });
    }

    decodeToken(token: string) {
        const user: { id: number; name: string } =
            this.jwtService.decode(token);
        return user;
    }

    verifyToken(token: string): boolean {
        try {
            this.jwtService.verify(token);
            return true;
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token has expired');
            } else {
                throw new UnauthorizedException('Invalid token');
            }
        }
    }
}
