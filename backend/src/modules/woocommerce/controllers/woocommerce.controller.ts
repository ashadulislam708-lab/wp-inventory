import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WooCommerceService } from '../services/woocommerce.service.js';
import { SyncLogsQueryDto } from '../dto/sync-logs-query.dto.js';
import { FetchWcOrdersQueryDto } from '../dto/fetch-wc-orders-query.dto.js';
import { SyncBulkOrdersDto } from '../dto/sync-bulk-orders.dto.js';
import { SyncBulkProductsDto } from '../dto/sync-bulk-products.dto.js';
import { SyncSelectedOrdersDto } from '../dto/sync-selected-orders.dto.js';
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
     * Bulk sync selected products from WooCommerce
     * POST /api/woocommerce/sync/products/bulk
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Post('sync/products/bulk')
    @HttpCode(HttpStatus.OK)
    async syncBulkProducts(@Body() dto: SyncBulkProductsDto) {
        return this.wooCommerceService.syncBulkProducts(dto);
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
     * Browse WC orders with local sync status
     * GET /api/woocommerce/orders/wc
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Get('orders/wc')
    @HttpCode(HttpStatus.OK)
    async fetchWcOrders(@Query() dto: FetchWcOrdersQueryDto) {
        return this.wooCommerceService.fetchWcOrders(dto);
    }

    /**
     * Bulk sync selected WC orders
     * POST /api/woocommerce/sync/orders/bulk
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Post('sync/orders/bulk')
    @HttpCode(HttpStatus.OK)
    async syncBulkOrders(@Body() dto: SyncBulkOrdersDto) {
        return this.wooCommerceService.syncBulkOrders(dto);
    }

    /**
     * Sync selected orders with WC (pull status + push notes)
     * POST /api/woocommerce/orders/sync-selected
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Post('orders/sync-selected')
    @HttpCode(HttpStatus.OK)
    async syncSelectedOrders(@Body() dto: SyncSelectedOrdersDto) {
        return this.wooCommerceService.syncSelectedOrders(dto);
    }

    /**
     * Sync a single WC order by its WooCommerce order ID
     * POST /api/woocommerce/sync/orders/:wcOrderId
     */
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(UserRoleEnum.ADMIN)
    @Post('sync/orders/:wcOrderId')
    @HttpCode(HttpStatus.OK)
    async syncSingleOrder(@Param('wcOrderId', ParseIntPipe) wcOrderId: number) {
        return this.wooCommerceService.syncSingleOrder(wcOrderId);
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
