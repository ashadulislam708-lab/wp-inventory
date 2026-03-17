import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatusEnum } from '../../../shared/enums/order-status.enum.js';
import { OrderSourceEnum } from '../../../shared/enums/order-source.enum.js';

export class ListOrdersDto {
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

    @ApiPropertyOptional({
        description: 'Filter by order status',
        enum: OrderStatusEnum,
    })
    @IsOptional()
    @IsEnum(OrderStatusEnum)
    status?: OrderStatusEnum;

    @ApiPropertyOptional({
        description: 'Filter by order source',
        enum: OrderSourceEnum,
    })
    @IsOptional()
    @IsEnum(OrderSourceEnum)
    source?: OrderSourceEnum;

    @ApiPropertyOptional({
        description: 'Filter orders created on or after this date (ISO 8601)',
    })
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Filter orders created on or before this date (ISO 8601)',
    })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'Search by invoice ID, customer name, or phone',
    })
    @IsOptional()
    @IsString()
    search?: string;
}
