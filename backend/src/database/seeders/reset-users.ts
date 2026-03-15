import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { User } from '../../modules/users/user.entity';
import { UserRoleEnum } from '../../shared/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

async function resetUsers() {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    const userRepository = dataSource.getRepository(User);

    console.log('Checking existing users...');
    const existingUsers = await userRepository.find();
    console.log(`Found ${existingUsers.length} users:`);
    existingUsers.forEach((user) => {
        console.log(`  - ${user.email} (role: ${user.role})`);
    });

    console.log('\nDeleting all users...');
    await userRepository.clear();
    console.log('All users deleted');

    console.log('\nCreating fresh users with proper password hashing...');

    // Create Admin User
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);

    const adminUser = userRepository.create({
        name: 'Admin User',
        email: 'admin@glamlavish.com',
        password: hashedAdminPassword,
        role: UserRoleEnum.ADMIN,
        isActive: true,
    });
    await userRepository.save(adminUser);
    console.log('Admin user created: admin@glamlavish.com / admin123');

    // Create Staff User
    const hashedStaffPassword = await bcrypt.hash('staff123', 10);
    const staffUser = userRepository.create({
        name: 'Staff Member',
        email: 'staff@glamlavish.com',
        password: hashedStaffPassword,
        role: UserRoleEnum.STAFF,
        isActive: true,
    });
    await userRepository.save(staffUser);
    console.log('Staff user created: staff@glamlavish.com / staff123');

    console.log(`\nSuccessfully created 2 users`);

    await app.close();
    console.log('\nReset completed successfully!');
}

resetUsers().catch((error) => {
    console.error('Reset failed:', error);
    process.exit(1);
});
