import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Product } from './product.entity.js';
import { ProductVariation } from './product-variation.entity.js';
import { User } from '../../users/user.entity.js';

@Index('IDX_stock_adjustment_logs_product_created', ['productId', 'createdAt'])
@Entity('stock_adjustment_logs')
export class StockAdjustmentLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id', type: 'uuid' })
    productId: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ name: 'variation_id', type: 'uuid', nullable: true })
    variationId: string | null;

    @ManyToOne(() => ProductVariation, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'variation_id' })
    variation: ProductVariation | null;

    @Column({ name: 'adjusted_by_id', type: 'uuid', nullable: true })
    adjustedById: string | null;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'adjusted_by_id' })
    adjustedBy: User | null;

    @Column({ name: 'previous_qty', type: 'int' })
    previousQty: number;

    @Column({ name: 'new_qty', type: 'int' })
    newQty: number;

    @Column({ type: 'varchar', length: 255 })
    reason: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
