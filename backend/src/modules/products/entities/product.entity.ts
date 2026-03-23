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
import { Category } from '../../categories/entities/category.entity.js';
import { ProductTypeEnum } from '../../../shared/enums/product-type.enum.js';
import { SyncStatusEnum } from '../../../shared/enums/sync-status.enum.js';
import { ProductVariation } from './product-variation.entity.js';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'short_description', type: 'text', nullable: true })
    shortDescription: string | null;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ name: 'image_url', type: 'text', nullable: true })
    imageUrl: string | null;

    @Index('IDX_products_sku')
    @Column({ type: 'varchar', length: 100, nullable: true })
    sku: string | null;

    @Column({
        type: 'enum',
        enum: ProductTypeEnum,
        default: ProductTypeEnum.SIMPLE,
    })
    type: ProductTypeEnum;

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

    @Column({ name: 'low_stock_threshold', type: 'int', default: 5 })
    lowStockThreshold: number;

    @Index('IDX_products_wc_id', { unique: true })
    @Column({ name: 'wc_id', type: 'int', unique: true })
    wcId: number;

    @Column({ name: 'wc_permalink', type: 'text', nullable: true })
    wcPermalink: string | null;

    @Index('IDX_products_sync_status')
    @Column({
        name: 'sync_status',
        type: 'enum',
        enum: SyncStatusEnum,
        default: SyncStatusEnum.SYNCED,
    })
    syncStatus: SyncStatusEnum;

    @Column({ name: 'wc_last_synced_at', type: 'timestamp', nullable: true })
    wcLastSyncedAt: Date | null;

    @Column({ name: 'category_id', type: 'uuid', nullable: true })
    categoryId: string | null;

    @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'category_id' })
    category: Category | null;

    @OneToMany(() => ProductVariation, (variation) => variation.product, {
        cascade: true,
    })
    variations: ProductVariation[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @Index('IDX_products_deleted_at')
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;
}
