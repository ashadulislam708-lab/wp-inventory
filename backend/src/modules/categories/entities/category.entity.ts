import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Index('IDX_categories_slug', { unique: true })
    @Column({ type: 'varchar', length: 255, unique: true })
    slug: string;

    @Index('IDX_categories_wc_id', { unique: true })
    @Column({ name: 'wc_id', type: 'int', unique: true })
    wcId: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
