import { createAsyncThunk } from "@reduxjs/toolkit";
import { httpService } from "~/services/httpService";
import type { DashboardStats, LowStockProduct, RecentOrder } from "~/types/dashboard";
import type { PaginatedResponse } from "~/types/common";

export const dashboardService = {
  getStats: () => httpService.get<DashboardStats>("/dashboard/stats"),
  getLowStock: (params?: { page?: number; limit?: number }) =>
    httpService.get<PaginatedResponse<LowStockProduct>>("/dashboard/low-stock", { params }),
  getRecentOrders: (params?: { page?: number; limit?: number }) =>
    httpService.get<PaginatedResponse<RecentOrder>>("/dashboard/recent-orders", { params }),
};

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.getStats();
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch stats"
      );
    }
  }
);

export const fetchLowStockProducts = createAsyncThunk(
  "dashboard/fetchLowStock",
  async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getLowStock(params);
      return { data: res.data, meta: res.meta };
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch low stock"
      );
    }
  }
);

export const fetchRecentOrders = createAsyncThunk(
  "dashboard/fetchRecentOrders",
  async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getRecentOrders(params);
      return { data: res.data, meta: res.meta };
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch recent orders"
      );
    }
  }
);
