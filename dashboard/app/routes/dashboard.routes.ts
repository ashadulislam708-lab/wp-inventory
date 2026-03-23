import { index, route } from "@react-router/dev/routes";

export const dashboardRoutes = [
  index("pages/dashboard/DashboardPage.tsx"),
  route("products", "pages/products/ProductListPage.tsx"),
  route("products/:id", "pages/products/ProductDetailPage.tsx"),
  route("orders", "pages/orders/OrderListPage.tsx"),
  route("orders/new", "pages/orders/CreateOrderPage.tsx"),
  route("orders/invoices", "pages/orders/BulkInvoicePrintPage.tsx"),
  route("orders/:id", "pages/orders/OrderDetailPage.tsx"),
  route("orders/:id/edit", "pages/orders/EditOrderPage.tsx"),
  route("orders/:id/invoice", "pages/orders/InvoicePrintPage.tsx"),
  route("settings", "pages/settings/SettingsPage.tsx"),
];
