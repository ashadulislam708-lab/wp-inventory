import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity.js';

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) {}

    /**
     * List all categories (for product filtering)
     */
    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find({
            order: { name: 'ASC' },
        });
    }

    /**
     * Find or create a category by WooCommerce ID
     */
    async findOrCreateByWcId(
        wcId: number,
        name: string,
        slug: string,
    ): Promise<Category> {
        let category = await this.categoryRepository.findOne({
            where: { wcId },
        });

        if (!category) {
            category = this.categoryRepository.create({ wcId, name, slug });
            await this.categoryRepository.save(category);
        } else {
            category.name = name;
            category.slug = slug;
            await this.categoryRepository.save(category);
        }

        return category;
    }

    /**
     * Find category by ID
     */
    async findById(id: string): Promise<Category | null> {
        return this.categoryRepository.findOne({ where: { id } });
    }
}
