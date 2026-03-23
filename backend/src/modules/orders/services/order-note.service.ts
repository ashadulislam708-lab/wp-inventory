import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderNote } from '../entities/order-note.entity.js';
import { Order } from '../entities/order.entity.js';
import { CreateOrderNoteDto } from '../dto/create-order-note.dto.js';
import { IJwtPayload } from '../../../shared/interfaces/jwt-payload.js';
import { WooCommerceService } from '../../woocommerce/services/woocommerce.service.js';

@Injectable()
export class OrderNoteService {
    private readonly logger = new Logger(OrderNoteService.name);

    constructor(
        @InjectRepository(OrderNote)
        private readonly orderNoteRepository: Repository<OrderNote>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        private readonly wooCommerceService: WooCommerceService,
    ) {}

    /**
     * Add a note to an order
     */
    async addNote(
        orderId: string,
        dto: CreateOrderNoteDto,
        user: IJwtPayload,
    ): Promise<OrderNote> {
        // Verify order exists
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        const note = this.orderNoteRepository.create({
            orderId,
            content: dto.content,
            createdById: user.id,
        });

        const savedNote = await this.orderNoteRepository.save(note);

        this.logger.log(
            `Note added to order ${order.invoiceId} by user ${user.id}`,
        );

        // Push note to WooCommerce if this is a WC order
        if (order.wcOrderId) {
            this.wooCommerceService
                .addOrderNote(order.wcOrderId, dto.content)
                .catch((err) =>
                    this.logger.error(
                        `Failed to push note to WC order ${order.wcOrderId}: ${err.message}`,
                    ),
                );
        }

        // Return with createdBy relation loaded
        return this.orderNoteRepository.findOne({
            where: { id: savedNote.id },
            relations: ['createdBy'],
        }) as Promise<OrderNote>;
    }

    /**
     * List notes for an order (sorted by createdAt DESC)
     */
    async listNotes(orderId: string): Promise<OrderNote[]> {
        // Verify order exists
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`Order with ID ${orderId} not found`);
        }

        return this.orderNoteRepository.find({
            where: { orderId },
            relations: ['createdBy'],
            order: { createdAt: 'DESC' },
        });
    }
}
