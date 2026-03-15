import { DataSource } from 'typeorm';
import { User } from '../../modules/users/user.entity';
import { UserRoleEnum } from '../../shared/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Check if users already exist
    const existingUsers = await userRepository.count();

    if (existingUsers > 0) {
        console.log(`${existingUsers} user(s) already exist in database`);
        return;
    }

    console.log('Creating default users...');

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

    console.log('Successfully created 2 users');
}
