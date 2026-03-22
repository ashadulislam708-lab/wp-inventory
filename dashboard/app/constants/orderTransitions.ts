import { OrderStatusEnum } from "~/enums";

const ALL_STATUSES = Object.values(OrderStatusEnum);

/**
 * Allowed order status transitions.
 *
 * Free transitions: any status can move to any other status.
 * Each status maps to all statuses except itself.
 *
 * Source of truth: backend/src/modules/orders/order.service.ts
 * The backend enforces these transitions in the updateOrderStatus method.
 * This frontend constant MUST stay in sync with the backend validation.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatusEnum, OrderStatusEnum[]> =
  Object.fromEntries(
    ALL_STATUSES.map((status) => [
      status,
      ALL_STATUSES.filter((s) => s !== status),
    ]),
  ) as Record<OrderStatusEnum, OrderStatusEnum[]>;

/**
 * All statuses for timeline display.
 * Used to render the order progress bar on the detail page.
 */
export const STATUS_FLOW: OrderStatusEnum[] = [
  OrderStatusEnum.DRAFT,
  OrderStatusEnum.PENDING_PAYMENT,
  OrderStatusEnum.ON_HOLD,
  OrderStatusEnum.PROCESSING,
  OrderStatusEnum.COMPLETED,
  OrderStatusEnum.CANCELLED,
  OrderStatusEnum.REFUNDED,
  OrderStatusEnum.FAILED,
];
