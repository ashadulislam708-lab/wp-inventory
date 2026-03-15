import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum StockStatusFilter {
    LOW = 'LOW',
    OUT_OF_STOCK = 'OUT_OF_STOCK',
    IN_STOCK = 'IN_STOCK',
}

export class ListProductsDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 25 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 25;

    @ApiPropertyOptional({ description: 'Filter by category ID' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({
        description: 'Filter by stock status',
        enum: StockStatusFilter,
    })
    @IsOptional()
    @IsEnum(StockStatusFilter)
    stockStatus?: StockStatusFilter;

    @ApiPropertyOptional({ description: 'Search by product name or SKU' })
    @IsOptional()
    @IsString()
    search?: string;
}
