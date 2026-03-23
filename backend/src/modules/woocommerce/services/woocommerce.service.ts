import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { Product } from '../../products/entities/product.entity.js';
import { ProductVariation } from '../../products/entities/product-variation.entity.js';
import { Category } from '../../categories/entities/category.entity.js';
import { Order } from '../../orders/entities/order.entity.js';
import { OrderItem } from '../../orders/entities/order-item.entity.js';
import { StockAdjustmentLog } from '../../products/entities/stock-adjustment-log.entity.js';
import { InvoiceCounter } from '../../invoice/entities/invoice-counter.entity.js';
import { SyncLog } from '../../sync/entities/sync-log.entity.js';
import { SyncLogsQueryDto } from '../dto/sync-logs-query.dto.js';
import { FetchWcOrdersQueryDto } from '../dto/fetch-wc-orders-query.dto.js';
import { SyncBulkOrdersDto } from '../dto/sync-bulk-orders.dto.js';
import { SyncBulkProductsDto } from '../dto/sync-bulk-products.dto.js';
import { SyncSelectedOrdersDto } from '../dto/sync-selected-orders.dto.js';
import { ProductTypeEnum } from '../../../shared/enums/product-type.enum.js';
import { SyncStatusEnum } from '../../../shared/enums/sync-status.enum.js';
import { SyncDirectionEnum } from '../../../shared/enums/sync-direction.enum.js';
import { SyncLogStatusEnum } from '../../../shared/enums/sync-log-status.enum.js';
import { OrderStatusEnum } from '../../../shared/enums/order-status.enum.js';
import { OrderSourceEnum } from '../../../shared/enums/order-source.enum.js';
import { ShippingZoneEnum } from '../../../shared/enums/shipping-zone.enum.js';
import { ShippingPartnerEnum } from '../../../shared/enums/shipping-partner.enum.js';
import { SteadfastService } from '../../../infrastructure/courier/steadfast.service.js';
import { envConfigService } from '../../../config/env-config.service.js';
import { restoreOrderItemsStock } from '../../../shared/utils/stock-restoration.util.js';

const WC_STATUS_MAP: Record<string, OrderStatusEnum> = {
    pending: OrderStatusEnum.PENDING_PAYMENT,
    processing: OrderStatusEnum.PROCESSING,
    'on-hold': OrderStatusEnum.ON_HOLD,
    completed: OrderStatusEnum.COMPLETED,
    cancelled: OrderStatusEnum.CANCELLED,
    refunded: OrderStatusEnum.REFUNDED,
    failed: OrderStatusEnum.FAILED,
    'checkout-draft': OrderStatusEnum.DRAFT,
};

const SHIPPING_FEES: Record<ShippingZoneEnum, number> = {
    [ShippingZoneEnum.INSIDE_DHAKA]: 80,
    [ShippingZoneEnum.DHAKA_SUB_AREA]: 100,
    [ShippingZoneEnum.OUTSIDE_DHAKA]: 150,
};

