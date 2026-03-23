import type { ProductTypeEnum, SyncStatusEnum } from "~/enums";

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductVariation {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  regularPrice: number;
  salePrice: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  wcId: number;
}

export interface StockHistoryEntry {
  id: string;
  previousQty: number;
  newQty: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  type: ProductTypeEnum;
  imageUrl: string | null;
  regularPrice: number;
  salePrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  syncStatus: SyncStatusEnum;
  category: ProductCategory | null;
  wcPermalink?: string | null;
  variations?: ProductVariation[];
}

export interface ProductDetail extends Product {
  shortDescription: string | null;
  description: string | null;
  wcId: number;
  wcPermalink: string | null;
  variations: ProductVariation[];
  stockHistory: StockHistoryEntry[];
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  stockStatus?: string;
  search?: string;
}

export interface StockAdjustmentRequest {
  quantity: number;
  reason: string;
  note?: string;
}

export interface StockAdjustmentResponse {
  id: string;
  name: string;
  stockQuantity: number;
  previousQuantity: number;
  wcSyncStatus: string;
}

export interface ProductState {
  products: Product[];
  currentProduct: ProductDetail | null;
  categories: ProductCategory[];
  loading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
