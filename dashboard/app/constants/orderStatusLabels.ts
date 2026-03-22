import { OrderStatusEnum } from "~/enums";

export const ORDER_STATUS_LABELS: Record<OrderStatusEnum, string> = {
  [OrderStatusEnum.PENDING_PAYMENT]: "Pending payment",
  [OrderStatusEnum.PROCESSING]: "Processing",
  [OrderStatusEnum.ON_HOLD]: "On hold",
  [OrderStatusEnum.COMPLETED]: "Completed",
  [OrderStatusEnum.CANCELLED]: "Cancelled",
  [OrderStatusEnum.REFUNDED]: "Refunded",
  [OrderStatusEnum.FAILED]: "Failed",
  [OrderStatusEnum.DRAFT]: "Draft",
};
