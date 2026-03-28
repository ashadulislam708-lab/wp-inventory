import {
    Controller,
    Post,
    Req,
    HttpCode,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/decorators/public.decorator.js';
import { OrderService } from '../services/order.service.js';

@ApiTags('Steadfast Webhook')
@Controller('steadfast')
export class SteadfastWebhookController {
    private readonly logger = new Logger(SteadfastWebhookController.name);

    constructor(private readonly orderService: OrderService) {}

    @Public()
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Req() req: any) {
        const body = req.body;

        this.logger.log(
            `Steadfast webhook received: type=${body.notification_type}, consignment_id=${body.consignment_id}, status=${body.status}, invoice=${body.invoice}`,
        );

        try {
            await this.orderService.handleSteadfastWebhook(body);
        } catch (err: any) {
            this.logger.error(
                `Steadfast webhook processing error: ${err.message}`,
            );
        }

        return {
            status: 'success',
            message: 'Webhook received successfully.',
        };
    }
}
