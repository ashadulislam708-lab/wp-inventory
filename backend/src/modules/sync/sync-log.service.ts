import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SyncLog } from './entities/sync-log.entity.js';
import { ListSyncLogsDto } from './dto/list-sync-logs.dto.js';

@Injectable()
export class SyncLogService {
    constructor(
        @InjectRepository(SyncLog)
        private readonly syncLogRepository: Repository<SyncLog>,
    ) {}

    /**
     * List sync logs with filters and pagination.
     * Supports filtering by direction, entityType, status, and date range.
     */
    async listSyncLogs(dto: ListSyncLogsDto) {
        const page = dto.page || 1;
        const limit = dto.limit || 25;
        const skip = (page - 1) * limit;

        const qb: SelectQueryBuilder<SyncLog> =
            this.syncLogRepository.createQueryBuilder('syncLog');

        if (dto.direction) {
            qb.andWhere('syncLog.direction = :direction', {
                direction: dto.direction,
            });
        }

        if (dto.entityType) {
            qb.andWhere('syncLog.entityType = :entityType', {
                entityType: dto.entityType,
            });
        }

        if (dto.status) {
            qb.andWhere('syncLog.status = :status', {
                status: dto.status,
            });
        }

        if (dto.startDate) {
            qb.andWhere('syncLog.createdAt >= :startDate', {
                startDate: new Date(dto.startDate),
            });
        }

        if (dto.endDate) {
            qb.andWhere('syncLog.createdAt <= :endDate', {
                endDate: new Date(dto.endDate),
            });
        }

        qb.orderBy('syncLog.createdAt', 'DESC');
        qb.skip(skip).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
