import type { OrderStatusEnum, OrderSourceEnum } from "~/enums";
import type { PaginationMeta } from "~/types/common";

export interface DashboardStats {
  totalOrdersToday: number;
  revenueToday: number;
  pendingOrdersCount: number;
  failedCourierCount: number;
  syncErrorCount: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export interface RecentOrder {
  id: string;
  invoiceId: string;
  customerName: string;
  grandTotal: number;
  status: OrderStatusEnum;
  source: OrderSourceEnum;
  createdAt: string;
}

export interface DashboardState {
  stats: DashboardStats | null;
  lowStockProducts: LowStockProduct[];
  lowStockMeta: PaginationMeta | null;
  recentOrders: RecentOrder[];
  recentOrdersMeta: PaginationMeta | null;
  loading: boolean;
  error: string | null;
}
