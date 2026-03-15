import { httpService } from "~/services/httpService";
import type { WcConnectionStatus, SyncLog, ImportResult } from "~/types/settings";
import type { PaginatedResponse } from "~/types/common";

export const settingsService = {
  getWcStatus: () =>
    httpService.get<WcConnectionStatus>("/settings/wc-status"),

  importProducts: () =>
    httpService.post<ImportResult>("/woocommerce/import/products"),

  syncProducts: () =>
    httpService.post<ImportResult>("/woocommerce/sync/products"),

  syncOrders: () =>
    httpService.post<ImportResult>("/woocommerce/sync/orders"),

  getSyncLogs: (params?: { page?: number; limit?: number }) =>
    httpService.get<PaginatedResponse<SyncLog>>("/woocommerce/sync-logs", {
      params,
    }),
};
