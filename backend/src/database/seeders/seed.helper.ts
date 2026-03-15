import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { seedUsers } from './user.seed';

async function runSeeder() {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    // Seed Users
    await seedUsers(dataSource);

    console.log('User seeding completed!');

    await app.close();
    console.log('All seeding completed successfully!');
}

runSeeder().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});
