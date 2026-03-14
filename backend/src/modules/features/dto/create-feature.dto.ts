import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsArray,
    Min,
    Max,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateFeatureDto {
    @ApiProperty({
        example: 'Premium Wireless Headphones',
        description: 'Feature name (3-255 characters)',
        minLength: 3,
        maxLength: 255,
    })
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({
        example:
            'High-quality wireless headphones with active noise cancellation',
        description: 'Detailed description of the feature',
        maxLength: 2000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiProperty({
        example: 199.99,
        description: 'Price in USD',
        minimum: 0,
        maximum: 999999.99,
    })
    @IsNumber()
    @Min(0)
    @Max(999999.99)
    price: number;

    @ApiPropertyOptional({
        example: 'FEAT-WH-2024-001',
        description: 'Unique SKU for inventory tracking',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    sku?: string;

    @ApiProperty({
        example: 150,
        description: 'Stock quantity',
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    stock: number;

    @ApiPropertyOptional({
        example: false,
        description: 'Mark as featured/highlighted',
    })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Active status',
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        example: ['electronics', 'audio', 'wireless'],
        description: 'Tags for categorization',
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({
        example: 'Electronics',
        description: 'Category name',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    category?: string;

    @ApiPropertyOptional({
        example: 'Sony',
        description: 'Brand/manufacturer name',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    brand?: string;
}
