import { OrderStatusEnum, OrderSourceEnum, SyncStatusEnum, ProductTypeEnum } from "~/enums";

export const getOrderStatusColor = (
  status: OrderStatusEnum
): string => {
  const map: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.PENDING]:
      "bg-amber-100 text-amber-800 border-amber-200",
    [OrderStatusEnum.CONFIRMED]:
      "bg-blue-100 text-blue-800 border-blue-200",
    [OrderStatusEnum.PROCESSING]:
      "bg-indigo-100 text-indigo-800 border-indigo-200",
    [OrderStatusEnum.SHIPPED]:
      "bg-cyan-100 text-cyan-800 border-cyan-200",
    [OrderStatusEnum.DELIVERED]:
      "bg-green-100 text-green-800 border-green-200",
    [OrderStatusEnum.CANCELLED]:
      "bg-red-100 text-red-800 border-red-200",
    [OrderStatusEnum.RETURNED]:
      "bg-gray-100 text-gray-800 border-gray-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
};

export const getOrderSourceColor = (
  source: OrderSourceEnum
): string => {
  const map: Record<OrderSourceEnum, string> = {
    [OrderSourceEnum.MANUAL]:
      "bg-indigo-100 text-indigo-700 border-indigo-200",
    [OrderSourceEnum.WOOCOMMERCE]:
      "bg-violet-100 text-violet-700 border-violet-200",
  };
  return map[source] ?? "bg-gray-100 text-gray-700";
};

export const getSyncStatusColor = (
  status: SyncStatusEnum
): string => {
  const map: Record<SyncStatusEnum, string> = {
    [SyncStatusEnum.SYNCED]:
      "bg-green-100 text-green-700 border-green-200",
    [SyncStatusEnum.PENDING]:
      "bg-amber-100 text-amber-700 border-amber-200",
    [SyncStatusEnum.ERROR]:
      "bg-red-100 text-red-700 border-red-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
};

export const getProductTypeColor = (
  type: ProductTypeEnum
): string => {
  const map: Record<ProductTypeEnum, string> = {
    [ProductTypeEnum.SIMPLE]:
      "bg-gray-100 text-gray-700 border-gray-200",
    [ProductTypeEnum.VARIABLE]:
      "bg-violet-100 text-violet-700 border-violet-200",
  };
  return map[type] ?? "bg-gray-100 text-gray-700";
};

export const getStockColor = (
  quantity: number,
  threshold: number
): string => {
  if (quantity <= 0) return "text-red-600 font-semibold";
  if (quantity <= threshold) return "text-amber-600 font-semibold";
  return "text-green-600";
};
