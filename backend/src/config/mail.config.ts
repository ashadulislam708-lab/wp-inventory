import * as nodemailer from 'nodemailer';
import { envConfigService } from './env-config.service';

export const mailTransporter: nodemailer.Transporter =
    nodemailer.createTransport({
        service: 'gmail',
        host: envConfigService.getMailConfig().MAIL_HOST,
        port: envConfigService.getMailConfig().MAIL_PORT,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: envConfigService.getMailConfig().MAIL_FROM,
            clientId: envConfigService.getMailConfig().GOOGLE_CLIENT_ID,
            clientSecret: envConfigService.getMailConfig().GOOGLE_CLIENT_SECRET,
            refreshToken:
                envConfigService.getMailConfig().GOOGLE_CLIENT_REFRESH_TOKEN,
            accessToken:
                envConfigService.getMailConfig().GOOGLE_CLIENT_ACCESS_TOKEN,
        },
        tls: { rejectUnauthorized: false },
    });

export const mailFrom = envConfigService.getMailConfig().MAIL_FROM;
