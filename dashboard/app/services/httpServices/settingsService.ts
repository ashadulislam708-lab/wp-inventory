import { httpService } from "~/services/httpService";
import type { WcConnectionStatus, SyncLog, ImportResult } from "~/types/settings";
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
};
