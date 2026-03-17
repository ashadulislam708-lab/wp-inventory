import type { UserRoleEnum } from "~/enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRoleEnum;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRoleEnum;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRoleEnum;
}

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}
