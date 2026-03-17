import { createAsyncThunk } from "@reduxjs/toolkit";
import { httpService } from "~/services/httpService";
import type {
  CreateOrderRequest,
  FetchOrdersParams,
  InvoiceData,
  Order,
  OrderNote,
  UpdateOrderStatusRequest,
} from "~/types/order";
import type { PaginatedResponse } from "~/types/common";

export const orderService = {
  getOrders: (params?: FetchOrdersParams) =>
    httpService.get<PaginatedResponse<Order>>("/orders", { params }),

  getOrderById: (id: string) =>
    httpService.get<Order>(`/orders/${id}`),

  createOrder: (data: CreateOrderRequest) =>
    httpService.post<Order>("/orders", data),

  updateOrder: (id: string, data: CreateOrderRequest) =>
    httpService.patch<Order>(`/orders/${id}`, data),

  updateOrderStatus: (id: string, data: UpdateOrderStatusRequest) =>
    httpService.patch<Order>(`/orders/${id}/status`, data),

  getInvoiceData: (id: string) =>
    httpService.get<InvoiceData>(`/orders/${id}/invoice`),

  getQrCode: (id: string) =>
    httpService.get<{ qrCodeDataUrl: string }>(`/orders/${id}/qr`),

  retryCourier: (id: string) =>
    httpService.post<Order>(`/orders/${id}/retry-courier`),

  exportOrders: (params?: FetchOrdersParams) =>
    httpService.getBlob("/orders/export", { params }),

  getOrderNotes: (orderId: string) =>
    httpService.get<OrderNote[]>(`/orders/${orderId}/notes`),

  addOrderNote: (orderId: string, content: string) =>
    httpService.post<OrderNote>(`/orders/${orderId}/notes`, { content }),
};

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params: FetchOrdersParams | undefined, { rejectWithValue }) => {
    try {
      return await orderService.getOrders(params);
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch orders"
      );
    }
  }
);

export const fetchOrderDetail = createAsyncThunk(
  "orders/fetchOrderDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      return await orderService.getOrderById(id);
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch order"
      );
    }
  }
);
