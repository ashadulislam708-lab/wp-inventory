import { IsArray, ArrayMinSize, ArrayMaxSize, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncBulkOrdersDto {
    @ApiProperty({
        description: 'Array of WooCommerce order IDs to sync',
        example: [1001, 1002, 1003],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @IsInt({ each: true })
    wcOrderIds: number[];
}
