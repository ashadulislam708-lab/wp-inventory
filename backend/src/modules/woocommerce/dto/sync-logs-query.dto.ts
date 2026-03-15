import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SyncDirectionEnum } from '../../../shared/enums/sync-direction.enum.js';
import { SyncLogStatusEnum } from '../../../shared/enums/sync-log-status.enum.js';

export class SyncLogsQueryDto {
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
        enum: SyncDirectionEnum,
        description: 'Filter by sync direction',
    })
    @IsOptional()
    @IsEnum(SyncDirectionEnum)
    direction?: SyncDirectionEnum;

    @ApiPropertyOptional({
        enum: SyncLogStatusEnum,
        description: 'Filter by sync status',
    })
    @IsOptional()
    @IsEnum(SyncLogStatusEnum)
    status?: SyncLogStatusEnum;

    @ApiPropertyOptional({ description: 'Filter by entity type' })
    @IsOptional()
    @IsString()
    entityType?: string;
}
