import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { fetchOrderDetail } from "~/services/httpServices/orderService";
import { orderService } from "~/services/httpServices/orderService";
import { clearCurrentOrder } from "~/redux/features/orderSlice";
import {
  createOrderSchema,
  type CreateOrderFormData,
} from "~/utils/validations/order";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import { formatBDT, formatDateTime } from "~/utils/formatting";
import { getShippingFee, SHIPPING_ZONE_LABELS } from "~/utils/shipping";
import { getOrderStatusColor, getOrderSourceColor } from "~/utils/badges";
import {
  ShippingZoneEnum,
  ShippingPartnerEnum,
  OrderStatusEnum,
} from "~/enums";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { FormHandleState } from "~/types/common";
import type { CreateOrderItemRequest } from "~/types/order";

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentOrder: order, loading, error } = useAppSelector(
    (state) => state.orders
  );

  const [formHandle, setFormHandle] = useState<FormHandleState>({
    isLoading: false,
    loadingButtonType: "",
  });

  // Discount & Advance
  const [discountAmount, setDiscountAmount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      shippingZone: ShippingZoneEnum.INSIDE_DHAKA,
      shippingPartner: ShippingPartnerEnum.STEADFAST,
    },
  });

  const shippingZone = form.watch("shippingZone");
  const shippingFee = getShippingFee(shippingZone);

  const subtotal = order?.items.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  ) ?? 0;
  const grandTotal = subtotal - discountAmount + shippingFee;
  const dueAmount = grandTotal - advanceAmount;

  // Fetch order data on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchOrderDetail(id));
    }
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, id]);

  // Pre-fill form when order data loads
  useEffect(() => {
    if (order) {
      form.reset({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        shippingZone: order.shippingZone,
        shippingPartner: order.shippingPartner,
      });
      setDiscountAmount(Number(order.discountAmount) || 0);
      setAdvanceAmount(Number(order.advanceAmount) || 0);
    }
  }, [order, form]);

  // Redirect away if order is not in an editable status
  useEffect(() => {
    if (
      order &&
      order.status !== OrderStatusEnum.PENDING_PAYMENT &&
      order.status !== OrderStatusEnum.ON_HOLD
    ) {
      toast.error(
        `Order cannot be edited in ${order.status} status. Only Pending payment and On hold orders can be edited.`
      );
      navigate(`/orders/${id}`, { replace: true });
    }
  }, [order, id, navigate]);

  const handleUpdateOrder = useCallback(
    (data: CreateOrderFormData) => {
      if (!id || !order) return;

      setFormHandle({ isLoading: true, loadingButtonType: "edit" });

      // Send existing items unchanged (items are read-only on edit)
      const items: CreateOrderItemRequest[] = order.items.map((item) => ({
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
      }));

      orderService
        .updateOrder(id, {
          ...data,
          items,
          discountAmount: discountAmount || undefined,
          advanceAmount: advanceAmount || undefined,
        })
        .then(() => {
          toast.success(`Order ${order.invoiceId} updated successfully`);
          navigate(`/orders/${id}`);
        })
        .catch((err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || "Failed to update order"
          );
        })
        .finally(() => {
          setFormHandle({ isLoading: false, loadingButtonType: "" });
        });
    },
    [id, order, navigate, discountAmount, advanceAmount]
  );

  // Loading state
  if (loading || !order) {
    return <LoadingSpinner className="h-64" text="Loading order..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium text-red-600">{error}</p>
        <Button variant="outline" onClick={() => navigate("/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  // Guard: if order is not editable, show message (fallback for the redirect useEffect)
  if (
    order.status !== OrderStatusEnum.PENDING_PAYMENT &&
    order.status !== OrderStatusEnum.ON_HOLD
  ) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
        <p className="text-lg font-medium">
          This order cannot be edited in its current status ({order.status}).
        </p>
        <Button variant="outline" onClick={() => navigate(`/orders/${id}`)}>
          Back to Order Detail
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/orders/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Edit {order.invoiceId}</h1>
              <Badge
                variant="outline"
                className={getOrderStatusColor(order.status)}
              >
                {order.status}
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
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Editing Order</p>
            <p className="mt-1">
              You can update customer information and shipping zone. Order items
              cannot be changed after creation. Updating the order will
              re-push to the courier service.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Left - Order Items (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items (Read-only)</CardTitle>
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
                    <TableCell>{formatBDT(Number(item.unitPrice))}</TableCell>
                    <TableCell className="font-medium">
                      {formatBDT(Number(item.totalPrice))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator className="my-3" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatBDT(subtotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Right - Customer Info & Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  id="edit-order-form"
                  onSubmit={form.handleSubmit(handleUpdateOrder)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="01XXXXXXXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Full delivery address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shippingZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Zone</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {Object.values(ShippingZoneEnum).map((zone) => (
                              <label
                                key={zone}
                                className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                                  field.value === zone
                                    ? "border-indigo-600 bg-indigo-50"
                                    : "border-input hover:bg-accent"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="shippingZone"
                                  value={zone}
                                  checked={field.value === zone}
                                  onChange={() => field.onChange(zone)}
                                  className="accent-indigo-600"
                                />
                                <span className="text-sm font-medium">
                                  {SHIPPING_ZONE_LABELS[zone]}{" "}
                                  <span className="text-muted-foreground font-normal">
                                    ({getShippingFee(zone)} BDT)
                                  </span>
                                </span>
                              </label>
                            ))}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shippingPartner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Partner</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <label
                              className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                                field.value === ShippingPartnerEnum.STEADFAST
                                  ? "border-indigo-600 bg-indigo-50"
                                  : "border-input hover:bg-accent"
                              }`}
                            >
                              <input
                                type="radio"
                                name="shippingPartner"
                                value={ShippingPartnerEnum.STEADFAST}
                                checked={field.value === ShippingPartnerEnum.STEADFAST}
                                onChange={() => field.onChange(ShippingPartnerEnum.STEADFAST)}
                                className="accent-indigo-600"
                              />
                              <span className="text-sm font-medium">Steadfast</span>
                            </label>
                            <label
                              className="flex items-center gap-3 rounded-md border p-3 cursor-not-allowed opacity-60 border-input"
                            >
                              <input
                                type="radio"
                                name="shippingPartner"
                                value={ShippingPartnerEnum.PATHAO}
                                disabled
                                className="accent-indigo-600"
                              />
                              <span className="text-sm font-medium">Pathao</span>
                              <Badge variant="secondary" className="text-xs ml-auto">Coming Soon</Badge>
                            </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Items (
                  {order.items.reduce((s, i) => s + i.quantity, 0)})
                </span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Discount Amount</label>
                <Input
                  type="number"
                  min={0}
                  max={subtotal}
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                />
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600 mt-1">
                    <span>After Discount</span>
                    <span>{formatBDT(subtotal - discountAmount)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping Fee</span>
                <span>{formatBDT(shippingFee)}</span>
              </div>
              {shippingFee !== Number(order.shippingFee) && (
                <div className="flex justify-between text-xs text-amber-600">
                  <span>Previous Shipping Fee</span>
                  <span className="line-through">
                    {formatBDT(Number(order.shippingFee))}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total (COD)</span>
                <span className="text-lg text-indigo-600">{formatBDT(grandTotal)}</span>
              </div>
              {grandTotal !== Number(order.grandTotal) && (
                <div className="flex justify-between text-xs text-amber-600">
                  <span>Previous Total</span>
                  <span className="line-through">
                    {formatBDT(Number(order.grandTotal))}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Advance Amount</label>
                <Input
                  type="number"
                  min={0}
                  max={grandTotal}
                  value={advanceAmount || ""}
                  onChange={(e) => setAdvanceAmount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                />
                {advanceAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600 mt-1">
                    <span>After Advance</span>
                    <span>{formatBDT(dueAmount)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between font-bold">
                <span>Due Amount</span>
                <span>{formatBDT(dueAmount)}</span>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/orders/${id}`)}
                  disabled={
                    formHandle.isLoading &&
                    formHandle.loadingButtonType === "edit"
                  }
                >
                  Cancel Edit
                </Button>
                <Button
                  type="submit"
                  form="edit-order-form"
                  className="flex-1"
                  disabled={
                    formHandle.isLoading &&
                    formHandle.loadingButtonType === "edit"
                  }
                >
                  {formHandle.isLoading &&
                  formHandle.loadingButtonType === "edit" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
