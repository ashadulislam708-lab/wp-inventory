import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Product } from './product.entity.js';

@Entity('product_variations')
export class ProductVariation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id', type: 'uuid' })
    productId: string;

    @ManyToOne(() => Product, (product) => product.variations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ type: 'varchar', length: 100, nullable: true })
    sku: string | null;

    @Column({ type: 'jsonb', default: () => "'{}'" })
    attributes: Record<string, string>;

    @Column({
        name: 'regular_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    regularPrice: number | null;

    @Column({
        name: 'sale_price',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    })
    salePrice: number | null;

    @Column({ name: 'stock_quantity', type: 'int', default: 0 })
    stockQuantity: number;

    @Column({ name: 'image_url', type: 'text', nullable: true })
    imageUrl: string | null;

    @Index('IDX_product_variations_wc_id', { unique: true })
    @Column({ name: 'wc_id', type: 'int', unique: true })
    wcId: number;

    @Column({ name: 'wc_last_synced_at', type: 'timestamp', nullable: true })
    wcLastSyncedAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
