import { createAsyncThunk } from "@reduxjs/toolkit";
import { httpService } from "~/services/httpService";
import type {
  FetchProductsParams,
  Product,
  ProductCategory,
  ProductDetail,
  StockAdjustmentRequest,
  StockAdjustmentResponse,
  StockHistoryEntry,
} from "~/types/product";
import type { PaginatedResponse } from "~/types/common";

export const productService = {
  getProducts: (params?: FetchProductsParams) =>
    httpService.get<PaginatedResponse<Product>>("/products", { params }),

  getProductById: (id: string) =>
    httpService.get<ProductDetail>(`/products/${id}`),

  adjustStock: (id: string, data: StockAdjustmentRequest) =>
    httpService.patch<StockAdjustmentResponse>(`/products/${id}/stock`, data),

  adjustVariationStock: (variationId: string, data: StockAdjustmentRequest) =>
    httpService.patch<StockAdjustmentResponse>(
      `/products/variations/${variationId}/stock`,
      data
    ),

  getStockHistory: (id: string) =>
    httpService.get<StockHistoryEntry[]>(`/products/${id}/stock-history`),

  getCategories: () =>
    httpService.get<ProductCategory[]>("/categories"),

  syncProduct: (id: string) =>
    httpService.post<{ status: string }>(`/woocommerce/sync/products/${id}`, undefined, { timeout: 60000 }),

  syncBulkProducts: (productIds: string[]) =>
    httpService.post<{ synced: number; errors: number; results: { productId: string; status?: string; error?: string }[] }>(
      "/woocommerce/sync/products/bulk",
      { productIds },
      { timeout: 120000 },
    ),

  exportProducts: (params?: FetchProductsParams & { ids?: string }) =>
    httpService.getBlob("/products/export", { params }),
};

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params: FetchProductsParams | undefined, { rejectWithValue }) => {
    try {
      return await productService.getProducts(params);
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch products"
      );
    }
  }
);

export const fetchProductDetail = createAsyncThunk(
  "products/fetchProductDetail",
  async (id: string, { rejectWithValue }) => {
    try {
      return await productService.getProductById(id);
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch product"
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getCategories();
    } catch (error: unknown) {
      return rejectWithValue(
        (error as { message?: string }).message ?? "Failed to fetch categories"
      );
    }
  }
);
