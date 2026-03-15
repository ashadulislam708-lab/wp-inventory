import { createAsyncThunk } from "@reduxjs/toolkit";
import { httpService } from "~/services/httpService";
import type { CreateUserRequest, UpdateUserRequest, User } from "~/types/user";

export const userService = {
  getUsers: () => httpService.get<User[]>("/users"),

  createUser: (data: CreateUserRequest) =>
    httpService.post<User>("/users", data),

  updateUser: (id: string, data: UpdateUserRequest) =>
    httpService.patch<User>(`/users/${id}`, data),

  deleteUser: (id: string) =>
    httpService.delete(`/users/${id}`),
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getUsers();
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch users"
      );
    }
  }
);