@Injectable()
export class WooCommerceService {
    private readonly logger = new Logger(WooCommerceService.name);
    private wcClient: AxiosInstance | null = null;

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariation)
        private readonly variationRepository: Repository<ProductVariation>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(StockAdjustmentLog)
        private readonly stockLogRepository: Repository<StockAdjustmentLog>,
        @InjectRepository(InvoiceCounter)
        private readonly invoiceCounterRepository: Repository<InvoiceCounter>,
        @InjectRepository(SyncLog)
        private readonly syncLogRepository: Repository<SyncLog>,
        private readonly dataSource: DataSource,
        private readonly steadfastService: SteadfastService,
    ) {}

    private getWcClient(): AxiosInstance {
        if (!this.wcClient) {
            const config = envConfigService.getWooCommerceConfig();
            if (!config.WC_URL || !config.WC_CONSUMER_KEY) {
                throw new BadRequestException(
                    'WooCommerce credentials not configured',
                );
            }
            this.wcClient = axios.create({
                baseURL: `${config.WC_URL}/wp-json/wc/v3`,
                auth: {
                    username: config.WC_CONSUMER_KEY,
                    password: config.WC_CONSUMER_SECRET,
                },
                timeout: 30000,
            });
        }
        return this.wcClient;
    }

    /**
     * Verify WooCommerce webhook signature
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        const config = envConfigService.getWooCommerceConfig();
        if (!config.WC_WEBHOOK_SECRET) {
            this.logger.warn('WC_WEBHOOK_SECRET not configured');
            return false;
        }

        const computed = crypto
            .createHmac('sha256', config.WC_WEBHOOK_SECRET)
            .update(payload, 'utf8')
            .digest('base64');

        return computed === signature;
    }

    /**
     * Handle WooCommerce product webhook.
     * Signature verification is handled by WcWebhookGuard before this method is called.
     */
    async handleProductWebhook(body: any, rawBody: string) {
        const wcId = body.id;
        if (!wcId) {
            return { status: 'skipped', reason: 'No product ID' };
        }

        // Skip variation-type products — they are children of variable products, not standalone
        if (body.type === 'variation') {
            this.logger.debug(
                `Skipping webhook for variation-type product wcId ${wcId}`,
            );
            return { status: 'skipped', reason: 'Variation type product' };
        }

        // Check deduplication (5-second window)
        const existing = await this.productRepository.findOne({
            where: { wcId },
        });
        if (existing?.wcLastSyncedAt) {
            const timeDiff = Date.now() - existing.wcLastSyncedAt.getTime();
            if (timeDiff < 5000) {
                await this.logSync(
                    SyncDirectionEnum.INBOUND,
                    'product',
                    existing.id,
                    SyncLogStatusEnum.SKIPPED,
                    body,
                    'Dedup: synced within 5 seconds',
                );
                return { status: 'skipped', reason: 'dedup' };
            }
        }

        try {
            // Handle deleted products
            if (body.status === 'trash' || body.deleted) {
                if (existing) {
                    existing.deletedAt = new Date();
                    await this.productRepository.save(existing);
                    await this.logSync(
                        SyncDirectionEnum.INBOUND,
                        'product',
                        existing.id,
                        SyncLogStatusEnum.SUCCESS,
                        body,
                    );
                }
                return { status: 'soft-deleted', wcId };
            }

            // Upsert product content (NOT stock)
            await this.upsertProduct(body);

            return { status: 'success', wcId };
        } catch (error: any) {
            await this.logSync(
                SyncDirectionEnum.INBOUND,
                'product',
                existing?.id || null,
                SyncLogStatusEnum.FAILED,
                body,
                error.message,
            );
            throw error;
        }
    }

    /**
     * Handle WooCommerce order webhook.
     * Signature verification is handled by WcWebhookGuard before this method is called.
     */
    async handleOrderWebhook(body: any, rawBody: string) {
        const wcOrderId = body.id;
        if (!wcOrderId) {
            return { status: 'skipped', reason: 'No order ID' };
        }

        // Check if order already exists
        const existing = await this.orderRepository.findOne({
            where: { wcOrderId },
        });

        if (existing) {
            // Check deduplication (5-second window) using last sync log for this order
            const recentSync = await this.syncLogRepository
                .createQueryBuilder('log')
                .where('log.entityId = :entityId', { entityId: existing.id })
                .andWhere('log.entityType = :entityType', {
                    entityType: 'order',
                })
                .andWhere('log.direction = :direction', {
                    direction: SyncDirectionEnum.INBOUND,
                })
                .orderBy('log.createdAt', 'DESC')
                .getOne();

            if (recentSync) {
                const timeDiff = Date.now() - recentSync.createdAt.getTime();
                if (timeDiff < 5000) {
                    await this.logSync(
                        SyncDirectionEnum.INBOUND,
                        'order',
                        existing.id,
                        SyncLogStatusEnum.SKIPPED,
                        body,
                        'Dedup: synced within 5 seconds',
                    );
                    return { status: 'skipped', reason: 'dedup' };
                }
            }

            // Update status if changed
            const newStatus =
                WC_STATUS_MAP[body.status] || OrderStatusEnum.PENDING_PAYMENT;
            if (existing.status !== newStatus) {
                // Handle stock restoration for terminal status transitions
                const stockRestoreStatuses = [
                    OrderStatusEnum.CANCELLED,
                    OrderStatusEnum.REFUNDED,
                    OrderStatusEnum.FAILED,
                    OrderStatusEnum.DRAFT,
                ];
                const isCancelOrReturn =
                    stockRestoreStatuses.includes(newStatus);
                const wasAlreadyCancelledOrReturned =
                    stockRestoreStatuses.includes(existing.status);

                if (isCancelOrReturn && !wasAlreadyCancelledOrReturned) {
                    // Load order with items for stock restoration
                    const orderWithItems = await this.orderRepository.findOne({
                        where: { id: existing.id },
                        relations: ['items'],
                    });

                    if (orderWithItems && orderWithItems.items?.length > 0) {
                        const reasonMap: Record<string, string> = {
                            [OrderStatusEnum.CANCELLED]: 'Order Cancelled',
                            [OrderStatusEnum.REFUNDED]: 'Order Refunded',
                            [OrderStatusEnum.FAILED]: 'Order Failed',
                            [OrderStatusEnum.DRAFT]: 'Order Reverted to Draft',
                        };
                        const reasonText =
                            reasonMap[newStatus] || 'Order Status Changed';

                        await this.dataSource.transaction(async (manager) => {
                            await restoreOrderItemsStock(
                                manager,
                                orderWithItems.items,
                                null, // system action (WC webhook)
                                reasonText,
                                orderWithItems.invoiceId,
                            );
                        });

                        // Push restored stock to WC (non-blocking)
                        for (const item of orderWithItems.items) {
                            if (item.productId) {
                                this.pushStockToWc(
                                    item.productId,
                                    item.variationId || null,
                                ).catch((err) => {
                                    this.logger.error(
                                        `Failed to push stock to WC after WC ${reasonText} for product ${item.productId}: ${err.message}`,
                                    );
                                });
                            }
                        }

                        // Cancel courier for CANCELLED and FAILED only
                        const courierCancelStatuses = [
                            OrderStatusEnum.CANCELLED,
                            OrderStatusEnum.FAILED,
                        ];
                        if (
                            courierCancelStatuses.includes(newStatus) &&
                            orderWithItems.courierConsignmentId
                        ) {
                            this.steadfastService
                                .cancelOrder(
                                    orderWithItems.courierConsignmentId,
                                )
                                .catch((err) => {
                                    this.logger.error(
                                        `Failed to cancel Steadfast consignment for WC order ${orderWithItems.invoiceId}: ${err.message}`,
                                    );
                                });
                        }
                    }
                }

                await this.orderRepository.update(existing.id, {
                    status: newStatus,
                });
            }

            await this.logSync(
                SyncDirectionEnum.INBOUND,
                'order',
                existing.id,
                SyncLogStatusEnum.SUCCESS,
                { wcOrderId, status: body.status },
            );

            return { status: 'updated', orderId: existing.id };
        }

        try {
            const order = await this.createOrderFromWc(body);
            return { status: 'created', orderId: order.id };
        } catch (error: any) {
            await this.logSync(
                SyncDirectionEnum.INBOUND,
                'order',
                null,
                SyncLogStatusEnum.FAILED,
                body,
                error.message,
            );
            throw error;
        }
    }

    /**
     * Import all products from WooCommerce
     */
    async importProducts() {
        const client = this.getWcClient();
        let page = 1;
        const perPage = 100;
        let imported = 0;
        let updated = 0;
        let errors = 0;
        const details: { wcId: number; error: string }[] = [];

        try {
            while (true) {
                const response = await client.get('/products', {
                    params: { page, per_page: perPage, status: 'publish' },
                });

                const products = response.data;
                if (!products || products.length === 0) break;

                for (const wcProduct of products) {
                    // Skip product types that shouldn't be standalone products
                    if (
                        wcProduct.type &&
                        wcProduct.type !== 'simple' &&
                        wcProduct.type !== 'variable'
                    ) {
                        this.logger.debug(
                            `Skipping product wcId ${wcProduct.id} with unsupported type: ${wcProduct.type}`,
                        );
                        continue;
                    }
                    try {
                        const result = await this.upsertProduct(wcProduct);
                        if (result === 'created') imported++;
                        else updated++;
                    } catch (error: any) {
                        errors++;
                        details.push({
                            wcId: wcProduct.id,
                            error: error.message,
                        });
                    }
                }

                if (products.length < perPage) break;
                page++;
            }
        } catch (error: any) {
            this.logger.error(
                `Import failed at page ${page}: ${error.message}`,
            );
        }

        await this.logSync(
            SyncDirectionEnum.INBOUND,
            'product',
            null,
            errors === 0 ? SyncLogStatusEnum.SUCCESS : SyncLogStatusEnum.FAILED,
            { imported, updated, errors },
            errors > 0 ? `${errors} errors during import` : null,
        );

        return { imported, updated, errors, details };
    }

    /**
     * Manual full product sync
     */
    async syncProducts() {
        return this.importProducts();
    }

    /**
     * Sync a single product from WooCommerce by local product UUID
     */
    async syncSingleProduct(
        productId: string,
    ): Promise<{ status: 'created' | 'updated' }> {
        const product = await this.productRepository.findOne({
            where: { id: productId },
        });

        if (!product) {
            throw new BadRequestException('Product not found');
        }

        const client = this.getWcClient();

        try {
            const response = await client.get(`/products/${product.wcId}`);
            const wcProduct = response.data;

            const result = await this.upsertProduct(wcProduct);

            await this.logSync(
                SyncDirectionEnum.INBOUND,
                'product',
                productId,
                SyncLogStatusEnum.SUCCESS,
                { wcId: product.wcId },
                null,
            );

            return { status: result };
        } catch (error: any) {
            await this.logSync(
                SyncDirectionEnum.INBOUND,
                'product',
                productId,
                SyncLogStatusEnum.FAILED,
                { wcId: product.wcId },
                error.message,
            );
            throw new BadRequestException(
                `Failed to sync product: ${error.message}`,
            );
        }
    }

    /**
     * Bulk sync selected products from WooCommerce
     */
    async syncBulkProducts(dto: SyncBulkProductsDto) {
        let synced = 0;
        let errors = 0;
        const results: {
            productId: string;
            status?: string;
            error?: string;
        }[] = [];

        for (const productId of dto.productIds) {
            try {
                const result = await this.syncSingleProduct(productId);
                synced++;
                results.push({ productId, status: result.status });
            } catch (error: any) {
                errors++;
                results.push({ productId, error: error.message });
            }
        }

        return { synced, errors, results };
    }

    /**
     * Manual order sync (last 30 days)
     */
    async syncOrders() {
        const client = this.getWcClient();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let page = 1;
        const perPage = 100;
        let synced = 0;
        let errors = 0;
        const errorDetails: Array<{ wcOrderId: number; error: string }> = [];

        try {
            while (true) {
                const response = await client.get('/orders', {
                    params: {
                        page,
                        per_page: perPage,
                        after: thirtyDaysAgo.toISOString(),
                    },
                });

                const orders = response.data;
                if (!orders || orders.length === 0) break;

                for (const wcOrder of orders) {
                    try {
                        const existing = await this.orderRepository.findOne({
                            where: { wcOrderId: wcOrder.id },
                        });
                        if (!existing) {
                            await this.createOrderFromWc(wcOrder);
                        }
                        synced++;
                    } catch (error: any) {
                        errors++;
                        errorDetails.push({
                            wcOrderId: wcOrder.id,
                            error: error.message,
                        });
                        this.logger.error(
                            `Order sync error for WC #${wcOrder.id}: ${error.message}`,
                        );
                    }
                }

                if (orders.length < perPage) break;
                page++;
            }
        } catch (error: any) {
            this.logger.error(`Order sync failed: ${error.message}`);
        }

        return { synced, errors, errorDetails };
    }

    /**
     * Get sync logs with pagination
     */
    async getSyncLogs(dto: SyncLogsQueryDto) {
        const page = dto.page || 1;
        const limit = dto.limit || 25;
        const skip = (page - 1) * limit;

        const qb = this.syncLogRepository.createQueryBuilder('log');

        if (dto.direction) {
            qb.andWhere('log.direction = :direction', {
                direction: dto.direction,
            });
        }

        if (dto.status) {
            qb.andWhere('log.status = :status', { status: dto.status });
        }

        if (dto.entityType) {
            qb.andWhere('log.entityType = :entityType', {
                entityType: dto.entityType,
            });
        }

        qb.orderBy('log.createdAt', 'DESC');
        qb.skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Check WooCommerce connection status
     */
    async checkWcStatus(): Promise<{
        connected: boolean;
        url: string;
        error?: string;
    }> {
        const config = envConfigService.getWooCommerceConfig();

        if (!config.WC_URL || !config.WC_CONSUMER_KEY) {
            return {
                connected: false,
                url: config.WC_URL || 'not configured',
                error: 'WooCommerce credentials not configured',
            };
        }

        try {
            const client = this.getWcClient();
            await client.get('/system_status');
            return { connected: true, url: config.WC_URL };
        } catch (error: any) {
            return {
                connected: false,
                url: config.WC_URL,
                error: error.message,
            };
        }
    }

    /**
     * Add a note to a WooCommerce order (outbound sync).
     * Used to push the local invoice number back to WC after order import.
     * Non-blocking: catches errors and logs them rather than throwing.
     */
    async addOrderNote(wcOrderId: number, note: string): Promise<void> {
        try {
            const client = this.getWcClient();
            await client.post(`/orders/${wcOrderId}/notes`, {
                note,
                customer_note: false,
            });

            this.logger.log(`Added note to WC order ${wcOrderId}: ${note}`);
        } catch (err: any) {
            this.logger.error(
                `Failed to add note to WC order ${wcOrderId}: ${err.message}`,
            );
        }
    }

    /**
     * Sync selected orders with WooCommerce (bidirectional).
     * - Inbound: Pull latest order data/status from WC
     * - Outbound: Push discount, advance, and invoice notes to WC
     * Only processes orders with source=WOOCOMMERCE and wcOrderId set.
     * Manual orders are silently skipped.
     */
    async syncSelectedOrders(dto: SyncSelectedOrdersDto) {
        const orders = await this.orderRepository.find({
            where: {
                id: In(dto.orderIds),
                source: OrderSourceEnum.WOOCOMMERCE,
            },
            select: [
                'id',
                'invoiceId',
                'wcOrderId',
                'status',
                'discountAmount',
                'advanceAmount',
            ],
        });

        const skipped = dto.orderIds.length - orders.length;
        let synced = 0;
        let errors = 0;

        const client = this.getWcClient();

        for (const order of orders) {
            if (!order.wcOrderId) {
                continue;
            }

            try {
                // --- Inbound: Pull latest from WC ---
                const response = await client.get(
                    `/orders/${order.wcOrderId}`,
                );
                const wcOrder = response.data;

                // Update status if changed
                const newStatus =
                    WC_STATUS_MAP[wcOrder.status] ||
                    OrderStatusEnum.PENDING_PAYMENT;

                if (order.status !== newStatus) {
                    await this.orderRepository.update(order.id, {
                        status: newStatus,
                    });
                }

                // --- Outbound: Push notes to WC ---
                const discount = Number(order.discountAmount);
                if (discount > 0) {
                    await this.addOrderNote(
                        order.wcOrderId,
                        `Discount Applied: ${discount} BDT — Glam Lavish Inventory System`,
                    );
                }

                const advance = Number(order.advanceAmount);
                if (advance > 0) {
                    await this.addOrderNote(
                        order.wcOrderId,
                        `Advance Payment: ${advance} BDT — Glam Lavish Inventory System`,
                    );
                }

                await this.addOrderNote(
                    order.wcOrderId,
                    `Invoice Number: ${order.invoiceId} — Glam Lavish Inventory System`,
                );

                await this.logSync(
                    SyncDirectionEnum.INBOUND,
                    'order',
                    order.id,
                    SyncLogStatusEnum.SUCCESS,
                    {
                        wcOrderId: order.wcOrderId,
                        wcStatus: wcOrder.status,
                        localStatus: newStatus,
                    },
                );

                synced++;
            } catch (error: any) {
                this.logger.error(
                    `Failed to sync order ${order.id} (WC #${order.wcOrderId}): ${error.message}`,
                );
                errors++;
            }
        }

        return { synced, skipped, errors };
    }

    /**
     * Push product stock to WooCommerce (outbound sync)
     * For simple products: PUT /wc/v3/products/{wcProductId} with { stock_quantity }
     * For variations: PUT /wc/v3/products/{wcProductId}/variations/{wcVariationId} with { stock_quantity }
     *
     * Updates syncStatus and wcLastSyncedAt on the product/variation.
     * Logs the operation in sync_logs.
     * Non-blocking: catches errors and logs them rather than throwing.
     */
    async pushStockToWc(
        productId: string,
        variationId: string | null = null,
    ): Promise<void> {
        try {
            const client = this.getWcClient();

            if (variationId) {
                // Push variation stock
                const variation = await this.variationRepository.findOne({
                    where: { id: variationId },
                    relations: ['product'],
                });
                if (!variation || !variation.product?.wcId || !variation.wcId) {
                    this.logger.warn(
                        `Cannot push variation stock: variation ${variationId} missing WC IDs`,
                    );
                    return;
                }

                const wcProductId = variation.product.wcId;
                const wcVariationId = variation.wcId;

                await client.put(
                    `/products/${wcProductId}/variations/${wcVariationId}`,
                    {
                        stock_quantity: variation.stockQuantity,
                        manage_stock: true,
                        stock_status: this.getStockStatus(
                            variation.stockQuantity,
                        ),
                    },
                );

                // Update parent product stock_status on WC (manage_stock: false for variable products)
                const allVariations = await this.variationRepository.find({
                    where: { productId: variation.product.id },
                });
                const totalVariationStock = allVariations.reduce(
                    (sum, v) => sum + v.stockQuantity,
                    0,
                );
                await client.put(`/products/${wcProductId}`, {
                    stock_status: this.getStockStatus(totalVariationStock),
                    manage_stock: false,
                });

                // Update wcLastSyncedAt for dedup
                await this.variationRepository.update(variationId, {
                    wcLastSyncedAt: new Date(),
                });

                // Also update parent product syncStatus
                await this.productRepository.update(variation.product.id, {
                    syncStatus: SyncStatusEnum.SYNCED,
                    wcLastSyncedAt: new Date(),
                });

                await this.logSync(
                    SyncDirectionEnum.OUTBOUND,
                    'product',
                    variation.product.id,
                    SyncLogStatusEnum.SUCCESS,
                    {
                        wcProductId,
                        wcVariationId,
                        stock_quantity: variation.stockQuantity,
                    },
                );

                this.logger.log(
                    `Pushed variation stock to WC: product ${wcProductId}, variation ${wcVariationId}, qty ${variation.stockQuantity}`,
                );
            } else {
                // Push simple product stock
                const product = await this.productRepository.findOne({
                    where: { id: productId },
                });
                if (!product || !product.wcId) {
                    this.logger.warn(
                        `Cannot push product stock: product ${productId} missing WC ID`,
                    );
                    return;
                }

                await client.put(`/products/${product.wcId}`, {
                    stock_quantity: product.stockQuantity,
                    manage_stock: true,
                    stock_status: this.getStockStatus(product.stockQuantity),
                });

                // Update syncStatus and wcLastSyncedAt for dedup
                await this.productRepository.update(productId, {
                    syncStatus: SyncStatusEnum.SYNCED,
                    wcLastSyncedAt: new Date(),
                });

                await this.logSync(
                    SyncDirectionEnum.OUTBOUND,
                    'product',
                    product.id,
                    SyncLogStatusEnum.SUCCESS,
                    {
                        wcProductId: product.wcId,
                        stock_quantity: product.stockQuantity,
                    },
                );

                this.logger.log(
                    `Pushed product stock to WC: product ${product.wcId}, qty ${product.stockQuantity}`,
                );
            }
        } catch (error: any) {
            this.logger.error(
                `Failed to push stock to WC for product ${productId}${variationId ? ` variation ${variationId}` : ''}: ${error.message}`,
                error.response?.data ? JSON.stringify(error.response.data) : '',
            );

            // Mark product sync status as ERROR
            try {
                await this.productRepository.update(productId, {
                    syncStatus: SyncStatusEnum.ERROR,
                });
            } catch {
                // Ignore error when updating sync status
            }

            await this.logSync(
                SyncDirectionEnum.OUTBOUND,
                'product',
                productId,
                SyncLogStatusEnum.FAILED,
                { variationId },
                error.message,
            );
        }
    }

    /**
     * Push a private order note to WooCommerce.
     * Non-blocking: catches errors and logs them rather than throwing.
     */
    async pushOrderNoteToWc(wcOrderId: number, note: string): Promise<void> {
        try {
            const client = this.getWcClient();
            await client.post(`/orders/${wcOrderId}/notes`, {
                note,
                customer_note: false,
            });
            this.logger.log(
                `Pushed order note to WC order ${wcOrderId}: ${note}`,
            );
        } catch (error: any) {
            this.logger.error(
                `Failed to push order note to WC order ${wcOrderId}: ${error.message}`,
            );
        }
    }

    /**
     * Push stock for all products with wcId to WooCommerce (for reconciliation)
     * Local stock wins — iterate all products and push local quantities to WC.
     * Returns summary of results.
     */
    async reconcileAllStock(): Promise<{
        total: number;
        success: number;
        failed: number;
        skipped: number;
    }> {
        const summary = { total: 0, success: 0, failed: 0, skipped: 0 };

        try {
            const client = this.getWcClient();

            // Get all non-deleted products that have a wcId
            const products = await this.productRepository
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.variations', 'variations')
                .where('product.deletedAt IS NULL')
                .andWhere('product.wcId IS NOT NULL')
                .getMany();

            summary.total = products.length;

            for (const product of products) {
                try {
                    if (product.variations && product.variations.length > 0) {
                        // Variable product — push each variation stock
                        for (const variation of product.variations) {
                            if (!variation.wcId) {
                                summary.skipped++;
                                continue;
                            }

                            try {
                                await client.put(
                                    `/products/${product.wcId}/variations/${variation.wcId}`,
                                    {
                                        stock_quantity: variation.stockQuantity,
                                        manage_stock: true,
                                        stock_status: this.getStockStatus(
                                            variation.stockQuantity,
                                        ),
                                    },
                                );

                                await this.variationRepository.update(
                                    variation.id,
                                    { wcLastSyncedAt: new Date() },
                                );
                            } catch (varError: any) {
                                this.logger.error(
                                    `Reconcile failed for variation ${variation.wcId}: ${varError.message}`,
                                );
                                summary.failed++;

                                await this.logSync(
                                    SyncDirectionEnum.OUTBOUND,
                                    'product',
                                    product.id,
                                    SyncLogStatusEnum.FAILED,
                                    {
                                        wcProductId: product.wcId,
                                        wcVariationId: variation.wcId,
                                        stock_quantity: variation.stockQuantity,
                                        type: 'reconciliation',
                                    },
                                    varError.message,
                                );
                                continue;
                            }
                        }

                        // Variable products: manage stock per-variation, not at parent level
                        const totalVariationStock = product.variations.reduce(
                            (sum, v) => sum + v.stockQuantity,
                            0,
                        );

                        // Fix local parent stock if mismatched
                        if (product.stockQuantity !== totalVariationStock) {
                            await this.productRepository.update(product.id, {
                                stockQuantity: totalVariationStock,
                            });
                        }

                        await client.put(`/products/${product.wcId}`, {
                            stock_status:
                                this.getStockStatus(totalVariationStock),
                            manage_stock: false,
                        });
                    } else {
                        // Simple product — push stock directly
                        await client.put(`/products/${product.wcId}`, {
                            stock_quantity: product.stockQuantity,
                            manage_stock: true,
                            stock_status: this.getStockStatus(
                                product.stockQuantity,
                            ),
                        });
                    }

                    // Update sync timestamps
                    await this.productRepository.update(product.id, {
                        syncStatus: SyncStatusEnum.SYNCED,
                        wcLastSyncedAt: new Date(),
                    });

                    summary.success++;
                } catch (productError: any) {
                    summary.failed++;
                    this.logger.error(
                        `Reconcile failed for product ${product.wcId}: ${productError.message}`,
                    );

                    await this.productRepository.update(product.id, {
                        syncStatus: SyncStatusEnum.ERROR,
                    });

                    await this.logSync(
                        SyncDirectionEnum.OUTBOUND,
                        'product',
                        product.id,
                        SyncLogStatusEnum.FAILED,
                        {
                            wcProductId: product.wcId,
                            stock_quantity: product.stockQuantity,
                            type: 'reconciliation',
                        },
                        productError.message,
                    );
                }
            }
        } catch (error: any) {
            this.logger.error(`Stock reconciliation failed: ${error.message}`);
        }

        return summary;
    }

    // ============================
    // Private helper methods
    // ============================

    private getStockStatus(quantity: number): 'instock' | 'outofstock' {
        return quantity > 0 ? 'instock' : 'outofstock';
    }

    private async upsertProduct(
        wcProduct: any,
    ): Promise<'created' | 'updated'> {
        const wcId = wcProduct.id;

        // Skip variation-type products — they are child resources, not standalone products
        if (wcProduct.type === 'variation') {
            this.logger.debug(
                `Skipping variation-type product wcId ${wcId} — not a standalone product`,
            );
            return 'updated';
        }

        // Upsert category if present
        let categoryId: string | null = null;
        if (wcProduct.categories && wcProduct.categories.length > 0) {
            const wcCat = wcProduct.categories[0];
            let category = await this.categoryRepository.findOne({
                where: { wcId: wcCat.id },
            });
            if (!category) {
                category = this.categoryRepository.create({
                    wcId: wcCat.id,
                    name: wcCat.name,
                    slug: wcCat.slug,
                });
                await this.categoryRepository.save(category);
            } else {
                category.name = wcCat.name;
                category.slug = wcCat.slug;
                await this.categoryRepository.save(category);
            }
            categoryId = category.id;
        }

        const isVariable =
            wcProduct.type === 'variable' ||
            (wcProduct.variations && wcProduct.variations.length > 0);

        let existing = await this.productRepository.findOne({
            where: { wcId },
        });

        const productData: Partial<Product> = {
            name: wcProduct.name,
            shortDescription: wcProduct.short_description || null,
            description: wcProduct.description || null,
            sku: wcProduct.sku || null,
            type: isVariable
                ? ProductTypeEnum.VARIABLE
                : ProductTypeEnum.SIMPLE,
            imageUrl: wcProduct.images?.[0]?.src || null,
            regularPrice: wcProduct.regular_price
                ? parseFloat(wcProduct.regular_price)
                : null,
            salePrice: wcProduct.sale_price
                ? parseFloat(wcProduct.sale_price)
                : null,
            wcId,
            wcPermalink: wcProduct.permalink || null,
            categoryId,
            syncStatus: SyncStatusEnum.SYNCED,
            wcLastSyncedAt: new Date(),
        };

        let result: 'created' | 'updated';

        if (existing) {
            // Update content only, do NOT overwrite stock
            await this.productRepository.update(existing.id, productData);
            existing = (await this.productRepository.findOne({
                where: { id: existing.id },
            }))!;
            result = 'updated';
        } else {
            // New product -- set initial stock from WC
            const newProduct = this.productRepository.create({
                ...productData,
                stockQuantity: wcProduct.stock_quantity || 0,
            });
            existing = await this.productRepository.save(newProduct);
            result = 'created';
        }

        // Handle variations for variable products
        if (isVariable) {
            let variationData: any[] = wcProduct.variation_data || [];

            // If no pre-loaded variation data, fetch from WC API
            if (variationData.length === 0) {
                // Check if wcProduct.variations contains full objects (some WC configs embed them)
                if (
                    wcProduct.variations &&
                    wcProduct.variations.length > 0 &&
                    typeof wcProduct.variations[0] === 'object' &&
                    wcProduct.variations[0] !== null &&
                    wcProduct.variations[0].id
                ) {
                    variationData = wcProduct.variations;
                } else {
                    // Fetch all variations via batch endpoint (paginated)
                    try {
                        const client = this.getWcClient();
                        let varPage = 1;
                        const varPerPage = 100;

                        while (true) {
                            const varResponse = await client.get(
                                `/products/${wcId}/variations`,
                                {
                                    params: {
                                        page: varPage,
                                        per_page: varPerPage,
                                    },
                                },
                            );
                            const batch = varResponse.data;
                            if (!batch || batch.length === 0) break;

                            variationData.push(...batch);

                            if (batch.length < varPerPage) break;
                            varPage++;
                        }
                    } catch (error: any) {
                        this.logger.error(
                            `Failed to fetch variations for product wcId ${wcId}: ${error.message}`,
                        );
                    }
                }
            }

            if (variationData.length > 0) {
                for (const wcVar of variationData) {
                    const existingVar = await this.variationRepository.findOne({
                        where: { wcId: wcVar.id },
                    });

                    const attrs: Record<string, string> = {};
                    if (wcVar.attributes) {
                        for (const attr of wcVar.attributes) {
                            attrs[attr.name] = attr.option;
                        }
                    }

                    const varData: Partial<ProductVariation> = {
                        productId: existing.id,
                        sku: wcVar.sku || null,
                        attributes: attrs,
                        regularPrice: wcVar.regular_price
                            ? parseFloat(wcVar.regular_price)
                            : null,
                        salePrice: wcVar.sale_price
                            ? parseFloat(wcVar.sale_price)
                            : null,
                        imageUrl: wcVar.image?.src || null,
                        wcId: wcVar.id,
                        wcLastSyncedAt: new Date(),
                    };

                    if (existingVar) {
                        // Update content, NOT stock
                        await this.variationRepository.update(
                            existingVar.id,
                            varData,
                        );
                    } else {
                        const newVar = this.variationRepository.create({
                            ...varData,
                            stockQuantity: wcVar.stock_quantity || 0,
                        });
                        await this.variationRepository.save(newVar);
                    }
                }

                // Recalculate parent product stock as sum of all variation stocks
                const allVariations = await this.variationRepository.find({
                    where: { productId: existing.id },
                });
                const totalStock = allVariations.reduce(
                    (sum, v) => sum + v.stockQuantity,
                    0,
                );
                await this.productRepository.update(existing.id, {
                    stockQuantity: totalStock,
                });
            }
        }

        await this.logSync(
            SyncDirectionEnum.INBOUND,
            'product',
            existing.id,
            SyncLogStatusEnum.SUCCESS,
            { wcId, name: wcProduct.name },
        );

        return result;
    }

    private async createOrderFromWc(wcOrder: any): Promise<Order> {
        return this.dataSource
            .transaction(async (manager) => {
                // Generate invoice ID
                const invoiceId = await this.generateInvoiceId(manager);

                // Map WC status
                const status =
                    WC_STATUS_MAP[wcOrder.status] ||
                    OrderStatusEnum.PENDING_PAYMENT;

                // Parse shipping info
                const shippingZone = ShippingZoneEnum.OUTSIDE_DHAKA; // Default
                let shippingFee = SHIPPING_FEES[shippingZone];
                let wcShippingCost: number | null = null;

                if (
                    wcOrder.shipping_lines &&
                    wcOrder.shipping_lines.length > 0
                ) {
                    wcShippingCost = parseFloat(
                        wcOrder.shipping_lines[0].total || '0',
                    );
                    shippingFee = wcShippingCost || shippingFee;
                }

                // Build customer info
                const billing = wcOrder.billing || {};
                const shipping = wcOrder.shipping || {};
                const customerName =
                    `${shipping.first_name || billing.first_name || ''} ${shipping.last_name || billing.last_name || ''}`.trim();
                const customerPhone = billing.phone || '';
                const customerAddress = [
                    shipping.address_1 || billing.address_1,
                    shipping.address_2 || billing.address_2,
                    shipping.city || billing.city,
                    shipping.state || billing.state,
                    shipping.postcode || billing.postcode,
                ]
                    .filter(Boolean)
                    .join(', ');

                // Calculate subtotal from line items
                let subtotal = 0;
                const orderItems: Partial<OrderItem>[] = [];

                // Track products/variations that had stock decremented (for WC sync after commit)
                const stockDecrementedProducts: Array<{
                    productId: string;
                    variationId: string | null;
                }> = [];

                if (wcOrder.line_items) {
                    for (const lineItem of wcOrder.line_items) {
                        const unitPrice = parseFloat(lineItem.price || '0');
                        const quantity = lineItem.quantity || 1;
                        const totalPrice = unitPrice * quantity;
                        subtotal += totalPrice;

                        // Try to find matching local product
                        let productId: string | null = null;
                        let variationId: string | null = null;
                        let variationLabel: string | null = null;

                        if (lineItem.variation_id && lineItem.product_id) {
                            // Variation product — decrement variation stock
                            const variation = await manager.findOne(
                                ProductVariation,
                                {
                                    where: { wcId: lineItem.variation_id },
                                    lock: { mode: 'pessimistic_write' },
                                },
                            );

                            if (variation) {
                                variationId = variation.id;
                                productId = variation.productId;

                                // Validate stock before decrement — NEVER allow negative
                                if (variation.stockQuantity >= quantity) {
                                    const prevQty = variation.stockQuantity;
                                    variation.stockQuantity -= quantity;
                                    await manager.save(
                                        ProductVariation,
                                        variation,
                                    );

                                    // Also update parent product total stock
                                    const parentProduct = await manager.findOne(
                                        Product,
                                        {
                                            where: { id: variation.productId },
                                            lock: { mode: 'pessimistic_write' },
                                        },
                                    );
                                    if (parentProduct) {
                                        parentProduct.stockQuantity -= quantity;
                                        await manager.save(
                                            Product,
                                            parentProduct,
                                        );
                                    }

                                    // Log stock adjustment
                                    await manager.save(
                                        manager.create(StockAdjustmentLog, {
                                            productId: variation.productId,
                                            variationId: variation.id,
                                            adjustedById: null, // System adjustment (WC webhook)
                                            previousQty: prevQty,
                                            newQty: variation.stockQuantity,
                                            reason: `WC Order Created - ${invoiceId}`,
                                        }),
                                    );

                                    stockDecrementedProducts.push({
                                        productId: variation.productId,
                                        variationId: variation.id,
                                    });
                                } else {
                                    this.logger.warn(
                                        `Insufficient stock for variation wcId ${lineItem.variation_id} (available: ${variation.stockQuantity}, requested: ${quantity}). Skipping stock decrement.`,
                                    );
                                }

                                // Build variation label
                                const attrs = variation.attributes || {};
                                variationLabel =
                                    Object.values(attrs).join(' / ') || null;
                            } else {
                                // Variation not found locally — still try product
                                const product = await manager.findOne(Product, {
                                    where: { wcId: lineItem.product_id },
                                });
                                productId = product?.id || null;
                            }
                        } else if (lineItem.product_id) {
                            // Simple product — decrement product stock
                            const product = await manager.findOne(Product, {
                                where: { wcId: lineItem.product_id },
                                lock: { mode: 'pessimistic_write' },
                            });

                            if (product) {
                                productId = product.id;

                                // Validate stock before decrement — NEVER allow negative
                                if (product.stockQuantity >= quantity) {
                                    const prevQty = product.stockQuantity;
                                    product.stockQuantity -= quantity;
                                    await manager.save(Product, product);

                                    // Log stock adjustment
                                    await manager.save(
                                        manager.create(StockAdjustmentLog, {
                                            productId: product.id,
                                            variationId: null,
                                            adjustedById: null, // System adjustment (WC webhook)
                                            previousQty: prevQty,
                                            newQty: product.stockQuantity,
                                            reason: `WC Order Created - ${invoiceId}`,
                                        }),
                                    );

                                    stockDecrementedProducts.push({
                                        productId: product.id,
                                        variationId: null,
                                    });
                                } else {
                                    this.logger.warn(
                                        `Insufficient stock for product wcId ${lineItem.product_id} (available: ${product.stockQuantity}, requested: ${quantity}). Skipping stock decrement.`,
                                    );
                                }
                            }
                        }

                        orderItems.push({
                            productId,
                            variationId,
                            productName: lineItem.name || 'Unknown Product',
                            variationLabel,
                            quantity,
                            unitPrice,
                            totalPrice,
                            stockDecremented: stockDecrementedProducts.some(
                                (p) =>
                                    p.productId === productId &&
                                    p.variationId === variationId,
                            ),
                        });
                    }
                }

                const grandTotal = subtotal + shippingFee;

                // Generate QR code
                const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:8041'}/tracking/${invoiceId}`;
                const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`;

                // Create order
                const order = manager.create(Order, {
                    invoiceId,
                    createdById: null,
                    source: OrderSourceEnum.WOOCOMMERCE,
                    status,
                    customerName: customerName || 'WC Customer',
                    customerPhone: customerPhone || '00000000000',
                    customerAddress: customerAddress || 'N/A',
                    shippingZone,
                    shippingPartner: ShippingPartnerEnum.STEADFAST,
                    shippingFee,
                    subtotal,
                    grandTotal,
                    wcOrderId: wcOrder.id,
                    wcShippingCost,
                    qrCodeDataUrl,
                });

                const savedOrder = await manager.save(Order, order);

                // Create items
                for (const itemData of orderItems) {
                    const orderItem = manager.create(OrderItem, {
                        ...itemData,
                        orderId: savedOrder.id,
                    });
                    await manager.save(OrderItem, orderItem);
                }

                await this.logSync(
                    SyncDirectionEnum.INBOUND,
                    'order',
                    savedOrder.id,
                    SyncLogStatusEnum.SUCCESS,
                    { wcOrderId: wcOrder.id },
                );

                return { order: savedOrder, stockDecrementedProducts };
            })
            .then(async ({ order, stockDecrementedProducts: decremented }) => {
                // Push to Steadfast
                if (order.status === OrderStatusEnum.PENDING_PAYMENT) {
                    const courierResult =
                        await this.steadfastService.createOrder({
                            invoice: order.invoiceId,
                            recipient_name: order.customerName,
                            recipient_phone: order.customerPhone,
                            recipient_address: order.customerAddress,
                            cod_amount: Number(order.grandTotal),
                        });

                    if (courierResult) {
                        await this.orderRepository.update(order.id, {
                            courierConsignmentId: courierResult.consignmentId,
                            courierTrackingCode: courierResult.trackingCode,
                        });
                    }
                }

                // Push updated stock to WooCommerce for decremented items (non-blocking)
                for (const item of decremented) {
                    this.pushStockToWc(item.productId, item.variationId).catch(
                        (err) => {
                            this.logger.error(
                                `Failed to push stock to WC after WC order for product ${item.productId}: ${err.message}`,
                            );
                        },
                    );
                }

                // Push invoice number as WC order note (non-blocking)
                if (order.wcOrderId) {
                    this.addOrderNote(
                        order.wcOrderId,
                        `Invoice Number: ${order.invoiceId}`,
                    ).catch((err) => {
                        this.logger.error(
                            `Failed to add invoice note to WC order ${order.wcOrderId}: ${err.message}`,
                        );
                    });
                }

                return order;
            });
    }

    private async generateInvoiceId(manager: any): Promise<string> {
        const result = await manager.query(
            `SELECT last_num FROM invoice_counter WHERE id = 1 FOR UPDATE`,
        );

        let lastNum: number;

        if (!result || result.length === 0) {
            await manager.query(
                `INSERT INTO invoice_counter (id, last_num) VALUES (1, 0) ON CONFLICT (id) DO NOTHING`,
            );
            lastNum = 0;
        } else {
            lastNum = result[0].last_num;
        }

        const nextNum = lastNum + 1;
        await manager.query(
            `UPDATE invoice_counter SET last_num = $1, updated_at = NOW() WHERE id = 1`,
            [nextNum],
        );

        return `GL-${String(nextNum).padStart(4, '0')}`;
    }

    /**
     * Fetch WC orders with local sync status for browsing
     */
    async fetchWcOrders(dto: FetchWcOrdersQueryDto) {
        const client = this.getWcClient();
        const page = dto.page || 1;
        const perPage = dto.perPage || 20;

        const params: Record<string, any> = {
            page,
            per_page: perPage,
            orderby: 'date',
            order: 'desc',
        };

        if (dto.status) {
            params.status = dto.status;
        }

        if (dto.dateAfter) {
            params.after = dto.dateAfter;
        } else {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            params.after = thirtyDaysAgo.toISOString();
        }

        const response = await client.get('/orders', { params });
        const wcOrders = response.data;
        const total = parseInt(response.headers['x-wp-total'] || '0', 10);
        const totalPages = parseInt(
            response.headers['x-wp-totalpages'] || '0',
            10,
        );

        // Batch-check which orders are already synced locally
        const wcOrderIds = wcOrders.map((o: any) => o.id);
        const localOrders =
            wcOrderIds.length > 0
                ? await this.orderRepository.find({
                      where: { wcOrderId: In(wcOrderIds) },
                      select: ['id', 'wcOrderId', 'invoiceId'],
                  })
                : [];
        const localMap = new Map(
            localOrders.map((o) => [
                o.wcOrderId,
                { id: o.id, invoiceId: o.invoiceId },
            ]),
        );

        const data = wcOrders.map((wc: any) => {
            const local = localMap.get(wc.id);
            return {
                wcOrderId: wc.id,
                wcStatus: wc.status,
                customerName:
                    `${wc.billing?.first_name || ''} ${wc.billing?.last_name || ''}`.trim(),
                customerPhone: wc.billing?.phone || '',
                total: wc.total,
                dateCreated: wc.date_created,
                isSynced: !!local,
                localOrderId: local?.id || null,
                localInvoiceId: local?.invoiceId || null,
            };
        });

        return {
            data,
            meta: { page, perPage, total, totalPages },
        };
    }

    /**
     * Sync a single WC order by its WooCommerce order ID
     */
    async syncSingleOrder(wcOrderId: number) {
        // Check if already synced
        const existing = await this.orderRepository.findOne({
            where: { wcOrderId },
            select: ['id', 'invoiceId'],
        });

        if (existing) {
            return {
                status: 'already_synced' as const,
                orderId: existing.id,
                invoiceId: existing.invoiceId,
            };
        }

        // Fetch from WC API
        const client = this.getWcClient();
        const response = await client.get(`/orders/${wcOrderId}`);
        const wcOrder = response.data;

        // Create order using existing logic
        const order = await this.createOrderFromWc(wcOrder);

        await this.logSync(
            SyncDirectionEnum.INBOUND,
            'order',
            order.id,
            SyncLogStatusEnum.SUCCESS,
            { wcOrderId, invoiceId: order.invoiceId },
        );

        return {
            status: 'created' as const,
            orderId: order.id,
            invoiceId: order.invoiceId,
        };
    }

    /**
     * Bulk sync selected WC orders by their WooCommerce order IDs
     */
    async syncBulkOrders(dto: SyncBulkOrdersDto) {
        const { wcOrderIds } = dto;

        // Filter out already-synced orders
        const existingOrders = await this.orderRepository.find({
            where: { wcOrderId: In(wcOrderIds) },
            select: ['wcOrderId'],
        });
        const existingSet = new Set(existingOrders.map((o) => o.wcOrderId));
        const unsyncedIds = wcOrderIds.filter((id) => !existingSet.has(id));

        const results: Array<{
            wcOrderId: number;
            status: string;
            error?: string;
        }> = [];
        let synced = 0;
        let errors = 0;
        const skipped = wcOrderIds.length - unsyncedIds.length;

        // Add skipped entries to results
        for (const id of wcOrderIds) {
            if (existingSet.has(id)) {
                results.push({ wcOrderId: id, status: 'already_synced' });
            }
        }

        // Process sequentially to avoid invoice ID race conditions
        const client = this.getWcClient();
        for (const wcOrderId of unsyncedIds) {
            try {
                const response = await client.get(`/orders/${wcOrderId}`);
                const wcOrder = response.data;
                const order = await this.createOrderFromWc(wcOrder);

                await this.logSync(
                    SyncDirectionEnum.INBOUND,
                    'order',
                    order.id,
                    SyncLogStatusEnum.SUCCESS,
                    { wcOrderId, invoiceId: order.invoiceId },
                );

                results.push({ wcOrderId, status: 'created' });
                synced++;
            } catch (error: any) {
                this.logger.error(
                    `Bulk sync error for WC #${wcOrderId}: ${error.message}`,
                );

                await this.logSync(
                    SyncDirectionEnum.INBOUND,
                    'order',
                    null,
                    SyncLogStatusEnum.FAILED,
                    { wcOrderId },
                    error.message,
                );

                results.push({
                    wcOrderId,
                    status: 'failed',
                    error: error.message,
                });
                errors++;
            }
        }

        return { synced, skipped, errors, results };
    }

    private async logSync(
        direction: SyncDirectionEnum,
        entityType: string,
        entityId: string | null,
        status: SyncLogStatusEnum,
        payload: Record<string, unknown> | null,
        error?: string | null,
    ): Promise<void> {
        try {
            const log = this.syncLogRepository.create({
                direction,
                entityType,
                entityId,
                status,
                payload,
                error: error || null,
            });
            await this.syncLogRepository.save(log);
        } catch (err: any) {
            this.logger.error(`Failed to write sync log: ${err.message}`);
        }
    }
}
