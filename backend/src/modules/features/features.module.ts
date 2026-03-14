import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';
import { FeatureRepository } from './feature.repository';
import { Feature } from './feature.entity';
import { I18nHelper } from 'src/core/utils/i18n.helper';

@Module({
    imports: [TypeOrmModule.forFeature([Feature])],
    controllers: [FeatureController],
    providers: [FeatureService, FeatureRepository, I18nHelper],
    exports: [FeatureService, FeatureRepository],
})
export class FeaturesModule {}
