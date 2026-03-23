import { NotFoundException } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { BaseEntity } from './base.entity';
import { FindManyOptions, DeepPartial, FindOptionsRelations } from 'typeorm';

/**
 * Base Service with common business logic
 * Extend this for feature-specific services
 */
export abstract class BaseService<T extends BaseEntity> {
    constructor(
        protected readonly repository: BaseRepository<T>,
        protected readonly entityName: string,
    ) {}

    /**
     * Define default relations to load for this service
     * Override this in child services to specify relations
     * Example: protected defaultRelations = { category: true, tags: true };
     */
    protected defaultRelations?: FindOptionsRelations<T>;

    /**
     * Get entity by ID or throw not found exception
     * @param id - Entity ID
     * @param relations - Relations to load (uses defaultRelations if not specified)
     */
    async findByIdOrFail(
        id: string,
        relations?: FindOptionsRelations<T>,
    ): Promise<T> {
        const entity = await this.repository.findById(
            id,
            relations || this.defaultRelations,
        );
        if (!entity) {
            throw new NotFoundException(
                `${this.entityName} with ID ${id} not found`,
            );
        }
        return entity;
    }

    /**
     * Get all entities with optional relations
     * @param options - Find options
     */
    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return this.repository.findAll({
            ...options,
            relations: options?.relations || this.defaultRelations,
        });
    }

    /**
     * Create new entity
     */
    async create(data: DeepPartial<T>): Promise<T> {
        return this.repository.create(data);
    }

    /**
     * Update entity
     */
    async update(id: string, data: DeepPartial<T>): Promise<T | null> {
        await this.findByIdOrFail(id); // Ensure entity exists
        const updated = await this.repository.update(id, data);
        return updated;
    }

    /**
     * Soft delete entity
     */
    async remove(id: string): Promise<void> {
        await this.findByIdOrFail(id); // Ensure entity exists
        await this.repository.softDelete(id);
    }

    /**
     * Hard delete entity
     */
    async delete(id: string): Promise<void> {
        await this.findByIdOrFail(id); // Ensure entity exists
        await this.repository.delete(id);
    }
}
