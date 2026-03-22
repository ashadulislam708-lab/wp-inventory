import { useState, useCallback, useEffect } from "react";
import { settingsService } from "~/services/httpServices/settingsService";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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
import { formatDateTime, formatBDT } from "~/utils/formatting";
import { Loader2, RefreshCw, Download, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { WcOrderSummary } from "~/types/settings";

const WC_STATUS_OPTIONS = [
  { value: "any", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

export default function WcOrderBrowser() {
  const [orders, setOrders] = useState<WcOrderSummary[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("any");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [bulkSyncing, setBulkSyncing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, perPage: 20 };
      if (statusFilter !== "any") {
        params.status = statusFilter;
      }
      const result = await settingsService.fetchWcOrders(params);
      setOrders(result.data);
      setMeta(result.meta);
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          "Failed to fetch WooCommerce orders"
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [orders]);

  const unsyncedOrders = orders.filter((o) => !o.isSynced);
  const allUnsyncedSelected =
    unsyncedOrders.length > 0 &&
    unsyncedOrders.every((o) => selectedIds.has(o.wcOrderId));

  const toggleSelect = (wcOrderId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(wcOrderId)) {
        next.delete(wcOrderId);
      } else {
        next.add(wcOrderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allUnsyncedSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unsyncedOrders.map((o) => o.wcOrderId)));
    }
  };

  const handleSyncSingle = async (wcOrderId: number) => {
    setSyncingId(wcOrderId);
    try {
      const result = await settingsService.syncSingleOrder(wcOrderId);
      if (result.status === "created") {
        toast.success(`Order WC #${wcOrderId} synced (${result.invoiceId})`);
      } else {
        toast.info(`Order WC #${wcOrderId} was already synced`);
      }
      await fetchOrders();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message ||
          `Failed to sync WC #${wcOrderId}`
      );
    } finally {
      setSyncingId(null);
    }
  };

  const handleBulkSync = async () => {
    if (selectedIds.size === 0) {
      toast.warning("No orders selected");
      return;
    }

    setBulkSyncing(true);
    try {
      const result = await settingsService.syncBulkOrders(
        Array.from(selectedIds)
      );
      toast.success(
        `Synced: ${result.synced}, Skipped: ${result.skipped}, Errors: ${result.errors}`
      );
      setSelectedIds(new Set());
      await fetchOrders();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string })?.message || "Bulk sync failed"
      );
    } finally {
      setBulkSyncing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>WooCommerce Orders</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                {WC_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={handleBulkSync}
                disabled={bulkSyncing}
              >
                {bulkSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Sync Selected ({selectedIds.size})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <EmptyState description="No WooCommerce orders found" />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={allUnsyncedSelected && unsyncedOrders.length > 0}
                        onChange={toggleSelectAll}
                        disabled={unsyncedOrders.length === 0}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>WC Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>WC Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.wcOrderId}
                      className={order.isSynced ? "bg-green-50/50" : ""}
                    >
                      <TableCell>
                        {!order.isSynced && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(order.wcOrderId)}
                            onChange={() => toggleSelect(order.wcOrderId)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        #{order.wcOrderId}
                      </TableCell>
                      <TableCell>{order.customerName || "N/A"}</TableCell>
                      <TableCell>{order.customerPhone || "N/A"}</TableCell>
                      <TableCell>
                        {formatBDT(parseFloat(order.total))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {order.wcStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(order.dateCreated)}
                      </TableCell>
                      <TableCell>
                        {order.isSynced ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Synced
                            {order.localInvoiceId && (
                              <span className="ml-1">
                                ({order.localInvoiceId})
                              </span>
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Synced</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!order.isSynced && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncSingle(order.wcOrderId)}
                            disabled={syncingId === order.wcOrderId || bulkSyncing}
                          >
                            {syncingId === order.wcOrderId ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="mr-1 h-3 w-3" />
                            )}
                            Sync
                          </Button>
                        )}
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
              limit={meta.perPage}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
