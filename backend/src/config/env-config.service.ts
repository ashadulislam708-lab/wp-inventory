import dotenv from 'dotenv';
dotenv.config();

class EnvConfigService {
    constructor(private env: { [k: string]: string | undefined }) {}

    getValue(key: string, throwOnMissing = true): string {
        const value = this.env[key];
        if (!value && throwOnMissing) {
            throw new Error(`config error - missing env.${key}`);
        }
        return value as string;
    }

    public ensureValues(keys: string[]) {
        keys.forEach((k) => this.getValue(k, true));
        return this;
    }

    public getPort(): string {
        return this.getValue('PORT', false) || '8040';
    }

    public isProduction(): boolean {
        const mode = this.getValue('MODE', false);
        return mode === 'PROD';
    }

    public getFrontendUrl(): string {
        return this.getValue('FRONTEND_URL', false) || 'http://localhost:8041';
    }

    public getOrigins(): string[] {
        const frontendUrl = this.getFrontendUrl();
        try {
            const allowOrigins = this.getValue('ALLOW_ORIGINS', false);
            if (allowOrigins) {
                return allowOrigins.split(',').map((origin) => origin.trim());
            }
        } catch {
            // fallback
        }
        return [frontendUrl, 'http://localhost:8041'];
    }

    public getTypeOrmConfig() {
        // Support DATABASE_URL or individual vars
        const databaseUrl = this.getValue('DATABASE_URL', false);
        if (databaseUrl) {
            const url = new URL(databaseUrl);
            return {
                host: url.hostname,
                port: parseInt(url.port || '5432'),
                username: url.username,
                password: url.password,
                database: url.pathname.slice(1),
            };
        }

        return {
            host: this.getValue('POSTGRES_HOST', false) || 'localhost',
            port: parseInt(this.getValue('POSTGRES_PORT', false) || '5432'),
            username: this.getValue('POSTGRES_USER', false) || 'postgres',
            password: this.getValue('POSTGRES_PASSWORD', false) || 'postgres',
            database:
                this.getValue('POSTGRES_DATABASE', false) || 'glam_lavish',
        };
    }

    public getAuthJWTConfig() {
        return {
            AUTH_JWT_SECRET:
                this.getValue('AUTH_JWT_SECRET', false) ||
                'fallback-secret-min-32-chars-long-glam-lavish',
            AUTH_TOKEN_COOKIE_NAME:
                this.getValue('AUTH_TOKEN_COOKIE_NAME', false) || 'accessToken',
            AUTH_TOKEN_EXPIRED_TIME:
                this.getValue('AUTH_TOKEN_EXPIRE_TIME', false) || '1h',
            AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME:
                this.getValue('AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME', false) ||
                '30d',
            AUTH_REFRESH_TOKEN_COOKIE_NAME:
                this.getValue('AUTH_REFRESH_TOKEN_COOKIE_NAME', false) ||
                'refreshToken',
            AUTH_REFRESH_TOKEN_EXPIRED_TIME:
                this.getValue('AUTH_REFRESH_TOKEN_EXPIRE_TIME', false) || '7d',
        };
    }

    public getWooCommerceConfig() {
        return {
            WC_URL: this.getValue('WC_URL', false) || '',
            WC_CONSUMER_KEY: this.getValue('WC_CONSUMER_KEY', false) || '',
            WC_CONSUMER_SECRET:
                this.getValue('WC_CONSUMER_SECRET', false) || '',
            WC_WEBHOOK_SECRET: this.getValue('WC_WEBHOOK_SECRET', false) || '',
        };
    }

    public getSteadfastConfig() {
        return {
            STEADFAST_API_KEY: this.getValue('STEADFAST_API_KEY', false) || '',
            STEADFAST_SECRET_KEY:
                this.getValue('STEADFAST_SECRET_KEY', false) || '',
            STEADFAST_BASE_URL: 'https://portal.packzy.com/api/v1',
        };
    }

    /**
     * Pathao courier config (Phase 6 scaffold)
     * Required env vars will be needed when Pathao integration is implemented.
     */
    public getPathaoConfig() {
        const isProduction = this.isProduction();
        return {
            PATHAO_CLIENT_ID: this.getValue('PATHAO_CLIENT_ID', false) || '',
            PATHAO_CLIENT_SECRET:
                this.getValue('PATHAO_CLIENT_SECRET', false) || '',
            PATHAO_CLIENT_EMAIL:
                this.getValue('PATHAO_CLIENT_EMAIL', false) || '',
            PATHAO_CLIENT_PASSWORD:
                this.getValue('PATHAO_CLIENT_PASSWORD', false) || '',
            PATHAO_BASE_URL: isProduction
                ? 'https://api-hermes.pathao.com'
                : 'https://hermes-api.p-stageenv.xyz',
        };
    }
}

const envConfigService = new EnvConfigService(process.env);

export { envConfigService };
