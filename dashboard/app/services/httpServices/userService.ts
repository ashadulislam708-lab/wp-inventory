import { createAsyncThunk } from '@reduxjs/toolkit';
import { httpService } from '../httpService';
import type { User } from '~/types/user';

export const userService = {
  getUsers: () => httpService.get<User[]>('/users'),
  getUserById: (id: number) => httpService.get<User>(`/users/${id}`),
  createUser: (user: Omit<User, 'id'>) => httpService.post<User>('/users', user),
  updateUser: (id: number, user: Partial<User>) => httpService.put<User>(`/users/${id}`, user),
  deleteUser: (id: number) => httpService.delete(`/users/${id}`),
};

export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await userService.getUsers();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'user/createUser',
  async (userData: Omit<User, 'id'>, { rejectWithValue }) => {
    try {
      return await userService.createUser(userData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);