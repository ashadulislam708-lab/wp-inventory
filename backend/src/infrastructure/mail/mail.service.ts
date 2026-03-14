import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import { mailFrom, mailTransporter } from 'src/config/mail.config';
import { EmailOptions } from 'src/shared/dtos';
import {
    getRegistrationOtpEmailTemplate,
    getResetPasswordEmailTemplate,
} from 'src/shared/templates';

@Injectable()
export class MailService implements OnModuleInit {
    private transporter: Transporter = mailTransporter;

    constructor(private readonly logger: Logger) {}

    onModuleInit() {
        void this.verifyConnection();
    }

    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            this.logger.error(error);
            throw new Error(`Mail server connection failed: ${error.message}`);
        }
    }

    async sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: mailFrom,
                to,
                subject,
                html,
            });

            // Use proper logger instead of console.log (works in both DEV and PROD)
            this.logger.log(
                `Email sent successfully: ${info.messageId} to ${to}`,
            );
        } catch (error) {
            this.logger.error(error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async sendRegistrationOtpEmail(email: string, otp: number): Promise<void> {
        try {
            const emailContent = getRegistrationOtpEmailTemplate(otp);
            await this.sendEmail({
                to: email,
                subject: 'Verify Your Email Address',
                html: emailContent,
            });
        } catch (error) {
            this.logger.error(error);
            throw new Error(
                `Failed to send registration OTP email: ${error.message}`,
            );
        }
    }

    async sendResetPasswordEmail(email: string, otp: number): Promise<void> {
        try {
            const emailContent = getResetPasswordEmailTemplate(otp);
            await this.sendEmail({
                to: email,
                subject: 'Reset Your Password',
                html: emailContent,
            });
        } catch (error) {
            this.logger.error(error);
            throw new Error(
                `Failed to send reset password email: ${error.message}`,
            );
        }
    }
}
