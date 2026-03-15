import { OrderStatusEnum } from "~/enums";

/**
 * Allowed order status transitions.
 *
 * Source of truth: backend/src/modules/orders/order.service.ts
 * The backend enforces these transitions in the updateOrderStatus method.
 * This frontend constant MUST stay in sync with the backend validation.
 *
 * Status flow:
 *   PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
 *   PENDING -> CANCELLED
 *   CONFIRMED -> CANCELLED
 *   DELIVERED -> RETURNED
 *
 * If transitions change on the backend, update this file to match.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatusEnum, OrderStatusEnum[]> = {
  [OrderStatusEnum.PENDING]: [
    OrderStatusEnum.CONFIRMED,
    OrderStatusEnum.CANCELLED,
  ],
  [OrderStatusEnum.CONFIRMED]: [
    OrderStatusEnum.PROCESSING,
    OrderStatusEnum.CANCELLED,
  ],
  [OrderStatusEnum.PROCESSING]: [OrderStatusEnum.SHIPPED],
  [OrderStatusEnum.SHIPPED]: [OrderStatusEnum.DELIVERED],
  [OrderStatusEnum.DELIVERED]: [OrderStatusEnum.RETURNED],
  [OrderStatusEnum.CANCELLED]: [],
  [OrderStatusEnum.RETURNED]: [],
};

/**
 * The linear progression of statuses for timeline display.
 * Used to render the order progress bar on the detail page.
 */
export const STATUS_FLOW: OrderStatusEnum[] = [
  OrderStatusEnum.PENDING,
  OrderStatusEnum.CONFIRMED,
  OrderStatusEnum.PROCESSING,
  OrderStatusEnum.SHIPPED,
  OrderStatusEnum.DELIVERED,
];
