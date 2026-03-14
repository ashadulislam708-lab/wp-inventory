import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/core/base/base.service';
import { I18nHelper } from 'src/core/utils/i18n.helper';
import {
    CreatedResponseDto,
    SuccessResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
    PaginatedResponseDto,
} from 'src/shared/dtos/response.dto';
import { Feature } from './feature.entity';
import { FeatureRepository } from './feature.repository';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { FeatureResponseDto } from './dto/feature-response.dto';

@Injectable()
export class FeatureService extends BaseService<Feature> {
    constructor(
        private readonly featureRepository: FeatureRepository,
        private readonly i18nHelper: I18nHelper,
    ) {
        super(featureRepository, 'Feature');
    }

    /**
     * Create a new feature with response DTO
     * Demonstrates: CreatedResponseDto, i18n messages, entity creation
     */
    async createWithResponse(
        createFeatureDto: CreateFeatureDto,
    ): Promise<CreatedResponseDto<FeatureResponseDto>> {
        const feature = await this.create(createFeatureDto);

        return new CreatedResponseDto<FeatureResponseDto>(
            feature as unknown as FeatureResponseDto,
            this.i18nHelper.t('features.created'),
        );
    }

    /**
     * Get all features with pagination and response DTO
     * Demonstrates: PaginatedResponseDto, pagination logic
     */
    async findAllPaginated(
        page: number = 1,
        limit: number = 10,
    ): Promise<PaginatedResponseDto<FeatureResponseDto>> {
        const skip = (page - 1) * limit;

        const features = await this.findAll({
            skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        const total = await this.featureRepository.count();

        return new PaginatedResponseDto<FeatureResponseDto>(
            features as unknown as FeatureResponseDto[],
            total,
            page,
            limit,
            this.i18nHelper.t('features.list'),
        );
    }

    /**
     * Get a single feature by ID with response DTO
     * Demonstrates: SuccessResponseDto, error handling with i18n
     */
    async findOneWithResponse(
        id: string,
    ): Promise<SuccessResponseDto<FeatureResponseDto>> {
        const feature = await this.featureRepository.findById(id);

        if (!feature) {
            throw new NotFoundException(
                this.i18nHelper.t('features.notFound', { args: { id } }),
            );
        }

        return new SuccessResponseDto<FeatureResponseDto>(
            feature as unknown as FeatureResponseDto,
            this.i18nHelper.t('features.found'),
        );
    }

    /**
     * Update a feature with response DTO
     * Demonstrates: UpdatedResponseDto, partial updates
     */
    async updateWithResponse(
        id: string,
        updateFeatureDto: UpdateFeatureDto,
    ): Promise<UpdatedResponseDto<FeatureResponseDto>> {
        const updated = await this.update(id, updateFeatureDto);

        if (!updated) {
            throw new NotFoundException(
                this.i18nHelper.t('features.notFound', { args: { id } }),
            );
        }

        return new UpdatedResponseDto<FeatureResponseDto>(
            updated as unknown as FeatureResponseDto,
            this.i18nHelper.t('features.updated'),
        );
    }

    /**
     * Soft delete a feature with response DTO
     * Demonstrates: DeletedResponseDto, soft delete pattern
     */
    async removeWithResponse(id: string): Promise<DeletedResponseDto> {
        await this.remove(id); // Throws NotFoundException if not found

        return new DeletedResponseDto(this.i18nHelper.t('features.deleted'));
    }

    /**
     * Toggle featured status
     * Demonstrates: Custom business logic, boolean toggling
     */
    async toggleFeatured(
        id: string,
    ): Promise<UpdatedResponseDto<FeatureResponseDto>> {
        const feature = await this.featureRepository.findById(id);

        if (!feature) {
            throw new NotFoundException(
                this.i18nHelper.t('features.notFound', { args: { id } }),
            );
        }

        feature.isFeatured = !feature.isFeatured;
        await this.featureRepository.update(id, {
            isFeatured: feature.isFeatured,
        });
        const updated = await this.featureRepository.findById(id);

        const message = feature.isFeatured
            ? this.i18nHelper.t('features.featured')
            : this.i18nHelper.t('features.unfeatured');

        return new UpdatedResponseDto<FeatureResponseDto>(
            updated as unknown as FeatureResponseDto,
            message,
        );
    }

    /**
     * Update stock quantity
     * Demonstrates: Numeric field updates, validation
     */
    async updateStock(
        id: string,
        quantity: number,
    ): Promise<UpdatedResponseDto<FeatureResponseDto>> {
        const feature = await this.featureRepository.findById(id);

        if (!feature) {
            throw new NotFoundException(
                this.i18nHelper.t('features.notFound', { args: { id } }),
            );
        }

        await this.featureRepository.update(id, { stock: quantity });
        const updated = await this.featureRepository.findById(id);

        return new UpdatedResponseDto<FeatureResponseDto>(
            updated as unknown as FeatureResponseDto,
            this.i18nHelper.t('features.stockUpdated'),
        );
    }

    /**
     * Get featured products
     * Demonstrates: Custom repository method usage
     */
    async findFeatured(): Promise<SuccessResponseDto<FeatureResponseDto[]>> {
        const features = await this.featureRepository.findFeatured();

        return new SuccessResponseDto<FeatureResponseDto[]>(
            features as unknown as FeatureResponseDto[],
            this.i18nHelper.t('features.featuredList'),
        );
    }

    /**
     * Search features by name
     * Demonstrates: Search functionality with custom queries
     */
    async search(
        query: string,
    ): Promise<SuccessResponseDto<FeatureResponseDto[]>> {
        const features = await this.featureRepository.searchByName(query);

        return new SuccessResponseDto<FeatureResponseDto[]>(
            features as unknown as FeatureResponseDto[],
            this.i18nHelper.t('features.searchResults', {
                args: { count: features.length },
            }),
        );
    }

    /**
     * Get products by category
     * Demonstrates: Category filtering
     */
    async findByCategory(
        category: string,
    ): Promise<SuccessResponseDto<FeatureResponseDto[]>> {
        const features = await this.featureRepository.findByCategory(category);

        return new SuccessResponseDto<FeatureResponseDto[]>(
            features as unknown as FeatureResponseDto[],
            this.i18nHelper.t('features.categoryList', { args: { category } }),
        );
    }

    /**
     * Get top-rated products
     * Demonstrates: Ordering and limiting results
     */
    async findTopRated(
        limit: number = 10,
    ): Promise<SuccessResponseDto<FeatureResponseDto[]>> {
        const features = await this.featureRepository.findTopRated(limit);

        return new SuccessResponseDto<FeatureResponseDto[]>(
            features as unknown as FeatureResponseDto[],
            this.i18nHelper.t('features.topRated'),
        );
    }
}
