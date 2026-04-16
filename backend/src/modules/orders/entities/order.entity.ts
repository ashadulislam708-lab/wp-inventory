import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/user.entity.js';
import { OrderStatusEnum } from '../../../shared/enums/order-status.enum.js';
import { OrderSourceEnum } from '../../../shared/enums/order-source.enum.js';
import { ShippingZoneEnum } from '../../../shared/enums/shipping-zone.enum.js';
import { ShippingPartnerEnum } from '../../../shared/enums/shipping-partner.enum.js';
import { OrderItem } from './order-item.entity.js';
import { OrderNote } from './order-note.entity.js';

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index('IDX_orders_invoice_id', { unique: true })
    @Column({ name: 'invoice_id', type: 'varchar', length: 20, unique: true })
    invoiceId: string;

    @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
    createdById: string | null;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'created_by_id' })
    createdBy: User | null;

    @Index('IDX_orders_source')
    @Column({
        type: 'enum',
        enum: OrderSourceEnum,
        default: OrderSourceEnum.MANUAL,
    })
    source: OrderSourceEnum;

    @Index('IDX_orders_status')
    @Column({
        type: 'varchar',
        length: 50,
        default: OrderStatusEnum.PENDING_PAYMENT,
    })
    status: OrderStatusEnum;

    @Column({ name: 'customer_name', type: 'varchar', length: 255 })
    customerName: string;

    @Column({ name: 'customer_phone', type: 'varchar', length: 20 })
    customerPhone: string;

    @Column({ name: 'customer_address', type: 'text' })
    customerAddress: string;

    @Column({
        name: 'shipping_zone',
        type: 'enum',
        enum: ShippingZoneEnum,
    })
    shippingZone: ShippingZoneEnum;

    @Column({
        name: 'shipping_partner',
        type: 'enum',
        enum: ShippingPartnerEnum,
        default: ShippingPartnerEnum.STEADFAST,
    })
    shippingPartner: ShippingPartnerEnum;

    @Column({
        name: 'shipping_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    shippingFee: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;

    @Column({ name: 'grand_total', type: 'decimal', precision: 10, scale: 2 })
    grandTotal: number;

    @Column({
        name: 'discount_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    })
    discountAmount: number;

    @Column({
        name: 'advance_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    })
    advanceAmount: number;

    @Index('IDX_orders_courier_consignment_id')
    @Column({
        name: 'courier_consignment_id',
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    courierConsignmentId: string | null;

    @Column({
        name: 'courier_tracking_code',
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    courierTrackingCode: string | null;

    @Column({
        name: 'courier_tracking_url',
        type: 'varchar',
        length: 500,
        nullable: true,
    })
    courierTrackingUrl: string | null;

    @Column({ name: 'qr_code_data_url', type: 'text', nullable: true })
    qrCodeDataUrl: string | null;

    @Column({ name: 'wc_order_id', type: 'int', nullable: true, unique: true })
    wcOrderId: number | null;

    @Column({
        name: 'wc_shipping_cost',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    wcShippingCost: number | null;

    @Column({
        name: 'status_history',
        type: 'jsonb',
        default: '[]',
    })
    statusHistory: string[];

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
    items: OrderItem[];

    @OneToMany(() => OrderNote, (note) => note.order)
    notes: OrderNote[];

    @Index('IDX_orders_created_at')
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;
}
