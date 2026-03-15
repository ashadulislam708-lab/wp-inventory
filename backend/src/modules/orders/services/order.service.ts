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
import { IJwtPayload } from '../../../shared/interfaces/jwt-payload.js';
import type { ImportOrdersResponseDto } from '../dto/import-orders.dto.js';

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
                let subtotal = 0;

                for (const item of dto.items) {
                    let unitPrice: number;
                    let productName: string;
                    let variationLabel: string | null = null;

                    if (item.variationId) {
                        // Variation product
                        const variation = await manager.findOne(
                            ProductVariation,
                            {
                                where: { id: item.variationId },
                                relations: ['product'],
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

                        // Also update parent product stock
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

                        unitPrice = Number(
                            variation.salePrice || variation.regularPrice || 0,
                        );
                        productName =
                            variation.product?.name || 'Unknown Product';
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
                    });
                }

                const grandTotal = subtotal + shippingFee;

                // 4. Generate QR code data URL (simple text-based URL for tracking)
                const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:8041'}/tracking/${invoiceId}`;
                // Simple QR placeholder - will be a data URL pointing to tracking page
                const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`;

                // 5. Create order
                const order = manager.create(Order, {
                    invoiceId,
                    createdById: user.id,
                    source: OrderSourceEnum.MANUAL,
                    status: OrderStatusEnum.PENDING,
                    customerName: dto.customerName,
                    customerPhone: dto.customerPhone,
                    customerAddress: dto.customerAddress,
                    shippingZone: dto.shippingZone,
                    shippingPartner: dto.shippingPartner,
                    shippingFee,
                    subtotal,
                    grandTotal,
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

                // 7. Push to Steadfast (outside transaction - if it fails, order still created)
                // We'll do this after the transaction commits
                return { ...savedOrder, items: savedItems };
            })
            .then(async (order) => {
                // Push to Steadfast after transaction commits
                const courierResult = await this.steadfastService.createOrder({
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
                    order.courierConsignmentId = courierResult.consignmentId;
                    order.courierTrackingCode = courierResult.trackingCode;
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
            existingOrder.status !== OrderStatusEnum.PENDING &&
            existingOrder.status !== OrderStatusEnum.CONFIRMED
        ) {
            throw new BadRequestException(
                `Order can only be edited in PENDING or CONFIRMED status. Current status: ${existingOrder.status}`,
            );
        }

        return this.dataSource
            .transaction(async (manager) => {
                // 1. Restore old stock
                for (const oldItem of existingOrder.items) {
                    if (oldItem.variationId) {
                        const variation = await manager.findOne(
                            ProductVariation,
                            {
                                where: { id: oldItem.variationId },
                                lock: { mode: 'pessimistic_write' },
                            },
                        );
                        if (variation) {
                            const prevQty = variation.stockQuantity;
                            variation.stockQuantity += oldItem.quantity;
                            await manager.save(ProductVariation, variation);

                            // Update parent product
                            const product = await manager.findOne(Product, {
                                where: { id: oldItem.productId! },
                                lock: { mode: 'pessimistic_write' },
                            });
                            if (product) {
                                product.stockQuantity += oldItem.quantity;
                                await manager.save(Product, product);
                            }

                            await manager.save(
                                manager.create(StockAdjustmentLog, {
                                    productId: oldItem.productId!,
                                    variationId: oldItem.variationId,
                                    adjustedById: user.id,
                                    previousQty: prevQty,
                                    newQty: variation.stockQuantity,
                                    reason: `Order Edited (Restored) - ${existingOrder.invoiceId}`,
                                }),
                            );
                        }
                    } else if (oldItem.productId) {
                        const product = await manager.findOne(Product, {
                            where: { id: oldItem.productId },
                            lock: { mode: 'pessimistic_write' },
                        });
                        if (product) {
                            const prevQty = product.stockQuantity;
                            product.stockQuantity += oldItem.quantity;
                            await manager.save(Product, product);

                            await manager.save(
                                manager.create(StockAdjustmentLog, {
                                    productId: product.id,
                                    variationId: null,
                                    adjustedById: user.id,
                                    previousQty: prevQty,
                                    newQty: product.stockQuantity,
                                    reason: `Order Edited (Restored) - ${existingOrder.invoiceId}`,
                                }),
                            );
                        }
                    }
                }

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
                        const variation = await manager.findOne(
                            ProductVariation,
                            {
                                where: { id: item.variationId },
                                relations: ['product'],
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
                        productName =
                            variation.product?.name || 'Unknown Product';
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
                    });
                }

                const grandTotal = subtotal + shippingFee;

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
                });

                // 5. Create new items
                for (const itemData of newItems) {
                    const orderItem = manager.create(OrderItem, itemData);
                    await manager.save(OrderItem, orderItem);
                }

                return manager.findOne(Order, {
                    where: { id },
                    relations: ['items'],
                });
            })
            .then(async (order) => {
                if (!order) {
                    throw new NotFoundException(
                        `Order ${id} not found after update`,
                    );
                }

                // Cancel old courier and re-push if order had a consignment
                if (existingOrder.courierConsignmentId) {
                    await this.steadfastService.cancelOrder(
                        existingOrder.courierConsignmentId,
                    );
                }

                // Re-push to Steadfast
                const courierResult = await this.steadfastService.createOrder({
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
                    order.courierConsignmentId = courierResult.consignmentId;
                    order.courierTrackingCode = courierResult.trackingCode;
                } else {
                    await this.orderRepository.update(order.id, {
                        courierConsignmentId: null,
                        courierTrackingCode: null,
                    });
                    order.courierConsignmentId = null;
                    order.courierTrackingCode = null;
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
            order.status !== OrderStatusEnum.PENDING &&
            order.status !== OrderStatusEnum.CONFIRMED
        ) {
            throw new BadRequestException(
                `Order can only be edited in PENDING or CONFIRMED status. Current status: ${order.status}`,
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

        // Recalculate shipping fee and grand total if zone changed
        if (
            dto.shippingZone !== undefined &&
            dto.shippingZone !== order.shippingZone
        ) {
            const newShippingFee = SHIPPING_FEES[dto.shippingZone];
            updateData.shippingZone = dto.shippingZone;
            updateData.shippingFee = newShippingFee;
            updateData.grandTotal = Number(order.subtotal) + newShippingFee;
        }

        await this.orderRepository.update(id, updateData);

        // Determine if consignment-relevant fields changed (name, phone, address, or amount)
        const consignmentDetailsChanged =
            dto.customerName !== undefined ||
            dto.customerPhone !== undefined ||
            dto.customerAddress !== undefined ||
            (dto.shippingZone !== undefined &&
                dto.shippingZone !== order.shippingZone);

        // Re-push to Steadfast if consignment details changed
        if (consignmentDetailsChanged && order.courierConsignmentId) {
            // Cancel old consignment
            await this.steadfastService.cancelOrder(order.courierConsignmentId);

            // Get updated order data
            const updatedOrder = await this.orderRepository.findOne({
                where: { id },
            });

            if (updatedOrder) {
                const courierResult = await this.steadfastService.createOrder({
                    invoice: updatedOrder.invoiceId,
                    recipient_name: updatedOrder.customerName,
                    recipient_phone: updatedOrder.customerPhone,
                    recipient_address: updatedOrder.customerAddress,
                    cod_amount: Number(updatedOrder.grandTotal),
                });

                if (courierResult) {
                    await this.orderRepository.update(id, {
                        courierConsignmentId: courierResult.consignmentId,
                        courierTrackingCode: courierResult.trackingCode,
                    });
                } else {
                    await this.orderRepository.update(id, {
                        courierConsignmentId: null,
                        courierTrackingCode: null,
                    });
                }
            }
        }

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

        if (
            dto.status === OrderStatusEnum.CANCELLED ||
            dto.status === OrderStatusEnum.RETURNED
        ) {
            // Restore stock for all items
            await this.restoreOrderStock(order, user, dto.status);
            result.stockRestored = true;

            // Cancel courier for CANCELLED only (not RETURNED)
            if (
                dto.status === OrderStatusEnum.CANCELLED &&
                order.courierConsignmentId
            ) {
                const cancelled = await this.steadfastService.cancelOrder(
                    order.courierConsignmentId,
                );
                result.courierCancelled = cancelled;
            }
        }

        await this.orderRepository.update(id, { status: dto.status });

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
     * Retry Steadfast courier push
     */
    async retryCourier(id: string) {
        const order = await this.orderRepository.findOne({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
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
     * Restore stock for all items in an order
     */
    private async restoreOrderStock(
        order: Order,
        user: IJwtPayload,
        reason: OrderStatusEnum,
    ): Promise<void> {
        const reasonText =
            reason === OrderStatusEnum.CANCELLED
                ? 'Order Cancelled'
                : 'Order Returned';

        await this.dataSource.transaction(async (manager) => {
            for (const item of order.items) {
                if (item.variationId) {
                    const variation = await manager.findOne(ProductVariation, {
                        where: { id: item.variationId },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (variation) {
                        const prevQty = variation.stockQuantity;
                        variation.stockQuantity += item.quantity;
                        await manager.save(ProductVariation, variation);

                        const product = await manager.findOne(Product, {
                            where: { id: item.productId! },
                            lock: { mode: 'pessimistic_write' },
                        });
                        if (product) {
                            product.stockQuantity += item.quantity;
                            await manager.save(Product, product);
                        }

                        await manager.save(
                            manager.create(StockAdjustmentLog, {
                                productId: item.productId!,
                                variationId: item.variationId,
                                adjustedById: user.id,
                                previousQty: prevQty,
                                newQty: variation.stockQuantity,
                                reason: `${reasonText} - ${order.invoiceId}`,
                            }),
                        );
                    }
                } else if (item.productId) {
                    const product = await manager.findOne(Product, {
                        where: { id: item.productId },
                        lock: { mode: 'pessimistic_write' },
                    });
                    if (product) {
                        const prevQty = product.stockQuantity;
                        product.stockQuantity += item.quantity;
                        await manager.save(Product, product);

                        await manager.save(
                            manager.create(StockAdjustmentLog, {
                                productId: product.id,
                                variationId: null,
                                adjustedById: user.id,
                                previousQty: prevQty,
                                newQty: product.stockQuantity,
                                reason: `${reasonText} - ${order.invoiceId}`,
                            }),
                        );
                    }
                }
            }
        });
    }

    /**
     * Validate order status transitions
     */
    private validateStatusTransition(
        currentStatus: OrderStatusEnum,
        newStatus: OrderStatusEnum,
    ): void {
        const allowedTransitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
            [OrderStatusEnum.PENDING]: [
                OrderStatusEnum.CONFIRMED,
                OrderStatusEnum.CANCELLED,
            ],
            [OrderStatusEnum.CONFIRMED]: [
                OrderStatusEnum.PROCESSING,
                OrderStatusEnum.CANCELLED,
            ],
            [OrderStatusEnum.PROCESSING]: [OrderStatusEnum.SHIPPED],
            [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED],
            [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.RETURNED],
            [OrderStatusEnum.CANCELLED]: [],
            [OrderStatusEnum.RETURNED]: [],
        };

        const allowed = allowedTransitions[currentStatus];
        if (!allowed || !allowed.includes(newStatus)) {
            throw new BadRequestException(
                `Cannot transition from ${currentStatus} to ${newStatus}`,
            );
        }
    }
}
