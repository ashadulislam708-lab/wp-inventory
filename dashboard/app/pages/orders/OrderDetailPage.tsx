import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import { fetchOrderDetail } from "~/services/httpServices/orderService";
import { orderService } from "~/services/httpServices/orderService";
import { clearCurrentOrder } from "~/redux/features/orderSlice";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
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
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import { formatBDT, formatDateTime } from "~/utils/formatting";
import { getOrderStatusColor, getOrderSourceColor } from "~/utils/badges";
import { SHIPPING_ZONE_LABELS } from "~/utils/shipping";
import { ALLOWED_TRANSITIONS } from "~/constants/orderTransitions";
import { ORDER_STATUS_LABELS } from "~/constants/orderStatusLabels";
import { OrderStatusEnum } from "~/enums";
import {
  ArrowLeft,
  Loader2,
  Printer,
  RefreshCw,
  QrCode,
  Edit,
  Check,
  Send,
  MessageSquare,
  User,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import type { FormHandleState } from "~/types/common";
import type { OrderNote } from "~/types/order";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentOrder: order, loading } = useAppSelector(
    (state) => state.orders
  );
  const [formHandle, setFormHandle] = useState<FormHandleState>({
    isLoading: false,
    loadingButtonType: "",
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    status: string;
  }>({ open: false, status: "" });

  // Notes state
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  useEffect(() => {
    if (id) {
      dispatch(fetchOrderDetail(id));
      // Fetch order notes
      setNotesLoading(true);
      orderService
        .getOrderNotes(id)
        .then(setNotes)
        .catch(() => setNotes([]))
        .finally(() => setNotesLoading(false));
    }
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, id]);

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      if (!id) return;
      setFormHandle({ isLoading: true, loadingButtonType: "status" });
      orderService
        .updateOrderStatus(id, { status: newStatus as OrderStatusEnum })
        .then(() => {
          toast.success(`Order status updated to ${newStatus}`);
          dispatch(fetchOrderDetail(id));
        })
        .catch((err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || "Failed to update status"
          );
        })
        .finally(() => {
          setFormHandle({ isLoading: false, loadingButtonType: "" });
        });
    },
    [id, dispatch]
  );

  const handleRetryCourier = useCallback(() => {
    if (!id) return;
    setFormHandle({ isLoading: true, loadingButtonType: "retry" });
    orderService
      .retryCourier(id)
      .then(() => {
        toast.success("Courier push retried successfully");
        dispatch(fetchOrderDetail(id));
      })
      .catch((err: unknown) => {
        toast.error(
          (err as { message?: string })?.message || "Courier retry failed"
        );
      })
      .finally(() => {
        setFormHandle({ isLoading: false, loadingButtonType: "" });
      });
  }, [id, dispatch]);

  const handleShowQr = useCallback(() => {
    if (!id) return;
    if (qrCodeUrl) {
      setQrCodeUrl(null);
      return;
    }
    orderService
      .getQrCode(id)
      .then((res) => setQrCodeUrl(res.qrCodeDataUrl))
      .catch(() => toast.error("Failed to load QR code"));
  }, [id, qrCodeUrl]);

  const handleAddNote = useCallback(() => {
    if (!id || !newNoteContent.trim()) return;
    setFormHandle({ isLoading: true, loadingButtonType: "note" });
    orderService
      .addOrderNote(id, newNoteContent.trim())
      .then((note) => {
        setNotes((prev) => [note, ...prev]);
        setNewNoteContent("");
        toast.success("Note added successfully");
      })
      .catch((err: unknown) => {
        toast.error(
          (err as { message?: string })?.message || "Failed to add note"
        );
      })
      .finally(() => {
        setFormHandle({ isLoading: false, loadingButtonType: "" });
      });
  }, [id, newNoteContent]);

  if (loading || !order) {
    return <LoadingSpinner className="h-64" text="Loading order..." />;
  }

  const isEditable =
    order.status === OrderStatusEnum.PENDING_PAYMENT ||
    order.status === OrderStatusEnum.ON_HOLD;
  const allowedStatuses = ALLOWED_TRANSITIONS[order.status] ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-2">
        <Link to="/orders" className="text-indigo-600 hover:underline">Orders</Link>
        <span className="text-muted-foreground">&rsaquo;</span>
        <span className="font-mono text-muted-foreground">{order.invoiceId}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{order.invoiceId}</h1>
              <Badge
                variant="outline"
                className={getOrderStatusColor(order.status)}
              >
                {ORDER_STATUS_LABELS[order.status] ?? order.status}
              </Badge>
              <Badge
                variant="outline"
                className={getOrderSourceColor(order.source)}
              >
                {order.source}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Created {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditable && (
            <Button variant="outline" onClick={() => navigate(`/orders/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/orders/${id}/invoice`)}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
          <Button variant="outline" onClick={handleShowQr}>
            <QrCode className="mr-2 h-4 w-4" />
            QR Code
          </Button>
          {!order.courierConsignmentId && (
            <Button
              variant="outline"
              onClick={handleRetryCourier}
              disabled={
                formHandle.isLoading &&
                formHandle.loadingButtonType === "retry"
              }
            >
              {formHandle.isLoading &&
              formHandle.loadingButtonType === "retry" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Push to Courier
            </Button>
          )}
        </div>
      </div>

      {/* QR Code popup */}
      {qrCodeUrl && (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="h-48 w-48"
            />
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-y-3 gap-x-1">
            {(order.statusHistory ?? [order.status]).map((status, index, arr) => {
              const isCurrent = index === arr.length - 1;
              const isDestructive =
                status === OrderStatusEnum.CANCELLED ||
                status === OrderStatusEnum.REFUNDED ||
                status === OrderStatusEnum.FAILED;

              return (
                <div key={index} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium",
                        isCurrent && isDestructive
                          ? "border-red-500 bg-red-500 text-white ring-2 ring-red-300 animate-pulse"
                          : isCurrent
                            ? "border-indigo-500 bg-indigo-500 text-white ring-2 ring-indigo-300 animate-pulse"
                            : isDestructive
                              ? "border-red-500 bg-red-500 text-white"
                              : "border-indigo-500 bg-indigo-500 text-white"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <span
                      className={cn(
                        "text-xs whitespace-nowrap font-medium",
                        isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {ORDER_STATUS_LABELS[status as OrderStatusEnum] ?? status}
                    </span>
                  </div>
                  {index < arr.length - 1 && (
                    <div className="mx-1 h-0.5 w-6 bg-indigo-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status Update */}
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select
              onValueChange={(val) =>
                setConfirmDialog({ open: true, status: val })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                {allowedStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {ORDER_STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formHandle.isLoading &&
              formHandle.loadingButtonType === "status" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
          </div>
        </CardContent>
      </Card>

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, status: "" });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              {confirmDialog.status === OrderStatusEnum.CANCELLED
                ? "Cancelling this order will restore stock quantities, sync stock to WooCommerce, and cancel the Steadfast consignment. This action cannot be undone."
                : confirmDialog.status === OrderStatusEnum.REFUNDED
                  ? "Marking this order as refunded will restore stock quantities and sync stock to WooCommerce."
                  : confirmDialog.status === OrderStatusEnum.FAILED
                    ? "Marking this order as failed will restore stock quantities, sync stock to WooCommerce, and cancel the Steadfast consignment."
                    : `Are you sure you want to change the order status from "${ORDER_STATUS_LABELS[order.status as OrderStatusEnum] ?? order.status}" to "${ORDER_STATUS_LABELS[confirmDialog.status as OrderStatusEnum] ?? confirmDialog.status}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, status: "" })}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmDialog.status === OrderStatusEnum.CANCELLED ||
                confirmDialog.status === OrderStatusEnum.REFUNDED ||
                confirmDialog.status === OrderStatusEnum.FAILED
                  ? "destructive"
                  : "default"
              }
              onClick={() => {
                handleStatusChange(confirmDialog.status);
                setConfirmDialog({ open: false, status: "" });
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-[2fr_1.5fr_1.5fr]">
        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatBDT(item.unitPrice)}</TableCell>
                    <TableCell className="font-medium">
                      {formatBDT(item.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator className="my-3" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBDT(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatBDT(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatBDT(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Grand Total (COD)</span>
                <span>{formatBDT(order.grandTotal)}</span>
              </div>
              {Number(order.advanceAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Advance Payment</span>
                  <span>-{formatBDT(order.advanceAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span>Due Amount</span>
                <span>{formatBDT(Number(order.grandTotal) - Number(order.advanceAmount))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{order.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Phone:</span>{" "}
              <a
                href={`tel:${order.customerPhone}`}
                className="font-medium text-indigo-600 hover:underline"
              >
                {order.customerPhone}
              </a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground">Address:</span>{" "}
              <span className="font-medium">{order.customerAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground ml-6">Shipping Zone:</span>{" "}
              <span className="font-medium">
                {SHIPPING_ZONE_LABELS[order.shippingZone] ??
                  order.shippingZone}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Courier Info */}
        <Card>
          <CardHeader>
            <CardTitle>Courier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Partner:</span>{" "}
              <span className="font-medium">{order.shippingPartner}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Consignment ID:</span>{" "}
              <span className="font-medium">
                {order.courierConsignmentId ?? (
                  <span className="text-red-500">
                    Not sent - Use Push to Courier
                  </span>
                )}
              </span>
            </div>
            {order.courierTrackingCode && (
              <div>
                <span className="text-muted-foreground">Tracking Code:</span>{" "}
                <span className="font-medium">
                  {order.courierTrackingCode}
                </span>
              </div>
            )}
            {order.courierConsignmentId && order.courierTrackingCode && (
              <div className="pt-2">
                <a
                  href={`https://portal.packzy.com/tracking/${order.courierTrackingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Track on Steadfast
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <span className="text-muted-foreground">Source</span>
              <p className="font-medium mt-0.5">
                <Badge
                  variant="outline"
                  className={getOrderSourceColor(order.source)}
                >
                  {order.source}
                </Badge>
              </p>
            </div>
            {order.wcOrderId && (
              <div>
                <span className="text-muted-foreground">WC Order ID</span>
                <p className="font-medium mt-0.5">{order.wcOrderId}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="font-medium mt-0.5">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated</span>
              <p className="font-medium mt-0.5">{formatDateTime(order.updatedAt)}</p>
            </div>
            {order.createdBy && (
              <div>
                <span className="text-muted-foreground">Created By</span>
                <p className="font-medium mt-0.5">{order.createdBy.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add note form */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              className="min-h-[60px] flex-1"
            />
            <Button
              onClick={handleAddNote}
              disabled={
                !newNoteContent.trim() ||
                (formHandle.isLoading &&
                  formHandle.loadingButtonType === "note")
              }
              size="icon"
              className="h-auto self-end"
            >
              {formHandle.isLoading &&
              formHandle.loadingButtonType === "note" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Separator />

          {/* Notes list */}
          {notesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-20 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No notes yet. Add the first note above.
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-md border p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">
                      {note.createdBy}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
