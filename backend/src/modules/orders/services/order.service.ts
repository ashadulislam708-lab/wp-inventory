import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Order } from '../entities/order.entity.js';
import { OrderItem } from '../entities/order-item.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { ProductVariation } from '../../products/entities/product-variation.entity.js';
import { StockAdjustmentLog } from '../../products/entities/stock-adjustment-log.entity.js';
import { CreateOrderDto } from '../dto/create-order.dto.js';
import { UpdateOrderDto } from '../dto/update-order.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { ListOrdersDto } from '../dto/list-orders.dto.js';
import { OrderStatusEnum } from '../../../shared/enums/order-status.enum.js';
import { OrderSourceEnum } from '../../../shared/enums/order-source.enum.js';
import { ShippingZoneEnum } from '../../../shared/enums/shipping-zone.enum.js';
import { ShippingPartnerEnum } from '../../../shared/enums/shipping-partner.enum.js';
import { SteadfastService } from '../../../infrastructure/courier/steadfast.service.js';
import { InvoiceService } from '../../invoice/invoice.service.js';
import { WooCommerceService } from '../../woocommerce/services/woocommerce.service.js';
import { IJwtPayload } from '../../../shared/interfaces/jwt-payload.js';
import type { ImportOrdersResponseDto } from '../dto/import-orders.dto.js';
import { restoreOrderItemsStock } from '../../../shared/utils/stock-restoration.util.js';
import { normalizeBDPhone } from '../../../shared/utils/phone.util.js';

