import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../orders/entities/order.entity.js';
import { OrderStatusEnum } from '../../../shared/enums/order-status.enum.js';

export interface StatusTimelineEntry {
    status: string;
    timestamp: string | null;
    active: boolean;
}

@Injectable()
export class TrackingService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) {}

    /**
     * Get public tracking data by invoice ID
     * Returns masked customer name, status timeline, courier info
     */
    async getTrackingByInvoiceId(invoiceId: string) {
        const order = await this.orderRepository.findOne({
            where: { invoiceId },
        });

        if (!order) {
            throw new NotFoundException(
                `Order with invoice ID ${invoiceId} not found`,
            );
        }

        // Mask customer name for privacy
        const maskedName = this.maskName(order.customerName);

        // Build status timeline
        const statusTimeline = this.buildTimeline(order);

        // Build courier tracking URL
        let courierTrackingUrl: string | null = null;
        if (order.courierTrackingCode) {
            courierTrackingUrl = `https://steadfast.com.bd/tracking/${order.courierTrackingCode}`;
        }

        return {
            invoiceId: order.invoiceId,
            orderDate: order.createdAt,
            customerName: maskedName,
            status: order.status,
            statusTimeline,
            courierName:
                (
                    {
                        STEADFAST: 'Steadfast',
                        PATHAO: 'Pathao',
                        CARRYBEE: 'CarryBee',
                        REDX: 'RedX',
                    } as Record<string, string>
                )[order.shippingPartner] ?? order.shippingPartner,
            courierTrackingCode: order.courierTrackingCode,
            courierTrackingUrl,
        };
    }

    /**
     * Mask customer name for privacy
     * "John Doe" -> "J*** D**"
     */
    private maskName(name: string): string {
        return name
            .split(' ')
            .map((part) => {
                if (part.length <= 1) return part;
                return part[0] + '*'.repeat(part.length - 1);
            })
            .join(' ');
    }

    /**
     * Build status timeline based on order flow
     */
    private buildTimeline(order: Order): StatusTimelineEntry[] {
        const progressStatuses = [
            OrderStatusEnum.PENDING_PAYMENT,
            OrderStatusEnum.ON_HOLD,
            OrderStatusEnum.PROCESSING,
            OrderStatusEnum.COMPLETED,
        ];

        const terminalStatuses = [
            OrderStatusEnum.CANCELLED,
            OrderStatusEnum.REFUNDED,
            OrderStatusEnum.FAILED,
        ];

        // If in a terminal status, show a simpler timeline
        if (terminalStatuses.includes(order.status)) {
            return [
                {
                    status: 'Pending payment',
                    timestamp: order.createdAt.toISOString(),
                    active: true,
                },
                {
                    status: order.status,
                    timestamp: order.updatedAt.toISOString(),
                    active: true,
                },
            ];
        }

        const currentIdx = progressStatuses.indexOf(order.status);

        return progressStatuses.map((status, idx) => ({
            status,
            timestamp: idx <= currentIdx ? order.createdAt.toISOString() : null,
            active: idx <= currentIdx,
        }));
    }
}
