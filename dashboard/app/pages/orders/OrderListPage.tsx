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
import { Plus, FileDown, Search, Loader2, Check, AlertCircle, RefreshCw, X, Printer, Truck } from "lucide-react";
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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasActiveFilters = search || status || source || startDate || endDate;

  const clearAllFilters = () => {
    setSearch("");
    setStatus("");
    setSource("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

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

  // Clear selection when filters/page change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, status, source, startDate, endDate, search]);

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

  const toggleSelect = (orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (orders.length > 0 && orders.every((o) => selectedIds.has(o.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const allSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));

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
        a.download = `orders-${crypto.randomUUID()}.csv`;
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

  const handleSyncWcOrders = useCallback(async () => {
    setFormHandle({ isLoading: true, loadingButtonType: "syncWc" });
    try {
      const result = await orderService.syncWcOrders();
      toast.success(
        `WC Sync complete — Imported: ${result.imported ?? 0}, Updated: ${result.updated ?? 0}, Errors: ${result.errors ?? 0}`
      );
      loadOrders();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "WC order sync failed"
      );
    } finally {
      setFormHandle({ isLoading: false, loadingButtonType: "" });
    }
  }, [loadOrders]);

  const handleSyncSelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.warning("No orders selected");
      return;
    }
    setFormHandle({ isLoading: true, loadingButtonType: "syncSelected" });
    try {
      const result = await orderService.syncSelectedOrders(Array.from(selectedIds));
      toast.success(
        `Sync complete — Synced: ${result.synced}, Skipped: ${result.skipped}, Errors: ${result.errors}`
      );
      setSelectedIds(new Set());
      loadOrders();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Order sync failed"
      );
    } finally {
      setFormHandle({ isLoading: false, loadingButtonType: "" });
    }
  }, [selectedIds, loadOrders]);

  const handleExportSelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.warning("No orders selected");
      return;
    }
    setFormHandle({ isLoading: true, loadingButtonType: "exportSelected" });
    try {
      const blob = await orderService.exportOrders({
        ids: Array.from(selectedIds).join(","),
        status: status || undefined,
        source: source || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${crypto.randomUUID()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedIds.size} orders`);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Export failed"
      );
    } finally {
      setFormHandle({ isLoading: false, loadingButtonType: "" });
    }
  }, [selectedIds, status, source, startDate, endDate]);

  const handleBulkPrintInvoice = useCallback(() => {
    if (selectedIds.size === 0) {
      toast.warning("No orders selected");
      return;
    }
    navigate(`/orders/invoices?ids=${Array.from(selectedIds).join(",")}`);
  }, [selectedIds, navigate]);

  const handleBulkPushCourier = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.warning("No orders selected");
      return;
    }
    setFormHandle({ isLoading: true, loadingButtonType: "pushCourier" });
    try {
      const result = await orderService.bulkPushCourier(Array.from(selectedIds));
      if (result.pushed > 0) {
        toast.success(`${result.pushed} order(s) pushed to courier successfully`);
      }
      if (result.skipped > 0) {
        const skippedItems = result.results
          .filter((r) => r.status === "skipped")
          .map((r) => `${r.invoiceId}: ${r.error}`)
          .join(", ");
        toast.warning(`${result.skipped} skipped — ${skippedItems}`);
      }
      if (result.errors > 0) {
        const errorItems = result.results
          .filter((r) => r.status === "error")
          .map((r) => `${r.invoiceId}: ${r.error}`)
          .join(", ");
        toast.error(`${result.errors} failed — ${errorItems}`);
      }
      if (result.pushed === 0 && result.errors === 0 && result.skipped === 0) {
        toast.info("No orders to process");
      }
      setSelectedIds(new Set());
      loadOrders();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Bulk courier push failed"
      );
    } finally {
      setFormHandle({ isLoading: false, loadingButtonType: "" });
    }
  }, [selectedIds, loadOrders]);

  const isBusy = formHandle.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSyncWcOrders}
            disabled={isBusy && formHandle.loadingButtonType === "syncWc"}
          >
            {isBusy && formHandle.loadingButtonType === "syncWc" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync WC Orders
          </Button>
          <Button onClick={() => navigate("/orders/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-900">
            {selectedIds.size} order{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkPrintInvoice}
            >
              <Printer className="mr-1 h-3 w-3" />
              Print Invoice
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncSelected}
              disabled={isBusy && formHandle.loadingButtonType === "syncSelected"}
            >
              {isBusy && formHandle.loadingButtonType === "syncSelected" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3 w-3" />
              )}
              Sync Orders
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkPushCourier}
              disabled={isBusy && formHandle.loadingButtonType === "pushCourier"}
            >
              {isBusy && formHandle.loadingButtonType === "pushCourier" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Truck className="mr-1 h-3 w-3" />
              )}
              Push to Courier
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportSelected}
              disabled={isBusy && formHandle.loadingButtonType === "exportSelected"}
            >
              {isBusy && formHandle.loadingButtonType === "exportSelected" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <FileDown className="mr-1 h-3 w-3" />
              )}
              Export Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-xs h-8 text-muted-foreground hover:text-destructive"
                onClick={clearAllFilters}
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            )}
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
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableHead>
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
                          !order.courierConsignmentId && "border-l-2 border-l-red-400",
                          selectedIds.has(order.id) && "bg-blue-50/50"
                        )}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
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
