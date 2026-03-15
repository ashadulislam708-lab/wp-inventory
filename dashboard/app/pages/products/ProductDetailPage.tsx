import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import {
  fetchProductDetail,
} from "~/services/httpServices/productService";
import { productService } from "~/services/httpServices/productService";
import { clearCurrentProduct } from "~/redux/features/productSlice";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import { formatBDT, formatDateTime } from "~/utils/formatting";
import {
  getProductTypeColor,
  getSyncStatusColor,
  getStockColor,
} from "~/utils/badges";
import { ProductTypeEnum } from "~/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  stockAdjustmentSchema,
  type StockAdjustmentFormData,
} from "~/utils/validations/stock";
import {
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { FormHandleState } from "~/types/common";

const STOCK_REASONS = [
  "Physical count adjustment",
  "Damage",
  "Return",
  "Restock",
  "Correction",
  "Other",
];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentProduct: product, loading } = useAppSelector(
    (state) => state.products
  );
  const [formHandle, setFormHandle] = useState<FormHandleState>({
    isLoading: false,
    loadingButtonType: "",
  });
  const [selectedVariation, setSelectedVariation] = useState<string | null>(
    null
  );

  const form = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      quantity: 0,
      reason: "",
      note: "",
    },
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchProductDetail(id));
    }
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id]);

  const handleStockAdjust = useCallback(
    (data: StockAdjustmentFormData) => {
      if (!id) return;
      setFormHandle({ isLoading: true, loadingButtonType: "adjust" });

      const adjustFn = selectedVariation
        ? productService.adjustVariationStock(selectedVariation, data)
        : productService.adjustStock(id, data);

      adjustFn
        .then(() => {
          toast.success("Stock updated successfully");
          form.reset();
          setSelectedVariation(null);
          dispatch(fetchProductDetail(id));
        })
        .catch((err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || "Failed to adjust stock"
          );
        })
        .finally(() => {
          setFormHandle({ isLoading: false, loadingButtonType: "" });
        });
    },
    [id, selectedVariation, dispatch, form]
  );

  if (loading || !product) {
    return <LoadingSpinner className="h-64" text="Loading product..." />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/products" className="text-indigo-600 hover:underline">
          Products
        </Link>
        <span className="text-muted-foreground">&rsaquo;</span>
        <span className="text-muted-foreground">{product.name}</span>
      </nav>

      {/* Product Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="sm:w-[70%]">
              <div className="flex gap-6">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-48 w-48 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100 text-gray-400 shrink-0">
                    No Image
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-bold">{product.name}</h2>
                    <Badge
                      variant="outline"
                      className={getProductTypeColor(product.type)}
                    >
                      {product.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getSyncStatusColor(product.syncStatus)}
                    >
                      {product.syncStatus}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-md px-3 py-2">
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">SKU:</span>{" "}
                        <span className="font-mono font-medium">{product.sku}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>{" "}
                        <span className="font-medium">
                          {product.category?.name ?? "Uncategorized"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>{" "}
                        <span className="font-medium">
                          {formatBDT(product.salePrice ?? product.regularPrice)}
                        </span>
                        {product.salePrice && (
                          <span className="ml-2 text-muted-foreground line-through">
                            {formatBDT(product.regularPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {product.wcPermalink && (
                    <a
                      href={product.wcPermalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Edit in WooCommerce
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="sm:w-[30%]">
              <div className="flex flex-col items-center justify-center h-full space-y-1">
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p
                  className={`text-3xl font-bold ${getStockColor(
                    product.stockQuantity,
                    product.lowStockThreshold
                  )}`}
                >
                  {product.stockQuantity}
                </p>
                <p className="text-xs text-gray-400">
                  Alert below: {product.lowStockThreshold}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variations Table (for variable products) */}
      {product.type === ProductTypeEnum.VARIABLE &&
        product.variations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Variations ({product.variations?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Attributes</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variations.map((variation) => (
                      <TableRow key={variation.id}>
                        <TableCell className="font-medium">
                          {variation.sku}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(variation.attributes).map(
                              ([key, value]) => (
                                <Badge key={key} variant="secondary">
                                  {key}: {value}
                                </Badge>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatBDT(
                            variation.salePrice ?? variation.regularPrice
                          )}
                        </TableCell>
                        <TableCell
                          className={
                            variation.stockQuantity <= 0
                              ? "text-red-600 font-semibold"
                              : variation.stockQuantity <= 5
                                ? "text-amber-600 font-semibold"
                                : "text-green-600"
                          }
                        >
                          {variation.stockQuantity}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedVariation(variation.id)
                            }
                          >
                            Adjust Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Stock Adjustment Form */}
      <Card className="border-l-4 border-l-indigo-600">
        <CardHeader>
          <CardTitle>
            Adjust Stock
            {selectedVariation && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Variation:{" "}
                {product.variations.find((v) => v.id === selectedVariation)
                  ?.sku ?? ""}
                )
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => setSelectedVariation(null)}
                >
                  Clear
                </Button>
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleStockAdjust)}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Quantity (+/-)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 5 or -3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Reason</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STOCK_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional note..."
                        className="min-h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={
                  formHandle.isLoading &&
                  formHandle.loadingButtonType === "adjust"
                }
              >
                {formHandle.isLoading &&
                formHandle.loadingButtonType === "adjust" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Adjust Stock
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Stock History */}
      <Card>
        <CardHeader>
          <CardTitle>Stock History</CardTitle>
        </CardHeader>
        <CardContent>
          {product.stockHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No stock adjustments recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Adjusted By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.stockHistory.map((entry) => {
                    const change = entry.newQty - entry.previousQty;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(entry.createdAt)}
                        </TableCell>
                        <TableCell>{entry.previousQty}</TableCell>
                        <TableCell>{entry.newQty}</TableCell>
                        <TableCell
                          className={
                            change > 0
                              ? "text-green-600"
                              : change < 0
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {change > 0 ? "+" : ""}
                          {change}
                        </TableCell>
                        <TableCell>{entry.reason}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.adjustedBy}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
