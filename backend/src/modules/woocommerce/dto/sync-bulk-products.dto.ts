import { IsArray, ArrayMinSize, ArrayMaxSize, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncBulkProductsDto {
    @ApiProperty({
        description: 'Array of local product UUIDs to sync from WooCommerce',
        example: [
            'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @IsUUID('4', { each: true })
    productIds: string[];
}
