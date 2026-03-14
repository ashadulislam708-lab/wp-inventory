import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { UtilsService } from '@infrastructure/utils/utils.service';
import { seedUsers } from './user.seed';

async function runSeeder() {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);
    const utilsService = app.get(UtilsService);

    // Seed Users
    await seedUsers(dataSource, utilsService);

    console.log('User seeding completed!');
    console.log(
        'Note: Use npm run seed:facility-demo to seed parking facilities',
    );

    await app.close();
    console.log('All seeding completed successfully!');
}

runSeeder().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
