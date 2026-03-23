import {
    Repository,
    FindOptionsWhere,
    FindManyOptions,
    DeepPartial,
    FindOptionsRelations,
} from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class BaseRepository<T extends BaseEntity> {
    constructor(protected readonly repository: Repository<T>) {}

    protected defaultRelations?: FindOptionsRelations<T>;

    /**
     * Find entity by ID with optional relations
     */
    async findById(
        id: string,
        relations?: FindOptionsRelations<T>,
    ): Promise<T | null> {
        return this.repository.findOne({
            where: { id } as FindOptionsWhere<T>,
            relations: relations || this.defaultRelations,
        });
    }

    /**
     * Find all entities with optional conditions and relations
     */
    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return this.repository.find({
            ...options,
            relations: options?.relations || this.defaultRelations,
        });
    }

    /**
     * Find one entity by conditions with relations
     */
    async findOne(
        where: FindOptionsWhere<T>,
        relations?: FindOptionsRelations<T>,
    ): Promise<T | null> {
        return this.repository.findOne({
            where,
            relations: relations || this.defaultRelations,
        });
    }

    /**
     * Create new entity
     */
    async create(data: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(data);
        return this.repository.save(entity);
    }

    /**
     * Update entity by ID
     */
    async update(id: string, data: DeepPartial<T>): Promise<T | null> {
        await this.repository.update(id, data as any);
        return this.findById(id);
    }

    /**
     * Soft delete entity by ID
     */
    async softDelete(id: string): Promise<boolean> {
        const result = await this.repository.softDelete(id);
        return (result.affected ?? 0) > 0;
    }

    /**
     * Hard delete entity by ID
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.repository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    /**
     * Count entities with optional conditions
     */
    async count(options?: FindManyOptions<T>): Promise<number> {
        return this.repository.count(options);
    }
}
