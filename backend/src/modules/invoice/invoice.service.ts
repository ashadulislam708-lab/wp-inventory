import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { InvoiceCounter } from './entities/invoice-counter.entity.js';
import { Order } from '../orders/entities/order.entity.js';

@Injectable()
export class InvoiceService {
    private readonly logger = new Logger(InvoiceService.name);

    constructor(
        @InjectRepository(InvoiceCounter)
        private readonly invoiceCounterRepository: Repository<InvoiceCounter>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Generate next invoice ID atomically using SELECT...FOR UPDATE row-level locking.
     * Invoice format: GL-{lastNum padded to minimum 4 digits}
     * No yearly reset -- increments indefinitely.
     *
     * This method MUST be called within a transaction (pass the EntityManager).
     */
    async generateNextInvoiceId(manager: EntityManager): Promise<string> {
        // Use raw query for row-level locking
        const result = await manager.query(
            `SELECT last_num FROM invoice_counter WHERE id = 1 FOR UPDATE`,
        );

        let lastNum: number;

        if (!result || result.length === 0) {
            // Create the singleton row if it does not exist
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

        // Pad to minimum 4 digits
        const padded = String(nextNum).padStart(4, '0');
        return `GL-${padded}`;
    }

    /**
     * Get the current last invoice number (read-only, no locking).
     */
    async getCurrentInvoiceNumber(): Promise<number> {
        const result = await this.invoiceCounterRepository.findOne({
            where: { id: 1 },
        });
        return result?.lastNum ?? 0;
    }

    /**
     * Get invoice data for an order (formatted for thermal printing).
     * Returns all data needed for a 3x4 inch thermal receipt.
     */
    async getInvoiceDataByOrderId(orderId: string) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: [
                'items',
                'items.product',
                'items.variation',
                'createdBy',
            ],
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        return {
            invoiceId: order.invoiceId,
            date: order.createdAt,
            courierName:
                (
                    {
                        STEADFAST: 'Steadfast',
                        PATHAO: 'Pathao',
                        CARRYBEE: 'CarryBee',
                        REDX: 'RedX',
                    } as Record<string, string>
                )[order.shippingPartner] ?? order.shippingPartner,
            trackingCode: order.courierTrackingCode,
            deliveryId: order.courierConsignmentId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            items: order.items.map((item) => ({
                name: item.productName,
                variation: item.variationLabel,
                quantity: item.quantity,
                price: Number(item.unitPrice),
            })),
            subtotal: Number(order.subtotal),
            discountAmount: Number(order.discountAmount),
            shippingFee: Number(order.shippingFee),
            grandTotal: Number(order.grandTotal),
            advanceAmount: Number(order.advanceAmount),
            dueAmount: Number(order.grandTotal) - Number(order.advanceAmount),
            qrCodeDataUrl: order.qrCodeDataUrl,
        };
    }
}
