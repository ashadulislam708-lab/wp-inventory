import { useEffect, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import {
  fetchDashboardStats,
  fetchLowStockProducts,
  fetchRecentOrders,
} from "~/services/httpServices/dashboardService";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import EmptyState from "~/components/atoms/EmptyState";
import Pagination from "~/components/atoms/Pagination";
import { formatBDT, formatDateTime } from "~/utils/formatting";
import { getOrderStatusColor, getOrderSourceColor } from "~/utils/badges";
import { ORDER_STATUS_LABELS } from "~/constants/orderStatusLabels";
import { OrderStatusEnum } from "~/enums";
import {
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  WifiOff,
  CheckCircle,
} from "lucide-react";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    stats,
    lowStockProducts,
    lowStockMeta,
    recentOrders,
    recentOrdersMeta,
    loading,
  } = useAppSelector((state) => state.dashboard);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [recentOrdersPage, setRecentOrdersPage] = useState(1);

  const loadData = useCallback(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLowStockProducts({ page: lowStockPage, limit: 10 }));
    dispatch(fetchRecentOrders({ page: recentOrdersPage, limit: 10 }));
  }, [dispatch, lowStockPage, recentOrdersPage]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && !stats) {
    return <LoadingSpinner className="h-64" text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-indigo-100 p-3">
              <Package className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orders Today</p>
              <p className="text-[32px] font-bold leading-tight">
                {stats?.totalOrdersToday ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue Today</p>
              <p className="text-[32px] font-bold leading-tight">
                {formatBDT(stats?.revenueToday ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-amber-100 p-3">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
              <p className="text-[32px] font-bold leading-tight">
                {stats?.pendingOrdersCount ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-[32px] font-bold leading-tight">
                {lowStockMeta?.total ?? lowStockProducts.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Widgets */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(stats?.failedCourierCount ?? 0) > 0 ? (
          <Card className="border-l-4 border-l-red-500 border-red-200 bg-red-50">
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Failed Courier Pushes
                  </p>
                  <p className="text-lg font-bold text-red-900">
                    {stats?.failedCourierCount} orders need attention
                  </p>
                </div>
              </div>
              <Link
                to="/orders?courierStatus=failed"
                className="text-sm text-red-700 hover:underline whitespace-nowrap"
              >
                View Orders
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  All orders dispatched
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {(stats?.syncErrorCount ?? 0) > 0 ? (
          <Card className="border-l-4 border-l-amber-500 border-amber-200 bg-amber-50">
            <CardContent className="flex items-center justify-between gap-3 pt-6">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Sync Errors
                  </p>
                  <p className="text-lg font-bold text-amber-900">
                    {stats?.syncErrorCount} sync failures
                  </p>
                </div>
              </div>
              <Link
                to="/settings/sync-logs"
                className="text-sm text-amber-700 hover:underline whitespace-nowrap"
              >
                View Sync Logs
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Sync healthy
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link to="/orders" className="text-sm text-indigo-600 hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <EmptyState
              title="No recent orders"
              description="Orders will appear here once they are created."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <TableCell>
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-mono font-medium text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.invoiceId}
                          </Link>
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{formatBDT(order.grandTotal)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getOrderStatusColor(order.status)}
                          >
                            {ORDER_STATUS_LABELS[order.status as OrderStatusEnum] ?? order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getOrderSourceColor(order.source)}
                          >
                            {order.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {recentOrdersMeta && (
                <Pagination
                  page={recentOrdersMeta.page}
                  totalPages={recentOrdersMeta.totalPages}
                  total={recentOrdersMeta.total}
                  limit={recentOrdersMeta.limit}
                  onPageChange={setRecentOrdersPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Products */}
      {(lowStockMeta?.total ?? lowStockProducts.length) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Link
                          to={`/products/${product.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.sku}
                      </TableCell>
                      <TableCell
                        className={
                          product.stockQuantity <= 0
                            ? "text-red-600 font-semibold"
                            : "text-amber-600 font-semibold"
                        }
                      >
                        {product.stockQuantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.lowStockThreshold}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {lowStockMeta && (
              <Pagination
                page={lowStockMeta.page}
                totalPages={lowStockMeta.totalPages}
                total={lowStockMeta.total}
                limit={lowStockMeta.limit}
                onPageChange={setLowStockPage}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
