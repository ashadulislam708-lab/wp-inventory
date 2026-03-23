import type { SyncDirectionEnum, SyncLogStatusEnum } from "~/enums";

export interface WcConnectionStatus {
  connected: boolean;
  url: string | null;
  error: string | null;
  lastSyncAt?: string | null;
}

export interface SyncLog {
  id: string;
  direction: SyncDirectionEnum;
  entityType: string;
  entityId: string;
  status: SyncLogStatusEnum;
  payload: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
}

export interface WcOrderSummary {
  wcOrderId: number;
  wcStatus: string;
  customerName: string;
  customerPhone: string;
  total: string;
  dateCreated: string;
  isSynced: boolean;
  localOrderId: string | null;
  localInvoiceId: string | null;
}

export interface WcOrderListResponse {
  data: WcOrderSummary[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleSyncResult {
  status: "created" | "already_synced";
  orderId?: string;
  invoiceId?: string;
}

export interface BulkSyncResult {
  synced: number;
  skipped: number;
  errors: number;
  results: Array<{ wcOrderId: number; status: string; error?: string }>;
}

export interface ImportResult {
  imported?: number;
  updated?: number;
  synced?: number;
  errors: number;
  details?: {
    wcId: number;
    error: string;
  }[];
  errorDetails?: {
    wcOrderId: number;
    error: string;
  }[];
}
