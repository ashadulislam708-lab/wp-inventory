import { DataSource } from 'typeorm';
import { User } from 'src/modules/users/user.entity';
import { RolesEnum } from 'src/shared/enums/role.enum';
import { ActiveStatusEnum } from 'src/shared/enums/active-status.enum';
import { UtilsService } from '@infrastructure/utils/utils.service';

export async function seedUsers(
    dataSource: DataSource,
    utilsService: UtilsService,
): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Check if users already exist
    const existingUsers = await userRepository.count();

    if (existingUsers > 0) {
        console.log(`ℹ️  ${existingUsers} user(s) already exist in database`);
        return;
    }

    console.log('Creating default users...');

    // Create Admin User
    const hashedAdminPassword = await utilsService.getHash('admin123');
    const adminUser = userRepository.create({
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: hashedAdminPassword,
        role: RolesEnum.ADMIN,
        isActive: ActiveStatusEnum.ACTIVE,
        emailVerified: true,
    });
    await userRepository.save(adminUser);
    console.log('✅ Admin user created: admin@example.com / admin123');

    // Create Regular User
    const hashedUserPassword = await utilsService.getHash('user123');
    const regularUser = userRepository.create({
        fullName: 'Test User',
        email: 'user@example.com',
        password: hashedUserPassword,
        role: RolesEnum.USER,
        isActive: ActiveStatusEnum.ACTIVE,
        emailVerified: true,
    });
    await userRepository.save(regularUser);
    console.log('✅ Regular user created: user@example.com / user123');

    console.log(`✅ Successfully created 2 users`);
}
