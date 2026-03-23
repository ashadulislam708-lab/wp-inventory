import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for bulk order CSV import
 */
export class ImportOrderErrorDto {
    @ApiProperty({
        description: 'Row number in CSV (1-based, excluding header)',
    })
    row: number;

    @ApiProperty({ description: 'Error message for this row' })
    error: string;
}

export class ImportOrdersResponseDto {
    @ApiProperty({ description: 'Number of successfully imported orders' })
    imported: number;

    @ApiProperty({ description: 'Number of failed rows' })
    failed: number;

    @ApiProperty({
        description: 'Error details for failed rows',
        type: [ImportOrderErrorDto],
    })
    errors: ImportOrderErrorDto[];
}
