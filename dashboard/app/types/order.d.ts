import type { OrderStatusEnum, OrderSourceEnum, ShippingZoneEnum, ShippingPartnerEnum } from "~/enums";

export interface OrderItem {
  id: string;
  productId: string;
  variationId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  invoiceId: string;
  status: OrderStatusEnum;
  statusHistory: string[];
  source: OrderSourceEnum;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  shippingZone: ShippingZoneEnum;
  shippingPartner: ShippingPartnerEnum;
  shippingFee: number;
  subtotal: number;
  grandTotal: number;
  discountAmount: number;
  advanceAmount: number;
  courierConsignmentId: string | null;
  courierTrackingCode: string | null;
  qrCodeDataUrl: string | null;
  wcOrderId: string | null;
  createdBy: { id: string; name: string; email: string } | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemRequest {
  productId: string;
  variationId: string | null;
  quantity: number;
  unitPrice?: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  shippingZone: ShippingZoneEnum;
  shippingPartner: ShippingPartnerEnum;
  discountAmount?: number;
  advanceAmount?: number;
  items: CreateOrderItemRequest[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatusEnum;
}

export interface FetchOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  statuses?: string;
  trashed?: boolean;
  source?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  ids?: string;
}

export interface InvoiceData {
  invoiceId: string;
  date: string;
  courierName: string;
  trackingCode: string | null;
  deliveryId: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    name: string;
    variation: string | null;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  advanceAmount: number;
  dueAmount: number;
  qrCodeDataUrl: string;
}

export interface CustomerOrderHistory {
  completed: number;
  refunded: number;
  cancelled: number;
  total: number;
  names: string[];
  addresses: string[];
}

export interface OrderNote {
  id: string;
  content: string;
  createdBy: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
