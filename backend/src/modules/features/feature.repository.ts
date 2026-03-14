import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from 'src/core/base/base.repository';
import { Feature } from './feature.entity';

@Injectable()
export class FeatureRepository extends BaseRepository<Feature> {
    constructor(
        @InjectRepository(Feature)
        repository: Repository<Feature>,
    ) {
        super(repository);
    }

    async findFeatured(): Promise<Feature[]> {
        return this.repository.find({
            where: { isFeatured: true, isActive: true },
            order: { createdAt: 'DESC' },
        });
    }

    async findByCategory(category: string): Promise<Feature[]> {
        return this.repository
            .createQueryBuilder('feature')
            .where('LOWER(feature.category) = LOWER(:category)', { category })
            .andWhere('feature.isActive = :isActive', { isActive: true })
            .orderBy('feature.name', 'ASC')
            .getMany();
    }

    async findByTags(tags: string[]): Promise<Feature[]> {
        const queryBuilder = this.repository
            .createQueryBuilder('feature')
            .where('feature.isActive = :isActive', { isActive: true });

        tags.forEach((tag, index) => {
            if (index === 0) {
                queryBuilder.andWhere('feature.tags LIKE :tag0', {
                    tag0: `%${tag}%`,
                });
            } else {
                queryBuilder.orWhere(`feature.tags LIKE :tag${index}`, {
                    [`tag${index}`]: `%${tag}%`,
                });
            }
        });

        return queryBuilder.orderBy('feature.createdAt', 'DESC').getMany();
    }

    async searchByName(query: string): Promise<Feature[]> {
        return this.repository
            .createQueryBuilder('feature')
            .where('feature.name LIKE :query', { query: `%${query}%` })
            .andWhere('feature.isActive = :isActive', { isActive: true })
            .orderBy('feature.name', 'ASC')
            .getMany();
    }

    async findByPriceRange(
        minPrice: number,
        maxPrice: number,
    ): Promise<Feature[]> {
        return this.repository
            .createQueryBuilder('feature')
            .where('feature.price BETWEEN :minPrice AND :maxPrice', {
                minPrice,
                maxPrice,
            })
            .andWhere('feature.isActive = :isActive', { isActive: true })
            .orderBy('feature.price', 'ASC')
            .getMany();
    }

    async findLowStock(threshold: number = 10): Promise<Feature[]> {
        return this.repository
            .find({
                where: { isActive: true },
                order: { stock: 'ASC' },
            })
            .then((features) => features.filter((f) => f.stock <= threshold));
    }

    async findTopRated(limit: number = 10): Promise<Feature[]> {
        return this.repository.find({
            where: { isActive: true },
            order: {
                rating: 'DESC',
                reviewCount: 'DESC',
            },
            take: limit,
        });
    }
}
