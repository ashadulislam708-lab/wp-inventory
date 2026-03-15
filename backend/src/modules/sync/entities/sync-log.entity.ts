import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { SyncDirectionEnum } from '../../../shared/enums/sync-direction.enum.js';
import { SyncLogStatusEnum } from '../../../shared/enums/sync-log-status.enum.js';

@Entity('sync_logs')
export class SyncLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: SyncDirectionEnum,
    })
    direction: SyncDirectionEnum;

    @Index('IDX_sync_logs_entity_type_entity_id')
    @Column({ name: 'entity_type', type: 'varchar', length: 50 })
    entityType: string;

    @Column({ name: 'entity_id', type: 'uuid', nullable: true })
    entityId: string | null;

    @Index('IDX_sync_logs_status')
    @Column({
        type: 'enum',
        enum: SyncLogStatusEnum,
    })
    status: SyncLogStatusEnum;

    @Column({ type: 'jsonb', nullable: true })
    payload: Record<string, unknown> | null;

    @Column({ type: 'text', nullable: true })
    error: string | null;

    @Index('IDX_sync_logs_created_at')
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;
}
