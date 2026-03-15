import { UserRoleEnum } from '../enums/user-role.enum.js';

export interface IJwtPayload {
    id: string;
    name: string;
    email: string;
    role: UserRoleEnum;
    isActive?: boolean;
}
