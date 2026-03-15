import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsArray,
    ValidateNested,
    IsUUID,
    IsOptional,
    IsInt,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingZoneEnum } from '../../../shared/enums/shipping-zone.enum.js';
import { ShippingPartnerEnum } from '../../../shared/enums/shipping-partner.enum.js';

export class OrderItemDto {
    @ApiProperty({ description: 'Product ID', format: 'uuid' })
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @ApiPropertyOptional({
        description: 'Variation ID (null for simple products)',
        format: 'uuid',
    })
    @IsOptional()
    @IsUUID()
    variationId?: string | null;

    @ApiProperty({ description: 'Quantity to order', minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty({ description: 'Customer full name' })
    @IsString()
    @IsNotEmpty()
    customerName: string;

    @ApiProperty({ description: 'Bangladesh mobile number' })
    @IsString()
    @IsNotEmpty()
    customerPhone: string;

    @ApiProperty({ description: 'Full delivery address' })
    @IsString()
    @IsNotEmpty()
    customerAddress: string;

    @ApiProperty({
        description: 'Shipping zone',
        enum: ShippingZoneEnum,
    })
    @IsEnum(ShippingZoneEnum)
    shippingZone: ShippingZoneEnum;

    @ApiProperty({
        description: 'Shipping partner',
        enum: ShippingPartnerEnum,
    })
    @IsEnum(ShippingPartnerEnum)
    shippingPartner: ShippingPartnerEnum;

    @ApiProperty({
        description: 'Order line items',
        type: [OrderItemDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}
