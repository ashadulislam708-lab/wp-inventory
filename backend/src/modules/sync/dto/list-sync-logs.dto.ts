import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SyncDirectionEnum } from '../../../shared/enums/sync-direction.enum.js';
import { SyncLogStatusEnum } from '../../../shared/enums/sync-log-status.enum.js';

export class ListSyncLogsDto {
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
        description: 'Filter by sync direction',
        enum: SyncDirectionEnum,
    })
    @IsOptional()
    @IsEnum(SyncDirectionEnum)
    direction?: SyncDirectionEnum;

    @ApiPropertyOptional({
        description:
            'Filter by entity type (e.g., product, order, category, reconciliation)',
    })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({
        description: 'Filter by sync status',
        enum: SyncLogStatusEnum,
    })
    @IsOptional()
    @IsEnum(SyncLogStatusEnum)
    status?: SyncLogStatusEnum;

    @ApiPropertyOptional({
        description:
            'Filter sync logs created on or after this date (ISO 8601)',
    })
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiPropertyOptional({
        description:
            'Filter sync logs created on or before this date (ISO 8601)',
    })
    @IsOptional()
    @IsString()
    endDate?: string;
}
