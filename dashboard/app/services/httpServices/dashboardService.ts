import { createAsyncThunk } from "@reduxjs/toolkit";
import { httpService } from "~/services/httpService";
import type { DashboardStats, LowStockProduct, RecentOrder } from "~/types/dashboard";

export const dashboardService = {
  getStats: () => httpService.get<DashboardStats>("/dashboard/stats"),
  getLowStock: () =>
    httpService.get<{ data: LowStockProduct[] }>("/dashboard/low-stock"),
  getRecentOrders: () =>
    httpService.get<{ data: RecentOrder[] }>("/dashboard/recent-orders"),
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
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getLowStock();
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch low stock"
      );
    }
  }
);

export const fetchRecentOrders = createAsyncThunk(
  "dashboard/fetchRecentOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getRecentOrders();
      return res.data;
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch recent orders"
      );
    }
  }
);
