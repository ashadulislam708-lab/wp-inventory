import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('features')
export class Feature extends BaseEntity {
    @ApiProperty({
        example: 'Premium Wireless Headphones',
        description: 'Feature name',
        maxLength: 255,
    })
    @Column({ length: 255 })
    name: string;

    @ApiPropertyOptional({
        example:
            'High-quality wireless headphones with active noise cancellation and 30-hour battery life',
        description: 'Detailed feature description',
    })
    @Column({ type: 'text', nullable: true })
    description?: string;

    @ApiProperty({
        example: 199.99,
        description: 'Feature price in USD',
        minimum: 0,
    })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @ApiPropertyOptional({
        example: 'FEAT-WH-2024-001',
        description: 'Unique feature SKU',
    })
    @Column({ unique: true, nullable: true })
    sku?: string;

    @ApiProperty({
        example: 150,
        description: 'Available stock quantity',
        minimum: 0,
    })
    @Column({ type: 'int', default: 0 })
    stock: number;

    @ApiProperty({
        example: false,
        description: 'Whether feature is featured/highlighted',
    })
    @Column({ default: false })
    isFeatured: boolean;

    @ApiProperty({
        example: true,
        description: 'Whether feature is active and visible to users',
    })
    @Column({ default: true })
    isActive: boolean;

    @ApiProperty({
        example: 4.7,
        description: 'Average rating from 0 to 5',
        minimum: 0,
        maximum: 5,
    })
    @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
    rating: number;

    @ApiProperty({
        example: 89,
        description: 'Total number of reviews',
        minimum: 0,
    })
    @Column({ type: 'int', default: 0 })
    reviewCount: number;

    @ApiPropertyOptional({
        example: 'Sony',
        description: 'Feature manufacturer/brand',
    })
    @Column({ nullable: true })
    brand?: string;
}
