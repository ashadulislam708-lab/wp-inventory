import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { envConfigService } from '../../config/env-config.service.js';

/**
 * Guard that verifies WooCommerce webhook HMAC-SHA256 signatures.
 *
 * WooCommerce sends an HMAC-SHA256 signature in the `X-WC-Webhook-Signature` header.
 * The signature is computed as: Base64(HMAC-SHA256(webhook_secret, raw_request_body))
 *
 * This guard:
 * 1. Reads the raw body from `req.rawBody` (requires `rawBody: true` in NestFactory.create)
 * 2. Computes the expected HMAC-SHA256 signature using WC_WEBHOOK_SECRET
 * 3. Compares it with the header value using timing-safe comparison
 * 4. Rejects requests with invalid signatures (403 Forbidden)
 *
 * Apply this guard to all webhook endpoints:
 *   @UseGuards(WcWebhookGuard)
 */
@Injectable()
export class WcWebhookGuard implements CanActivate {
    private readonly logger = new Logger(WcWebhookGuard.name);

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();

        // WooCommerce sends a ping request when creating/saving a webhook to verify the URL.
        // The ping body only contains {"webhook_id":"..."} and may not include an HMAC signature.
        // Detect ping by checking: no signature header AND body has only webhook_id.
        const signature = request.headers['x-wc-webhook-signature'] as string;
        if (!signature) {
            const body = request.body;
            const bodyKeys =
                body && typeof body === 'object' ? Object.keys(body) : [];
            if (bodyKeys.length === 1 && bodyKeys[0] === 'webhook_id') {
                this.logger.log(
                    `WC webhook ping received (webhook_id: ${body.webhook_id}) — allowing through`,
                );
                return true;
            }

            this.logger.warn(
                'WC webhook request rejected: missing X-WC-Webhook-Signature header',
            );
            throw new ForbiddenException('Missing webhook signature');
        }

        const config = envConfigService.getWooCommerceConfig();
        if (!config.WC_WEBHOOK_SECRET) {
            this.logger.error(
                'WC_WEBHOOK_SECRET not configured. Cannot verify webhook signatures.',
            );
            throw new ForbiddenException('Webhook verification not configured');
        }

        // Use rawBody if available (requires rawBody: true in NestFactory.create),
        // otherwise fall back to stringifying the parsed body
        let rawBody: string;
        if (request.rawBody) {
            rawBody =
                request.rawBody instanceof Buffer
                    ? request.rawBody.toString('utf8')
                    : String(request.rawBody);
        } else {
            rawBody =
                typeof request.body === 'string'
                    ? request.body
                    : JSON.stringify(request.body);
            this.logger.warn(
                'rawBody not available on request. Falling back to JSON.stringify(body). ' +
                    'Ensure rawBody: true is set in NestFactory.create() for reliable HMAC verification.',
            );
        }

        const computedSignature = crypto
            .createHmac('sha256', config.WC_WEBHOOK_SECRET)
            .update(rawBody, 'utf8')
            .digest('base64');

        // Use timing-safe comparison to prevent timing attacks
        const signatureBuffer = Buffer.from(signature, 'base64');
        const computedBuffer = Buffer.from(computedSignature, 'base64');

        if (
            signatureBuffer.length !== computedBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, computedBuffer)
        ) {
            this.logger.warn(
                'WC webhook request rejected: invalid HMAC signature',
            );
            throw new ForbiddenException('Invalid webhook signature');
        }

        // Attach the raw body to the request for downstream use
        request.wcRawBody = rawBody;

        return true;
    }
}
