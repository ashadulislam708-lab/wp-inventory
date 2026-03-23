import { httpService } from "~/services/httpService";
import type {
  WcConnectionStatus,
  SyncLog,
  ImportResult,
  WcOrderListResponse,
  SingleSyncResult,
  BulkSyncResult,
} from "~/types/settings";
import type { PaginatedResponse } from "~/types/common";

export const settingsService = {
  getWcStatus: () =>
    httpService.get<WcConnectionStatus>("/settings/wc-status"),

  importProducts: () =>
    httpService.post<ImportResult>("/woocommerce/import/products", undefined, { timeout: 300000 }),

  syncProducts: () =>
    httpService.post<ImportResult>("/woocommerce/sync/products", undefined, { timeout: 300000 }),

  syncOrders: () =>
    httpService.post<ImportResult>("/woocommerce/sync/orders", undefined, { timeout: 300000 }),

  getSyncLogs: (params?: { page?: number; limit?: number }) =>
    httpService.get<PaginatedResponse<SyncLog>>("/woocommerce/sync-logs", {
      params,
    }),

  fetchWcOrders: (params?: {
    page?: number;
    perPage?: number;
    status?: string;
    dateAfter?: string;
  }) =>
    httpService.get<WcOrderListResponse>("/woocommerce/orders/wc", {
      params,
      timeout: 60000,
    }),

  syncSingleOrder: (wcOrderId: number) =>
    httpService.post<SingleSyncResult>(
      `/woocommerce/sync/orders/${wcOrderId}`,
      undefined,
      { timeout: 120000 },
    ),

  syncBulkOrders: (wcOrderIds: number[]) =>
    httpService.post<BulkSyncResult>(
      "/woocommerce/sync/orders/bulk",
      { wcOrderIds },
      { timeout: 300000 },
    ),
};
