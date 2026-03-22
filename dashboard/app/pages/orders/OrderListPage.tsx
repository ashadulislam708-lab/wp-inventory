import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import { fetchOrders } from "~/services/httpServices/orderService";
import { orderService } from "~/services/httpServices/orderService";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import Pagination from "~/components/atoms/Pagination";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import EmptyState from "~/components/atoms/EmptyState";
import { cn } from "~/lib/utils";
import { formatBDT, formatDateTime } from "~/utils/formatting";
import { getOrderStatusColor, getOrderSourceColor } from "~/utils/badges";
import { OrderStatusEnum, OrderSourceEnum } from "~/enums";
import { ORDER_STATUS_LABELS } from "~/constants/orderStatusLabels";
import { Plus, FileDown, Search, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { FormHandleState } from "~/types/common";

export default function OrderListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { orders, loading, meta } = useAppSelector((state) => state.orders);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formHandle, setFormHandle] = useState<FormHandleState>({
    isLoading: false,
    loadingButtonType: "",
  });

  const loadOrders = useCallback(() => {
    dispatch(
      fetchOrders({
        page,
        limit: 25,
        status: status || undefined,
        source: source || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined,
      })
    );
  }, [dispatch, page, status, source, startDate, endDate, search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPage(1);
      }, 300);
    },
    []
  );

  const handleExportCSV = useCallback(() => {
    setFormHandle({ isLoading: true, loadingButtonType: "export" });
    orderService
      .exportOrders({
        status: status || undefined,
        source: source || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported successfully");
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string })?.message || "Export failed");
      })
      .finally(() => {
        setFormHandle({ isLoading: false, loadingButtonType: "" });
      });
  }, [status, source, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={formHandle.isLoading && formHandle.loadingButtonType === "export"}
          >
            {formHandle.isLoading && formHandle.loadingButtonType === "export" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
          <Button onClick={() => navigate("/orders/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[400px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice ID, customer name, or phone..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val === "all" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(OrderStatusEnum).map((s) => (
                  <SelectItem key={s} value={s}>
                    {ORDER_STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={source}
              onValueChange={(val) => {
                setSource(val === "all" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.values(OrderSourceEnum).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs h-8"
                onClick={() => {
                  const today = new Date().toISOString().split("T")[0];
                  setStartDate(today);
                  setEndDate(today);
                  setPage(1);
                }}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs h-8"
                onClick={() => {
                  const today = new Date();
                  const sevenDaysAgo = new Date(today);
                  sevenDaysAgo.setDate(today.getDate() - 7);
                  setStartDate(sevenDaysAgo.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                  setPage(1);
                }}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs h-8"
                onClick={() => {
                  const today = new Date();
                  const thirtyDaysAgo = new Date(today);
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
                  setEndDate(today.toISOString().split("T")[0]);
                  setPage(1);
                }}
              >
                Last 30 days
              </Button>
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-[160px]"
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-[160px]"
              placeholder="End Date"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="h-48" text="Loading orders..." />
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders found"
              description="Create a new order or adjust your filters."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Courier</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className={cn(
                          "cursor-pointer hover:bg-gray-50",
                          !order.courierConsignmentId && "border-l-2 border-l-red-400"
                        )}
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
                        <TableCell className="text-muted-foreground">
                          {order.customerPhone}
                        </TableCell>
                        <TableCell>{order.items.length}</TableCell>
                        <TableCell className="font-medium">
                          {formatBDT(order.grandTotal)}
                        </TableCell>
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
                        <TableCell>
                          {order.courierConsignmentId ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                limit={meta.limit}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
