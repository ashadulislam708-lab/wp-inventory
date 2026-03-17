import { createSlice } from "@reduxjs/toolkit";
import type { DashboardState } from "~/types/dashboard";
import {
  fetchDashboardStats,
  fetchLowStockProducts,
  fetchRecentOrders,
} from "~/services/httpServices/dashboardService";

const initialState: DashboardState = {
  stats: null,
  lowStockProducts: [],
  lowStockMeta: null,
  recentOrders: [],
  recentOrdersMeta: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchLowStockProducts.fulfilled, (state, action) => {
        state.lowStockProducts = action.payload.data;
        state.lowStockMeta = action.payload.meta;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action) => {
        state.recentOrders = action.payload.data;
        state.recentOrdersMeta = action.payload.meta;
      });
  },
});

export default dashboardSlice.reducer;
