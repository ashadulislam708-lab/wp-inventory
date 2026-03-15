import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '../../shared/enums/user-role.enum.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleEnum[]) =>
    SetMetadata(ROLES_KEY, roles);
