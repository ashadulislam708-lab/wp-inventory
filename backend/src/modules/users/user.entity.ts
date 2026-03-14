import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/core/base';
import {
    ActiveStatusEnum,
    RolesEnum,
    SocialLoginTypeEnum,
} from '@shared/enums';

@Entity('users')
export class User extends BaseEntity {
    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ name: 'first_name', nullable: true })
    firstName?: string;

    @Column({ name: 'last_name', nullable: true })
    lastName?: string;

    @Column({ name: 'full_name', nullable: true })
    fullName: string;

    @Column({
        type: 'enum',
        enum: RolesEnum,
        default: RolesEnum.USER,
    })
    role: RolesEnum;

    @Column({
        type: 'enum',
        enum: ActiveStatusEnum,
        default: ActiveStatusEnum.ACTIVE,
    })
    isActive: ActiveStatusEnum;

    @Column({ name: 'email_verified', default: false })
    emailVerified: boolean;

    @Column({
        type: 'enum',
        enum: SocialLoginTypeEnum,
        nullable: true,
    })
    socialLoginType?: SocialLoginTypeEnum;

    @Column({ name: 'is_verified', type: 'boolean', default: false })
    isVerified: boolean;

    @Column({ nullable: true, type: 'text' })
    image: string | null;

    @Column({
        type: 'jsonb',
        nullable: true,
        default: () => "'[]'",
        name: 'device_fcm_tokens',
    })
    deviceFcmTokens: string[];

    @Column({
        name: 'refresh_token',
        nullable: true,
        select: false,
        type: 'text',
    })
    refreshToken: string | null;

    @Column({ default: false, nullable: true })
    rememberMe: boolean;
}
