import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WooCommerceService } from '../services/woocommerce.service.js';
import { SyncLogsQueryDto } from '../dto/sync-logs-query.dto.js';
import { Public } from '../../../core/decorators/public.decorator.js';
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { WcWebhookGuard } from '../../../core/guards/wc-webhook.guard.js';
import { UserRoleEnum } from '../../../shared/enums/user-role.enum.js';

@ApiTags('WooCommerce')
@Controller('woocommerce')
export class WooCommerceController {
    constructor(private readonly wooCommerceService: WooCommerceService) {}

    /**
     * WC Product Webhook (no JWT auth, verified by HMAC signature via WcWebhookGuard)
     * POST /api/woocommerce/webhook/product
     */
    @Public()
    @UseGuards(WcWebhookGuard)
    @Post('webhook/product')
    @HttpCode(HttpStatus.OK)
    async webhookProduct(@Req() req: any) {
        // Raw body is attached by WcWebhookGuard after successful HMAC verification
        const rawBody =
            req.wcRawBody ||
            (typeof req.body === 'string'
                ? req.body
                : JSON.stringify(req.body));
        return this.wooCommerceService.handleProductWebhook(req.body, rawBody);
    }

    /**
     * WC Order Webhook (no JWT auth, verified by HMAC signature via WcWebhookGuard)
     * POST /api/woocommerce/webhook/order
     */
    @Public()
    @UseGuards(WcWebhookGuard)
    @Post('webhook/order')
    @HttpCode(HttpStatus.OK)
    async webhookOrder(@Req() req: any) {
        // Raw body is attached by WcWebhookGuard after successful HMAC verification
        const rawBody =
            req.wcRawBody ||
            (typeof req.body === 'string'
                ? req.body
                : JSON.stringify(req.body));
        return this.wooCommerceService.handleOrderWebhook(req.body, rawBody);
    }

    /**
     * Import all products from WooCommerce
     * POST /api/woocommerce/import/products
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Post('import/products')
    @HttpCode(HttpStatus.OK)
    async importProducts() {
        return this.wooCommerceService.importProducts();
    }

    /**
     * Manual full product sync
     * POST /api/woocommerce/sync/products
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Post('sync/products')
    @HttpCode(HttpStatus.OK)
    async syncProducts() {
        return this.wooCommerceService.syncProducts();
    }

    /**
     * Manual order sync (last 30 days)
     * POST /api/woocommerce/sync/orders
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Post('sync/orders')
    @HttpCode(HttpStatus.OK)
    async syncOrders() {
        return this.wooCommerceService.syncOrders();
    }

    /**
     * Sync a single product from WooCommerce
     * POST /api/woocommerce/sync/products/:id
     */
    @ApiBearerAuth()
    @Post('sync/products/:id')
    @HttpCode(HttpStatus.OK)
    async syncSingleProduct(@Param('id') id: string) {
        return this.wooCommerceService.syncSingleProduct(id);
    }

    /**
     * Sync logs with pagination
     * GET /api/woocommerce/sync-logs
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Get('sync-logs')
    @HttpCode(HttpStatus.OK)
    async getSyncLogs(@Query() dto: SyncLogsQueryDto) {
        return this.wooCommerceService.getSyncLogs(dto);
    }
}
