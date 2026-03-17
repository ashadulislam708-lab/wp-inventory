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

export interface ImportResult {
  imported: number;
  updated: number;
  errors: number;
  details: {
    wcId: number;
    error: string;
  }[];
}
