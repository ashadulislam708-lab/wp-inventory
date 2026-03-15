import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Order } from '../../orders/entities/order.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { SyncLog } from '../../sync/entities/sync-log.entity.js';
import { OrderStatusEnum } from '../../../shared/enums/order-status.enum.js';
import { SyncLogStatusEnum } from '../../../shared/enums/sync-log-status.enum.js';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(SyncLog)
        private readonly syncLogRepository: Repository<SyncLog>,
    ) {}

    /**
     * Dashboard stats: orders today, revenue, pending orders, failed courier, sync errors
     */
    async getStats() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Total orders today
        const totalOrdersToday = await this.orderRepository.count({
            where: {
                createdAt: Between(todayStart, todayEnd),
            },
        });

        // Revenue today (from delivered or any order today)
        const revenueResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.grandTotal), 0)', 'revenue')
            .where('order.createdAt BETWEEN :start AND :end', {
                start: todayStart,
                end: todayEnd,
            })
            .getRawOne();

        const revenueToday = parseFloat(revenueResult?.revenue || '0');

        // Pending orders count
        const pendingOrdersCount = await this.orderRepository.count({
            where: { status: OrderStatusEnum.PENDING },
        });

        // Failed courier count (orders with null consignment ID)
        const failedCourierCount = await this.orderRepository.count({
            where: {
                courierConsignmentId: IsNull(),
                status: OrderStatusEnum.PENDING,
            },
        });

        // Sync error count (from last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const syncErrorCount = await this.syncLogRepository.count({
            where: {
                status: SyncLogStatusEnum.FAILED,
                createdAt: Between(yesterday, new Date()),
            },
        });

        return {
            totalOrdersToday,
            revenueToday,
            pendingOrdersCount,
            failedCourierCount,
            syncErrorCount,
        };
    }

    /**
     * Products with stock at or below low stock threshold
     */
    async getLowStockProducts() {
        const products = await this.productRepository
            .createQueryBuilder('product')
            .where('product.deletedAt IS NULL')
            .andWhere('product.stockQuantity <= product.lowStockThreshold')
            .orderBy('product.stockQuantity', 'ASC')
            .getMany();

        return {
            data: products.map((p) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                stockQuantity: p.stockQuantity,
                lowStockThreshold: p.lowStockThreshold,
            })),
        };
    }

    /**
     * Last 10 orders with status badges
     */
    async getRecentOrders() {
        const orders = await this.orderRepository.find({
            order: { createdAt: 'DESC' },
            take: 10,
            select: [
                'id',
                'invoiceId',
                'customerName',
                'grandTotal',
                'status',
                'source',
                'createdAt',
            ],
        });

        return {
            data: orders.map((o) => ({
                id: o.id,
                invoiceId: o.invoiceId,
                customerName: o.customerName,
                grandTotal: Number(o.grandTotal),
                status: o.status,
                source: o.source,
                createdAt: o.createdAt,
            })),
        };
    }
}
