import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeatureResponseDto {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Unique feature ID (UUID)',
    })
    id: string;

    @ApiProperty({
        example: 'Premium Wireless Headphones',
        description: 'Feature name',
    })
    name: string;

    @ApiPropertyOptional({
        example: 'High-quality wireless headphones with noise cancellation',
        description: 'Feature description',
    })
    description?: string;

    @ApiProperty({
        example: 199.99,
        description: 'Price in USD',
    })
    price: number;

    @ApiPropertyOptional({
        example: 'FEAT-WH-2024-001',
        description: 'Unique SKU',
    })
    sku?: string;

    @ApiProperty({
        example: 150,
        description: 'Stock quantity',
    })
    stock: number;

    @ApiProperty({
        example: false,
        description: 'Is featured',
    })
    isFeatured: boolean;

    @ApiProperty({
        example: true,
        description: 'Is active',
    })
    isActive: boolean;

    @ApiPropertyOptional({
        example: ['electronics', 'audio', 'wireless'],
        description: 'Tags',
        type: [String],
    })
    tags?: string[];

    @ApiPropertyOptional({
        example: 'Electronics',
        description: 'Category',
    })
    category?: string;

    @ApiProperty({
        example: 4.7,
        description: 'Average rating',
    })
    rating: number;

    @ApiProperty({
        example: 89,
        description: 'Review count',
    })
    reviewCount: number;

    @ApiPropertyOptional({
        example: 'Sony',
        description: 'Brand',
    })
    brand?: string;

    @ApiProperty({
        example: '2024-11-06T10:30:00.000Z',
        description: 'Creation timestamp',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2024-11-06T15:45:00.000Z',
        description: 'Last update timestamp',
    })
    updatedAt: Date;

    @ApiPropertyOptional({
        example: null,
        description: 'Deletion timestamp (soft delete)',
    })
    deletedAt?: Date;
}
