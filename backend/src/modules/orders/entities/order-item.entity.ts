import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity.js';
import { Product } from '../../products/entities/product.entity.js';
import { ProductVariation } from '../../products/entities/product-variation.entity.js';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_id', type: 'uuid' })
    orderId: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ name: 'product_id', type: 'uuid', nullable: true })
    productId: string | null;

    @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'product_id' })
    product: Product | null;

    @Column({ name: 'variation_id', type: 'uuid', nullable: true })
    variationId: string | null;

    @ManyToOne(() => ProductVariation, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'variation_id' })
    variation: ProductVariation | null;

    @Column({ name: 'product_name', type: 'varchar', length: 255 })
    productName: string;

    @Column({
        name: 'variation_label',
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    variationLabel: string | null;

    @Column({ type: 'int' })
    quantity: number;

    @Column({
        name: 'unit_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    unitPrice: number;

    @Column({
        name: 'total_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    totalPrice: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
