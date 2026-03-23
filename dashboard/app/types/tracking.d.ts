import type { OrderStatusEnum } from "~/enums";

export interface TrackingTimelineItem {
  status: OrderStatusEnum | string;
  timestamp: string | null;
  active: boolean;
  /** Source of the status change, e.g. "Updated by Admin" or "Auto-updated by courier". Optional — may not be present if the backend does not provide status history. */
  updatedBy?: string | null;
}

export interface TrackingData {
  invoiceId: string;
  orderDate: string;
  customerName: string;
  status: OrderStatusEnum;
  statusTimeline: TrackingTimelineItem[];
  courierName: string | null;
  courierTrackingCode: string | null;
  courierTrackingUrl: string | null;
}