const SHIPPING_FEES: Record<ShippingZoneEnum, number> = {
    [ShippingZoneEnum.INSIDE_DHAKA]: 80,
    [ShippingZoneEnum.DHAKA_SUB_AREA]: 100,
    [ShippingZoneEnum.OUTSIDE_DHAKA]: 150,
};

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductVariation)
        private readonly variationRepository: Repository<ProductVariation>,
        @InjectRepository(StockAdjustmentLog)
        private readonly stockLogRepository: Repository<StockAdjustmentLog>,
        private readonly dataSource: DataSource,
        private readonly steadfastService: SteadfastService,
        private readonly invoiceService: InvoiceService,
        private readonly wooCommerceService: WooCommerceService,
    ) {}

    /**
     * List orders with filters and pagination
     */
    async listOrders(dto: ListOrdersDto) {
        const page = dto.page || 1;
        const limit = dto.limit || 25;
        const skip = (page - 1) * limit;

        const qb: SelectQueryBuilder<Order> = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.createdBy', 'createdBy');

        if (dto.status) {
            qb.andWhere('order.status = :status', { status: dto.status });
        }

        if (dto.source) {
            qb.andWhere('order.source = :source', { source: dto.source });
        }

        if (dto.startDate) {
            qb.andWhere('order.createdAt >= :startDate', {
                startDate: new Date(dto.startDate),
            });
        }

        if (dto.endDate) {
            qb.andWhere('order.createdAt <= :endDate', {
                endDate: new Date(dto.endDate),
            });
        }

        if (dto.search) {
            qb.andWhere(
                '(order.invoiceId ILIKE :search OR order.customerName ILIKE :search OR order.customerPhone ILIKE :search)',
                { search: `%${dto.search}%` },
            );
        }

        qb.orderBy('order.createdAt', 'DESC');
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
     * Export orders as CSV
     */
    async exportOrders(dto: ListOrdersDto) {
        // Get all matching orders without pagination
        const allDto = { ...dto, page: 1, limit: 10000 };
        const result = await this.listOrders(allDto);

        const headers = [
            'Invoice ID',
            'Customer Name',
            'Customer Phone',
            'Customer Address',
            'Status',
            'Source',
            'Shipping Zone',
            'Shipping Fee',
            'Subtotal',
            'Grand Total',
            'Courier Tracking',
            'Created At',
        ];

        const rows = result.data.map((order) =>
            [
                order.invoiceId,
                `"${order.customerName}"`,
                order.customerPhone,
                `"${order.customerAddress.replace(/"/g, '""')}"`,
                order.status,
                order.source,
                order.shippingZone,
                order.shippingFee,
                order.subtotal,
                order.grandTotal,
                order.courierTrackingCode || '',
                order.createdAt.toISOString(),
            ].join(','),
        );

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Get order by ID with items
     */
    async getOrderById(id: string) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: [
                'items',
                'items.product',
                'items.variation',
                'createdBy',
            ],
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return order;
    }

    /**
     * Create order with atomic invoice ID, stock decrement, Steadfast push
     */
    async createOrder(dto: CreateOrderDto, user: IJwtPayload) {
        return this.dataSource
            .transaction(async (manager) => {
                // 1. Generate invoice ID atomically via InvoiceService
                const invoiceId =
                    await this.invoiceService.generateNextInvoiceId(manager);

                // 2. Calculate shipping fee
                const shippingFee = SHIPPING_FEES[dto.shippingZone];

                // 3. Process items: validate stock, decrement, calculate totals
                const orderItems: Partial<OrderItem>[] = [];
                const stockDecrementedProducts: {
                    productId: string;
                    variationId: string | null;
                }[] = [];
                let subtotal = 0;

                for (const item of dto.items) {
                    let unitPrice: number;
                    let productName: string;
                    let variationLabel: string | null = null;

                    if (item.variationId) {
                        // Variation product — load with lock only (no relations to avoid TypeORM lock+join issues)
                        const variation = await manager.findOne(
                            ProductVariation,
                            {
                                where: { id: item.variationId },
                                lock: { mode: 'pessimistic_write' },
                            },
                        );

                        if (!variation) {
                            throw new BadRequestException(
                                `Variation ${item.variationId} not found`,
                            );
                        }

                        if (variation.stockQuantity < item.quantity) {
                            throw new BadRequestException(
                                `Insufficient stock for variation (available: ${variation.stockQuantity}, requested: ${item.quantity})`,
                            );
                        }

                        // Decrement variation stock
                        const prevQty = variation.stockQuantity;
                        variation.stockQuantity -= item.quantity;
                        await manager.save(ProductVariation, variation);

                        // Load and update parent product stock separately
                        const parentProduct = await manager.findOne(Product, {
                            where: { id: variation.productId },
                            lock: { mode: 'pessimistic_write' },
                        });
                        if (parentProduct) {
                            parentProduct.stockQuantity -= item.quantity;
                            await manager.save(Product, parentProduct);
                        }

                        // Log stock adjustment
                        await manager.save(
                            manager.create(StockAdjustmentLog, {
                                productId: variation.productId,
                                variationId: variation.id,
                                adjustedById: user.id,
                                previousQty: prevQty,
                                newQty: variation.stockQuantity,
                                reason: `Order Created - ${invoiceId}`,
                            }),
                        );

                        stockDecrementedProducts.push({
                            productId: variation.productId,
                            variationId: variation.id,
                        });

                        unitPrice = Number(
                            variation.salePrice || variation.regularPrice || 0,
                        );
                        productName = parentProduct?.name || 'Unknown Product';
                        const attrs = variation.attributes || {};
                        variationLabel =
                            Object.values(attrs).join(' / ') || null;
                    } else {
                        // Simple product
                        const product = await manager.findOne(Product, {
                            where: { id: item.productId },
                            lock: { mode: 'pessimistic_write' },
                        });

                        if (!product) {
                            throw new BadRequestException(
                                `Product ${item.productId} not found`,
                            );
                        }

                        if (product.stockQuantity < item.quantity) {
                            throw new BadRequestException(
                                `Insufficient stock for ${product.name} (available: ${product.stockQuantity}, requested: ${item.quantity})`,
                            );
                        }

                        // Decrement stock
                        const prevQty = product.stockQuantity;
                        product.stockQuantity -= item.quantity;
                        await manager.save(Product, product);

                        // Log stock adjustment
                        await manager.save(
                            manager.create(StockAdjustmentLog, {
                                productId: product.id,
                                variationId: null,
                                adjustedById: user.id,
                                previousQty: prevQty,
                                newQty: product.stockQuantity,
                                reason: `Order Created - ${invoiceId}`,
                            }),
                        );

                        stockDecrementedProducts.push({
                            productId: product.id,
                            variationId: null,
                        });

                        unitPrice = Number(
                            product.salePrice || product.regularPrice || 0,
                        );
                        productName = product.name;
                    }

                    const totalPrice = unitPrice * item.quantity;
                    subtotal += totalPrice;

                    orderItems.push({
                        productId: item.productId,
                        variationId: item.variationId || null,
                        productName,
                        variationLabel,
                        quantity: item.quantity,
                        unitPrice,
                        totalPrice,
                        stockDecremented: true,
                    });
                }

                const discountAmount = dto.discountAmount ?? 0;
                const advanceAmount = dto.advanceAmount ?? 0;
                const grandTotal = subtotal - discountAmount + shippingFee;

                // 4. Generate QR code data URL (simple text-based URL for tracking)
                const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:8041'}/tracking/${invoiceId}`;
                // Simple QR placeholder - will be a data URL pointing to tracking page
                const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`;

                // 5. Create order
                const order = manager.create(Order, {
                    invoiceId,
                    createdById: user.id,
                    source: OrderSourceEnum.MANUAL,
                    status: OrderStatusEnum.PENDING_PAYMENT,
                    statusHistory: [OrderStatusEnum.PENDING_PAYMENT],
                    customerName: dto.customerName,
                    customerPhone: dto.customerPhone,
                    customerAddress: dto.customerAddress,
                    shippingZone: dto.shippingZone,
                    shippingPartner: dto.shippingPartner,
                    shippingFee,
                    subtotal,
                    grandTotal,
                    discountAmount,
                    advanceAmount,
                    qrCodeDataUrl,
                });

                const savedOrder = await manager.save(Order, order);

                // 6. Create order items
                const savedItems: OrderItem[] = [];
                for (const itemData of orderItems) {
                    const orderItem = manager.create(OrderItem, {
                        ...itemData,
                        orderId: savedOrder.id,
                    });
                    const savedItem = await manager.save(OrderItem, orderItem);
                    savedItems.push(savedItem);
                }

                // 7. Courier push is manual — staff triggers via "Push to Courier" button
                return {
                    order: { ...savedOrder, items: savedItems },
                    stockDecrementedProducts,
                };
            })
            .then(async ({ order, stockDecrementedProducts: decremented }) => {
                // Push updated stock to WooCommerce (non-blocking)
                for (const item of decremented) {
                    this.wooCommerceService
                        .pushStockToWc(item.productId, item.variationId)
                        .catch((err) => {
                            this.logger.error(
                                `Failed to push stock to WC after order ${order.invoiceId} for product ${item.productId}: ${err.message}`,
                            );
                        });
                }

                return order;
            });
    }

    /**
     * Edit order (PENDING/CONFIRMED only)
     */
    async editOrder(id: string, dto: CreateOrderDto, user: IJwtPayload) {
        const existingOrder = await this.getOrderById(id);

        if (
            existingOrder.status !== OrderStatusEnum.PENDING_PAYMENT &&
            existingOrder.status !== OrderStatusEnum.ON_HOLD
        ) {
            throw new BadRequestException(
                `Order can only be edited in Pending payment or On hold status. Current status: ${existingOrder.status}`,
            );
        }

        return this.dataSource
            .transaction(async (manager) => {
                // Track affected products for WC stock push after commit
                const stockAffectedProducts: {
                    productId: string;
                    variationId: string | null;
                }[] = [];

                // Collect old items' product refs for WC sync
                for (const oldItem of existingOrder.items) {
                    if (oldItem.productId && oldItem.stockDecremented) {
                        stockAffectedProducts.push({
                            productId: oldItem.productId,
                            variationId: oldItem.variationId || null,
                        });
                    }
                }

                // 1. Restore old stock (skips items where stockDecremented is false)
                await restoreOrderItemsStock(
                    manager,
                    existingOrder.items,
                    user.id,
                    'Order Edited (Restored)',
                    existingOrder.invoiceId,
                );

                // 2. Remove old order items
                await manager.delete(OrderItem, { orderId: id });

                // 3. Process new items
                const shippingFee = SHIPPING_FEES[dto.shippingZone];
                const newItems: Partial<OrderItem>[] = [];
                let subtotal = 0;

                for (const item of dto.items) {
                    let unitPrice: number;
                    let productName: string;
                    let variationLabel: string | null = null;

                    if (item.variationId) {
                        // Load with lock only (no relations to avoid TypeORM lock+join issues)
                        const variation = await manager.findOne(
                            ProductVariation,
                            {
                                where: { id: item.variationId },
                                lock: { mode: 'pessimistic_write' },
                            },
                        );

                        if (!variation) {
                            throw new BadRequestException(
                                `Variation ${item.variationId} not found`,
                            );
                        }

                        if (variation.stockQuantity < item.quantity) {
                            throw new BadRequestException(
                                `Insufficient stock for variation (available: ${variation.stockQuantity}, requested: ${item.quantity})`,
                            );
                        }

                        const prevQty = variation.stockQuantity;
                        variation.stockQuantity -= item.quantity;
                        await manager.save(ProductVariation, variation);

                        const parentProduct = await manager.findOne(Product, {
                            where: { id: variation.productId },
                            lock: { mode: 'pessimistic_write' },
                        });
                        if (parentProduct) {
                            parentProduct.stockQuantity -= item.quantity;
                            await manager.save(Product, parentProduct);
                        }

                        await manager.save(
                            manager.create(StockAdjustmentLog, {
                                productId: variation.productId,
                                variationId: variation.id,
                                adjustedById: user.id,
                                previousQty: prevQty,
                                newQty: variation.stockQuantity,
                                reason: `Order Edited - ${existingOrder.invoiceId}`,
                            }),
                        );

                        unitPrice = Number(
                            variation.salePrice || variation.regularPrice || 0,
                        );
                        productName = parentProduct?.name || 'Unknown Product';
                        const attrs = variation.attributes || {};
                        variationLabel =
                            Object.values(attrs).join(' / ') || null;
                    } else {
                        const product = await manager.findOne(Product, {
                            where: { id: item.productId },
                            lock: { mode: 'pessimistic_write' },
                        });

                        if (!product) {
                            throw new BadRequestException(
                                `Product ${item.productId} not found`,
                            );
                        }

                        if (product.stockQuantity < item.quantity) {
                            throw new BadRequestException(
                                `Insufficient stock for ${product.name} (available: ${product.stockQuantity}, requested: ${item.quantity})`,
                            );
                        }

                        const prevQty = product.stockQuantity;
                        product.stockQuantity -= item.quantity;
                        await manager.save(Product, product);

                        await manager.save(
                            manager.create(StockAdjustmentLog, {
                                productId: product.id,
                                variationId: null,
                                adjustedById: user.id,
                                previousQty: prevQty,
                                newQty: product.stockQuantity,
                                reason: `Order Edited - ${existingOrder.invoiceId}`,
                            }),
                        );

                        unitPrice = Number(
                            product.salePrice || product.regularPrice || 0,
                        );
                        productName = product.name;
                    }

                    const totalPrice = unitPrice * item.quantity;
                    subtotal += totalPrice;

                    newItems.push({
                        orderId: id,
                        productId: item.productId,
                        variationId: item.variationId || null,
                        productName,
                        variationLabel,
                        quantity: item.quantity,
                        unitPrice,
                        totalPrice,
                        stockDecremented: true,
                    });

                    stockAffectedProducts.push({
                        productId: item.productId,
                        variationId: item.variationId || null,
                    });
                }

                const discountAmount = dto.discountAmount ?? 0;
                const advanceAmount = dto.advanceAmount ?? 0;
                const grandTotal = subtotal - discountAmount + shippingFee;

                // 4. Update order
                await manager.update(Order, id, {
                    customerName: dto.customerName,
                    customerPhone: dto.customerPhone,
                    customerAddress: dto.customerAddress,
                    shippingZone: dto.shippingZone,
                    shippingPartner: dto.shippingPartner,
                    shippingFee,
                    subtotal,
                    grandTotal,
                    discountAmount,
                    advanceAmount,
                });

                // 5. Create new items
                for (const itemData of newItems) {
                    const orderItem = manager.create(OrderItem, itemData);
                    await manager.save(OrderItem, orderItem);
                }

                const updatedOrder = await manager.findOne(Order, {
                    where: { id },
                    relations: ['items'],
                });

                return { order: updatedOrder, stockAffectedProducts };
            })
            .then(async ({ order, stockAffectedProducts: affected }) => {
                if (!order) {
                    throw new NotFoundException(
                        `Order ${id} not found after update`,
                    );
                }

                // Cancel old courier and re-push if shipping partner is Steadfast
                try {
                    if (
                        order.shippingPartner === ShippingPartnerEnum.STEADFAST
                    ) {
                        if (existingOrder.courierConsignmentId) {
                            await this.steadfastService.cancelOrder(
                                existingOrder.courierConsignmentId,
                            );
                        }

                        const courierResult =
                            await this.steadfastService.createOrder({
                                invoice: order.invoiceId,
                                recipient_name: order.customerName,
                                recipient_phone: order.customerPhone,
                                recipient_address: order.customerAddress,
                                cod_amount:
                                    Number(order.grandTotal) -
                                    Number(order.advanceAmount),
                            });

                        if (courierResult) {
                            await this.orderRepository.update(order.id, {
                                courierConsignmentId:
                                    courierResult.consignmentId,
                                courierTrackingCode: courierResult.trackingCode,
                            });
                            order.courierConsignmentId =
                                courierResult.consignmentId;
                            order.courierTrackingCode =
                                courierResult.trackingCode;
                        } else {
                            await this.orderRepository.update(order.id, {
                                courierConsignmentId: null,
                                courierTrackingCode: null,
                            });
                            order.courierConsignmentId = null;
                            order.courierTrackingCode = null;
                        }
                    }
                } catch (err: any) {
                    this.logger.error(
                        `Post-transaction courier push failed for edit ${order.invoiceId}: ${err.message}`,
                    );
                }

                // Push updated stock to WooCommerce (non-blocking)
                // Deduplicate by productId+variationId
                const seen = new Set<string>();
                for (const item of affected) {
                    const key = `${item.productId}:${item.variationId}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    this.wooCommerceService
                        .pushStockToWc(item.productId, item.variationId)
                        .catch((err) => {
                            this.logger.error(
                                `Failed to push stock to WC after edit ${order.invoiceId} for product ${item.productId}: ${err.message}`,
                            );
                        });
                }

                return order;
            });
    }

    /**
     * Update order details (customer info + shipping zone only).
     * Only allowed for orders in PENDING or CONFIRMED status.
     * Does NOT allow changing order items.
     * Recalculates shippingFee and grandTotal when shippingZone changes.
     * Re-pushes to Steadfast if consignment details changed.
     */
    async updateOrderDetails(id: string, dto: UpdateOrderDto) {
        const order = await this.getOrderById(id);

        if (
            order.status !== OrderStatusEnum.PENDING_PAYMENT &&
            order.status !== OrderStatusEnum.ON_HOLD
        ) {
            throw new BadRequestException(
                `Order can only be edited in Pending payment or On hold status. Current status: ${order.status}`,
            );
        }

        const updateData: Partial<Order> = {};

        if (dto.customerName !== undefined) {
            updateData.customerName = dto.customerName;
        }
        if (dto.customerPhone !== undefined) {
            updateData.customerPhone = dto.customerPhone;
        }
        if (dto.customerAddress !== undefined) {
            updateData.customerAddress = dto.customerAddress;
        }

        if (dto.discountAmount !== undefined) {
            updateData.discountAmount = dto.discountAmount;
        }
        if (dto.advanceAmount !== undefined) {
            updateData.advanceAmount = dto.advanceAmount;
        }

        // Recalculate grand total if zone, discount, or advance changed
        const needsRecalc =
            (dto.shippingZone !== undefined &&
                dto.shippingZone !== order.shippingZone) ||
            dto.discountAmount !== undefined ||
            dto.advanceAmount !== undefined;

        if (needsRecalc) {
            const newShippingFee = dto.shippingZone
                ? SHIPPING_FEES[dto.shippingZone]
                : Number(order.shippingFee);
            const newDiscount =
                dto.discountAmount ?? Number(order.discountAmount);

            if (
                dto.shippingZone !== undefined &&
                dto.shippingZone !== order.shippingZone
            ) {
                updateData.shippingZone = dto.shippingZone;
                updateData.shippingFee = newShippingFee;
            }

            updateData.grandTotal =
                Number(order.subtotal) - newDiscount + newShippingFee;
        }

        await this.orderRepository.update(id, updateData);

        // Push WC order notes for advance/discount changes (non-blocking, fire-and-forget)
        if (order.wcOrderId) {
            const oldDiscount = Number(order.discountAmount);
            const oldAdvance = Number(order.advanceAmount);

            if (
                dto.discountAmount !== undefined &&
                dto.discountAmount !== oldDiscount
            ) {
                const note =
                    dto.discountAmount > 0
                        ? `Discount amount updated to ${dto.discountAmount} BDT from Glam Lavish Inventory System`
                        : `Discount amount removed from Glam Lavish Inventory System`;
                this.wooCommerceService.pushOrderNoteToWc(
                    order.wcOrderId,
                    note,
                );
            }

            if (
                dto.advanceAmount !== undefined &&
                dto.advanceAmount !== oldAdvance
            ) {
                const note =
                    dto.advanceAmount > 0
                        ? `Advance amount updated to ${dto.advanceAmount} BDT from Glam Lavish Inventory System`
                        : `Advance amount removed from Glam Lavish Inventory System`;
                this.wooCommerceService.pushOrderNoteToWc(
                    order.wcOrderId,
                    note,
                );
            }
        }

        // Courier re-push is manual — staff triggers via "Push to Courier" button after editing

        // Return updated order with items
        return this.getOrderById(id);
    }

    /**
     * Update order status with side effects
     */
    async updateOrderStatus(
        id: string,
        dto: UpdateOrderStatusDto,
        user: IJwtPayload,
    ) {
        const order = await this.getOrderById(id);

        // Validate status transition
        this.validateStatusTransition(order.status, dto.status);

        const result: {
            id: string;
            invoiceId: string;
            status: OrderStatusEnum;
            stockRestored: boolean;
            courierCancelled: boolean;
        } = {
            id: order.id,
            invoiceId: order.invoiceId,
            status: dto.status,
            stockRestored: false,
            courierCancelled: false,
        };

        const stockRestoreStatuses = [
            OrderStatusEnum.CANCELLED,
            OrderStatusEnum.REFUNDED,
            OrderStatusEnum.FAILED,
            OrderStatusEnum.DRAFT,
        ];
        const courierCancelStatuses = [
            OrderStatusEnum.CANCELLED,
            OrderStatusEnum.FAILED,
        ];

        if (stockRestoreStatuses.includes(dto.status)) {
            const reasonMap: Record<string, string> = {
                [OrderStatusEnum.CANCELLED]: 'Order Cancelled',
                [OrderStatusEnum.REFUNDED]: 'Order Refunded',
                [OrderStatusEnum.FAILED]: 'Order Failed',
                [OrderStatusEnum.DRAFT]: 'Order Reverted to Draft',
            };
            await this.dataSource.transaction(async (manager) => {
                await restoreOrderItemsStock(
                    manager,
                    order.items,
                    user.id,
                    reasonMap[dto.status],
                    order.invoiceId,
                );
            });
            result.stockRestored = true;

            // Push restored stock to WooCommerce (non-blocking)
            for (const item of order.items) {
                if (item.productId) {
                    this.wooCommerceService
                        .pushStockToWc(item.productId, item.variationId || null)
                        .catch((err) => {
                            this.logger.error(
                                `Failed to push stock to WC after ${dto.status} for product ${item.productId}: ${err.message}`,
                            );
                        });
                }
            }

            // Cancel courier for CANCELLED and FAILED only
            if (
                courierCancelStatuses.includes(dto.status) &&
                order.courierConsignmentId
            ) {
                const cancelled = await this.steadfastService.cancelOrder(
                    order.courierConsignmentId,
                );
                result.courierCancelled = cancelled;
            }
        }

        const updatedHistory = [...(order.statusHistory || []), dto.status];
        await this.orderRepository.update(id, {
            status: dto.status,
            statusHistory: updatedHistory,
        });

        return result;
    }

    /**
     * Get invoice data for print -- delegates to InvoiceService
     */
    async getInvoiceData(id: string) {
        return this.invoiceService.getInvoiceDataByOrderId(id);
    }

    /**
     * Get QR code for order
     */
    async getQrCode(id: string) {
        const order = await this.orderRepository.findOne({
            where: { id },
            select: ['id', 'qrCodeDataUrl', 'invoiceId'],
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return {
            invoiceId: order.invoiceId,
            qrCodeDataUrl: order.qrCodeDataUrl,
        };
    }

    /**
     * Retry courier push
     */
    async retryCourier(id: string) {
        const order = await this.orderRepository.findOne({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        if (order.shippingPartner !== ShippingPartnerEnum.STEADFAST) {
            throw new BadRequestException(
                `Courier retry is only supported for Steadfast orders. This order uses: ${order.shippingPartner}`,
            );
        }

        if (order.courierConsignmentId) {
            throw new BadRequestException(
                `Order already has a consignment ID: ${order.courierConsignmentId}`,
            );
        }

        const courierResult = await this.steadfastService.createOrder({
            invoice: order.invoiceId,
            recipient_name: order.customerName,
            recipient_phone: order.customerPhone,
            recipient_address: order.customerAddress,
            cod_amount: Number(order.grandTotal),
        });

        if (!courierResult) {
            throw new BadRequestException(
                'Steadfast courier push failed. Please try again.',
            );
        }

        await this.orderRepository.update(id, {
            courierConsignmentId: courierResult.consignmentId,
            courierTrackingCode: courierResult.trackingCode,
        });

        return {
            id: order.id,
            invoiceId: order.invoiceId,
            courierConsignmentId: courierResult.consignmentId,
            courierTrackingCode: courierResult.trackingCode,
        };
    }

    /**
     * Bulk import orders from CSV file
     * CSV columns: customerName, customerPhone, customerAddress, shippingZone, productSku, quantity
     * Each row creates a single order with a single item
     */
    async importOrdersFromCsv(
        fileBuffer: Buffer,
        user: IJwtPayload,
    ): Promise<ImportOrdersResponseDto> {
        const content = fileBuffer.toString('utf-8');
        const lines = content
            .split(/\r?\n/)
            .filter((line) => line.trim() !== '');

        if (lines.length < 2) {
            throw new BadRequestException(
                'CSV file must contain a header row and at least one data row',
            );
        }

        // Parse header
        const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const requiredColumns = [
            'customername',
            'customerphone',
            'customeraddress',
            'shippingzone',
            'productsku',
            'quantity',
        ];

        for (const col of requiredColumns) {
            if (!header.includes(col)) {
                throw new BadRequestException(
                    `Missing required CSV column: ${col}. Required columns: customerName, customerPhone, customerAddress, shippingZone, productSku, quantity`,
                );
            }
        }

        const colIndex = {
            customerName: header.indexOf('customername'),
            customerPhone: header.indexOf('customerphone'),
            customerAddress: header.indexOf('customeraddress'),
            shippingZone: header.indexOf('shippingzone'),
            productSku: header.indexOf('productsku'),
            quantity: header.indexOf('quantity'),
        };

        let imported = 0;
        const errors: Array<{ row: number; error: string }> = [];

        // Process each data row
        for (let i = 1; i < lines.length; i++) {
            const rowNum = i; // 1-based row number (excluding header)
            const values = this.parseCsvLine(lines[i]);

            try {
                const customerName = values[colIndex.customerName]?.trim();
                const customerPhone = values[colIndex.customerPhone]?.trim();
                const customerAddress =
                    values[colIndex.customerAddress]?.trim();
                const shippingZoneRaw = values[colIndex.shippingZone]
                    ?.trim()
                    .toUpperCase();
                const productSku = values[colIndex.productSku]?.trim();
                const quantityStr = values[colIndex.quantity]?.trim();

                // Validate required fields
                if (!customerName) {
                    throw new Error('customerName is required');
                }
                if (!customerPhone) {
                    throw new Error('customerPhone is required');
                }
                if (!customerAddress) {
                    throw new Error('customerAddress is required');
                }
                if (!shippingZoneRaw) {
                    throw new Error('shippingZone is required');
                }
                if (!productSku) {
                    throw new Error('productSku is required');
                }
                if (!quantityStr) {
                    throw new Error('quantity is required');
                }

                // Validate shipping zone
                const shippingZone = shippingZoneRaw as ShippingZoneEnum;
                if (!Object.values(ShippingZoneEnum).includes(shippingZone)) {
                    throw new Error(
                        `Invalid shippingZone: ${shippingZoneRaw}. Must be one of: ${Object.values(ShippingZoneEnum).join(', ')}`,
                    );
                }

                // Validate quantity
                const quantity = parseInt(quantityStr, 10);
                if (isNaN(quantity) || quantity < 1) {
                    throw new Error('quantity must be a positive integer');
                }

                // Find product by SKU
                const product = await this.productRepository.findOne({
                    where: { sku: productSku },
                });

                if (!product) {
                    throw new Error(
                        `Product with SKU "${productSku}" not found`,
                    );
                }

                // Create the order using the existing createOrder flow
                const createOrderDto: CreateOrderDto = {
                    customerName,
                    customerPhone,
                    customerAddress,
                    shippingZone,
                    shippingPartner: ShippingPartnerEnum.STEADFAST,
                    items: [
                        {
                            productId: product.id,
                            variationId: null,
                            quantity,
                        },
                    ],
                };

                await this.createOrder(createOrderDto, user);
                imported++;
            } catch (err: any) {
                errors.push({
                    row: rowNum,
                    error: err.message || 'Unknown error',
                });
            }
        }

        this.logger.log(
            `CSV import completed: ${imported} imported, ${errors.length} failed`,
        );

        return {
            imported,
            failed: errors.length,
            errors,
        };
    }

    // ============================
    // Private helper methods
    // ============================

    /**
     * Simple CSV line parser that handles quoted fields
     */
    private parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (inQuotes) {
                if (char === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        // Escaped quote
                        current += '"';
                        i++;
                    } else {
                        // End of quoted field
                        inQuotes = false;
                    }
                } else {
                    current += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
        }

        result.push(current);
        return result;
    }

    /**
     * Validate order status transitions
     * Free transitions: any status can move to any other status.
     * Only blocks transitioning to the same status.
     */
    private validateStatusTransition(
        currentStatus: OrderStatusEnum,
        newStatus: OrderStatusEnum,
    ): void {
        if (currentStatus === newStatus) {
            throw new BadRequestException(
                `Order is already in ${currentStatus} status`,
            );
        }
    }

    /**
     * Get customer order history stats by phone number
     */
    async getCustomerHistory(phone: string): Promise<{
        completed: number;
        refunded: number;
        cancelled: number;
        total: number;
        names: string[];
        addresses: string[];
    }> {
        const normalized = normalizeBDPhone(phone);
        const phoneWhereClause = `REPLACE(REPLACE(order.customer_phone, '+880', ''), '880', '') = :normalized`;

        const [result, identities] = await Promise.all([
            this.orderRepository
                .createQueryBuilder('order')
                .select([
                    `COUNT(*) FILTER (WHERE order.status = :completed) AS "completed"`,
                    `COUNT(*) FILTER (WHERE order.status = :refunded) AS "refunded"`,
                    `COUNT(*) FILTER (WHERE order.status = :cancelled) AS "cancelled"`,
                    `COUNT(*) AS "total"`,
                ])
                .where(phoneWhereClause, {
                    normalized,
                    completed: OrderStatusEnum.COMPLETED,
                    refunded: OrderStatusEnum.REFUNDED,
                    cancelled: OrderStatusEnum.CANCELLED,
                })
                .getRawOne(),
            this.orderRepository
                .createQueryBuilder('order')
                .select('order.customer_name', 'name')
                .addSelect('order.customer_address', 'address')
                .where(phoneWhereClause, { normalized })
                .groupBy('order.customer_name')
                .addGroupBy('order.customer_address')
                .getRawMany(),
        ]);

        const names = [
            ...new Set(identities.map((r: { name: string }) => r.name)),
        ];
        const addresses = [
            ...new Set(identities.map((r: { address: string }) => r.address)),
        ];

        return {
            completed: parseInt(result?.completed, 10) || 0,
            refunded: parseInt(result?.refunded, 10) || 0,
            cancelled: parseInt(result?.cancelled, 10) || 0,
            total: parseInt(result?.total, 10) || 0,
            names,
            addresses,
        };
    }
}
