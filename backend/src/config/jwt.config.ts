import { envConfigService } from './env-config.service';

export default () => ({
    authJwtSecret: envConfigService.getAuthJWTConfig().AUTH_JWT_SECRET,

    authTokenCookieName:
        envConfigService.getAuthJWTConfig().AUTH_TOKEN_COOKIE_NAME,
    authTokenExpiredTime:
        envConfigService.getAuthJWTConfig().AUTH_TOKEN_EXPIRED_TIME, // 1 day
    authTokenExpiredTimeRememberMe:
        envConfigService.getAuthJWTConfig().AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME, // 30 days
    authRefreshTokenCookieName:
        envConfigService.getAuthJWTConfig().AUTH_REFRESH_TOKEN_COOKIE_NAME,
    authRefreshTokenExpiredTime:
        envConfigService.getAuthJWTConfig().AUTH_REFRESH_TOKEN_EXPIRED_TIME,

    isLive: false,
});
