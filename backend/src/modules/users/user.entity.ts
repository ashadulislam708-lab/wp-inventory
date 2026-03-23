import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../core/base/base.entity.js';
import { UserRoleEnum } from '../../shared/enums/user-role.enum.js';

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ length: 255, select: false })
    password: string;

    @Column({ length: 100 })
    name: string;

    @Column({
        type: 'enum',
        enum: UserRoleEnum,
        default: UserRoleEnum.STAFF,
    })
    role: UserRoleEnum;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;
}
