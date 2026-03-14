import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    UseInterceptors,
    ParseIntPipe,
    DefaultValuePipe,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from 'src/core/base/base.controller';
import { ApiSwagger } from 'src/core/decorators/api-swagger.decorator';
import { Public } from 'src/core/decorators/public.decorator';
import { Roles } from 'src/core/decorators/roles.decorator';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RolesGuard } from 'src/core/guards/roles.guard';
import { LoggingInterceptor } from 'src/core/interceptors/logging.interceptor';
import { RolesEnum } from 'src/shared/enums/role.enum';
import { PaginationDto } from 'src/shared/dtos/pagination.dto';
import { FeatureService } from './feature.service';
import { FeatureRepository } from './feature.repository';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { Feature } from './feature.entity';
import {
    CreatedResponseDto,
    SuccessResponseDto,
    UpdatedResponseDto,
    DeletedResponseDto,
    PaginatedResponseDto,
} from 'src/shared/dtos/response.dto';
import { User } from '@modules/users';

@ApiTags('Features')
@Controller('features')
@UseGuards(RolesGuard)
export class FeatureController extends BaseController<
    Feature,
    CreateFeatureDto,
    UpdateFeatureDto
> {
    constructor(
        private readonly featureService: FeatureService,
        private readonly featureRepository: FeatureRepository,
    ) {
        super(featureService);
    }

    /**
     * Override: Create a new feature
     * Demonstrates: Automatic audit field handling (createdBy/updatedBy)
     * Access: Admin, USER only
     */
    @Post()
    @Roles(RolesEnum.ADMIN, RolesEnum.USER)
    @ApiSwagger({
        resourceName: 'Feature',
        operation: 'create',
        requestDto: CreateFeatureDto,
        responseDto: Feature,
        successStatus: 201,
        requiresAuth: true,
    })
    async create(
        @Body() createFeatureDto: CreateFeatureDto,
        @CurrentUser() user?: User,
    ): Promise<CreatedResponseDto<Feature>> {
        const entity = await this.service.create(createFeatureDto as any);
        return new CreatedResponseDto(entity, 'Feature created successfully');
    }

    /**
     * Override: Get all features with pagination
     * Demonstrates: @Public decorator, pagination
     * Access: Public (no authentication required)
     */
    @Get()
    @Public()
    @ApiSwagger({
        resourceName: 'Features',
        operation: 'getAll',
        responseDto: Feature,
        isArray: true,
        requiresAuth: false,
        withPagination: true,
    })
    async findAll(
        @Query() paginationDto: PaginationDto,
    ): Promise<PaginatedResponseDto<Feature>> {
        // Use base controller's logic
        return super.findAll(paginationDto);
    }

    /**
     * Get featured products
     * Demonstrates: @Public, custom endpoint
     * Access: Public
     */
    @Get('featured')
    @Public()
    @ApiSwagger({
        resourceName: 'Featured Features',
        operation: 'custom',
        summary: 'Get featured products',
        responseDto: Feature,
        isArray: true,
        requiresAuth: false,
    })
    async findFeatured(): Promise<SuccessResponseDto<Feature[]>> {
        const features = await this.featureRepository.findFeatured();
        return new SuccessResponseDto(
            features,
            'Featured products retrieved successfully',
        );
    }

    /**
     * Search features by name
     * Demonstrates: @Public, search functionality, query parameters, LoggingInterceptor
     * Access: Public
     */
    @Get('search')
    @Public()
    @UseInterceptors(LoggingInterceptor) // Log search queries
    @ApiSwagger({
        resourceName: 'Features',
        operation: 'search',
        summary: 'Search features by name',
        responseDto: Feature,
        isArray: true,
        requiresAuth: false,
    })
    async searchFeatures(
        @Query('q') query: string,
    ): Promise<SuccessResponseDto<Feature[]>> {
        const features = await this.featureRepository.searchByName(query);
        return new SuccessResponseDto(
            features,
            `Found ${features.length} matching features`,
        );
    }

    /**
     * Get top-rated products
     * Demonstrates: @Public, custom business logic
     * Access: Public
     */
    @Get('top-rated')
    @Public()
    @ApiSwagger({
        resourceName: 'Top Rated Features',
        operation: 'custom',
        summary: 'Get top-rated products',
        responseDto: Feature,
        isArray: true,
        requiresAuth: false,
    })
    async findTopRated(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ): Promise<SuccessResponseDto<Feature[]>> {
        const features = await this.featureRepository.findTopRated(limit);
        return new SuccessResponseDto(
            features,
            'Top-rated features retrieved successfully',
        );
    }

    /**
     * Override: Get a single feature by ID
     * Demonstrates: @Public, making base method public
     * Access: Public
     */
    @Get(':id')
    @Public()
    @ApiSwagger({
        resourceName: 'Feature',
        operation: 'getOne',
        responseDto: Feature,
        requiresAuth: false,
    })
    async findOne(
        @Param('id') id: string,
    ): Promise<SuccessResponseDto<Feature>> {
        // Use base controller's logic
        return super.findOne(id);
    }

    /**
     * Override: Update a feature
     * Demonstrates: Automatic updatedBy handling
     * Access: Admin only
     */
    @Patch(':id')
    @Roles(RolesEnum.ADMIN)
    @ApiSwagger({
        resourceName: 'Feature',
        operation: 'update',
        requestDto: UpdateFeatureDto,
        responseDto: Feature,
        requiresAuth: true,
    })
    async update(
        @Param('id') id: string,
        @Body() updateFeatureDto: UpdateFeatureDto,
        @CurrentUser() user?: User,
    ): Promise<UpdatedResponseDto<Feature>> {
        const entity = await this.service.update(id, updateFeatureDto as any);
        if (!entity) {
            throw new Error('Feature not found');
        }
        return new UpdatedResponseDto(entity, 'Feature updated successfully');
    }

    /**
     * Toggle featured status
     * Demonstrates: @Roles, custom PATCH endpoint, business logic
     * Access: Admin only
     */
    @Patch(':id/toggle-featured')
    @Roles(RolesEnum.ADMIN)
    @UseInterceptors(LoggingInterceptor) // Log featured status changes
    @ApiSwagger({
        resourceName: 'Feature',
        operation: 'custom',
        summary: 'Toggle featured status',
        responseDto: Feature,
        requiresAuth: true,
    })
    async toggleFeatured(
        @Param('id') id: string,
    ): Promise<UpdatedResponseDto<Feature>> {
        const feature = await this.featureRepository.findById(id);
        if (!feature) {
            throw new NotFoundException(`Feature with ID ${id} not found`);
        }

        feature.isFeatured = !feature.isFeatured;
        await this.featureRepository.update(id, {
            isFeatured: feature.isFeatured,
        });
        const updated = await this.featureRepository.findById(id);

        const message = feature.isFeatured
            ? 'Feature marked as featured'
            : 'Feature unmarked as featured';

        return new UpdatedResponseDto(updated!, message);
    }

    /**
     * Update stock quantity
     * Demonstrates: @Roles, custom PATCH endpoint, numeric updates
     * Access: Admin only
     */
    @Patch(':id/stock')
    @Roles(RolesEnum.ADMIN)
    @ApiSwagger({
        resourceName: 'Feature',
        operation: 'custom',
        summary: 'Update stock quantity',
        responseDto: Feature,
        requiresAuth: true,
    })
    async updateStock(
        @Param('id') id: string,
        @Query('quantity', ParseIntPipe) quantity: number,
    ): Promise<UpdatedResponseDto<Feature>> {
        const feature = await this.featureRepository.findById(id);
        if (!feature) {
            throw new NotFoundException(`Feature with ID ${id} not found`);
        }

        await this.featureRepository.update(id, { stock: quantity });
        const updated = await this.featureRepository.findById(id);

        return new UpdatedResponseDto(
            updated!,
            'Stock quantity updated successfully',
        );
    }

    /**
     * Override: Delete a feature (soft delete)
     * Demonstrates: @Roles, DeletedResponseDto, LoggingInterceptor
     * Access: Admin only
     */
    @Delete(':id')
    @Roles(RolesEnum.ADMIN)
    @UseInterceptors(LoggingInterceptor) // Log deletions
    @ApiSwagger({
        resourceName: 'Feature',
        operation: 'delete',
        requiresAuth: true,
    })
    async remove(@Param('id') id: string): Promise<DeletedResponseDto> {
        // Use base controller's logic
        return super.remove(id);
    }
}
