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
        return this.getValue('PORT', true);
    }

    public isProduction(): boolean {
        const mode = this.getValue('MODE', false);
        return mode !== 'DEV';
    }

    public getFrontendUrl(): string {
        return this.getValue('FRONTEND_URL');
    }

    public getOrigins(): string[] {
        try {
            return this.getValue('ALLOW_ORIGINS')
                .split(',')
                .map((origin) => origin.trim());
        } catch {
            return [];
        }
    }

    public getTypeOrmConfig() {
        return {
            host: this.getValue('POSTGRES_HOST'),
            port: parseInt(this.getValue('POSTGRES_PORT')),
            username: this.getValue('POSTGRES_USER'),
            password: this.getValue('POSTGRES_PASSWORD'),
            database: this.getValue('POSTGRES_DATABASE'),

            nize: false,
        };
    }

    public getAwsConfig() {
        return {
            AWS_REGION: this.getValue('AWS_REGION'),
            AWS_ACCESS_KEY_ID: this.getValue('AWS_ACCESS_KEY_ID'),
            AWS_SECRET_ACCESS_KEY: this.getValue('AWS_SECRET_ACCESS_KEY'),
            AWS_S3_BUCKET: this.getValue('AWS_S3_BUCKET'),
        };
    }

    public getMailConfig() {
        return {
            MAIL_HOST: this.getValue('MAIL_HOST', false) || 'smtp.gmail.com',
            MAIL_PORT: parseInt(this.getValue('MAIL_PORT', false)) || 465,
            MAIL_FROM: this.getValue('MAIL_FROM', false) || 'demo@example.com',
            GOOGLE_CLIENT_ID:
                this.getValue('GOOGLE_CLIENT_ID', false) || 'demo-id',
            GOOGLE_CLIENT_SECRET:
                this.getValue('GOOGLE_CLIENT_SECRET', false) || 'demo-secret',
            GOOGLE_CLIENT_REFRESH_TOKEN:
                this.getValue('GOOGLE_CLIENT_REFRESH_TOKEN', false) ||
                'demo-refresh-token',
            GOOGLE_CLIENT_ACCESS_TOKEN:
                this.getValue('GOOGLE_CLIENT_ACCESS_TOKEN', false) ||
                'demo-access-token',
        };
    }

    public getAppleConfig() {
        return {
            APPLE_TEAM_ID: this.getValue('APPLE_TEAM_ID'),
            APPLE_CLIENT_ID: this.getValue('APPLE_CLIENT_ID'),
            APPLE_KEY_ID: this.getValue('APPLE_KEY_ID'),
            APPLE_PRIVATE_KEY: this.getValue('APPLE_PRIVATE_KEY').replace(
                /\\n/g,
                '\n',
            ),
        };
    }

    public getTossConfig() {
        return {
            TOSS_CLIENT_KEY:
                this.getValue('TOSS_CLIENT_KEY', false) || 'test_client_key',
            TOSS_SECRET_KEY:
                this.getValue('TOSS_SECRET_KEY', false) || 'test_secret_key',
            TOSS_API_URL:
                this.getValue('TOSS_API_URL', false) ||
                'https://api.tosspayments.com',
        };
    }

    public getPushNotificationConfig() {
        return {
            PROJECT_ID: this.getValue('PROJECT_ID'),
            PRIVATE_KEY_ID: this.getValue('PRIVATE_KEY_ID'),
            PRIVATE_KEY: this.getValue('PRIVATE_KEY'),
            CLIENT_EMAIL: this.getValue('CLIENT_EMAIL'),
        };
    }

    public getAuthJWTConfig() {
        return {
            AUTH_JWT_SECRET: this.getValue('AUTH_JWT_SECRET'),
            AUTH_TOKEN_COOKIE_NAME: this.getValue('AUTH_TOKEN_COOKIE_NAME'),
            AUTH_TOKEN_EXPIRED_TIME: this.getValue('AUTH_TOKEN_EXPIRED_TIME'),
            AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME: this.getValue(
                'AUTH_TOKEN_EXPIRED_TIME_REMEMBER_ME',
            ),
            AUTH_REFRESH_TOKEN_COOKIE_NAME: this.getValue(
                'AUTH_REFRESH_TOKEN_COOKIE_NAME',
            ),
            AUTH_REFRESH_TOKEN_EXPIRED_TIME: this.getValue(
                'AUTH_REFRESH_TOKEN_EXPIRED_TIME',
            ),
        };
    }
}

const envConfigService = new EnvConfigService(process.env).ensureValues([
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE',
    'ALLOW_ORIGINS',
    'MODE',
    'FRONTEND_URL',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'APPLE_TEAM_ID',
    'APPLE_CLIENT_ID',
    'APPLE_KEY_ID',
    'APPLE_PRIVATE_KEY',

    'PROJECT_ID',
    'PRIVATE_KEY_ID',
    'PRIVATE_KEY',
    'CLIENT_EMAIL',
]);

export { envConfigService };
