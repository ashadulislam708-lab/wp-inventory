import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { orderService } from "~/services/httpServices/orderService";
import { productService } from "~/services/httpServices/productService";
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
import { formatBDT } from "~/utils/formatting";
import { getShippingFee, SHIPPING_ZONE_LABELS } from "~/utils/shipping";
import {
  ShippingZoneEnum,
  ShippingPartnerEnum,
  ProductTypeEnum,
} from "~/enums";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductDetail, ProductVariation } from "~/types/product";
import type { CreateOrderItemRequest } from "~/types/order";
import type { FormHandleState } from "~/types/common";

interface CartItem {
  productId: string;
  variationId: string | null;
  productName: string;
  variationLabel: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [formHandle, setFormHandle] = useState<FormHandleState>({
    isLoading: false,
    loadingButtonType: "",
  });

  // Product search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected product detail (for variations)
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null
  );
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

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
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const grandTotal = subtotal + shippingFee;

  // Product search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchTotal(0);
      setSearchPage(1);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      setSearchPage(1);
      productService
        .getProducts({ search: searchQuery, limit: 10, page: 1 })
        .then((res) => {
          setSearchResults(res.data);
          setSearchTotal(res.meta.total);
        })
        .catch(() => {
          setSearchResults([]);
          setSearchTotal(0);
        })
        .finally(() => setSearching(false));
    }, 300);
  }, [searchQuery]);

  // Load more search results
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !searchQuery.trim()) return;
    const nextPage = searchPage + 1;
    setLoadingMore(true);
    productService
      .getProducts({ search: searchQuery, limit: 10, page: nextPage })
      .then((res) => {
        setSearchResults((prev) => [...prev, ...res.data]);
        setSearchPage(nextPage);
        setSearchTotal(res.meta.total);
      })
      .catch(() => {
        toast.error("Failed to load more products");
      })
      .finally(() => setLoadingMore(false));
  }, [loadingMore, searchQuery, searchPage]);

  const handleSelectProduct = useCallback(
    async (product: Product) => {
      setSearchQuery("");
      setSearchResults([]);
      setSearchTotal(0);
      setSearchPage(1);

      if (product.type === ProductTypeEnum.VARIABLE) {
        setLoadingProduct(true);
        try {
          const detail = await productService.getProductById(product.id);
          setSelectedProduct(detail);
        } catch {
          toast.error("Failed to load product variations");
        } finally {
          setLoadingProduct(false);
        }
      } else {
        // Simple product - add directly
        const existing = cartItems.find(
          (i) => i.productId === product.id && !i.variationId
        );
        if (existing) {
          toast.error("Product already in cart");
          return;
        }
        if (product.stockQuantity <= 0) {
          toast.error("Product is out of stock");
          return;
        }
        setCartItems((prev) => [
          ...prev,
          {
            productId: product.id,
            variationId: null,
            productName: product.name,
            variationLabel: "",
            unitPrice: product.salePrice ?? product.regularPrice,
            quantity: 1,
            maxStock: product.stockQuantity,
          },
        ]);
      }
    },
    [cartItems]
  );

  const handleSelectVariation = useCallback(
    (variation: ProductVariation) => {
      if (!selectedProduct) return;
      const existing = cartItems.find(
        (i) =>
          i.productId === selectedProduct.id &&
          i.variationId === variation.id
      );
      if (existing) {
        toast.error("Variation already in cart");
        return;
      }
      if (variation.stockQuantity <= 0) {
        toast.error("Variation is out of stock");
        return;
      }
      const attrLabel = Object.entries(variation.attributes)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      setCartItems((prev) => [
        ...prev,
        {
          productId: selectedProduct.id,
          variationId: variation.id,
          productName: selectedProduct.name,
          variationLabel: attrLabel,
          unitPrice: variation.salePrice ?? variation.regularPrice,
          quantity: 1,
          maxStock: variation.stockQuantity,
        },
      ]);
      setSelectedProduct(null);
    },
    [selectedProduct, cartItems]
  );

  const handleQuantityChange = useCallback(
    (index: number, qty: number) => {
      setCartItems((prev) =>
        prev.map((item, i) => {
          if (i !== index) return item;
          const newQty = Math.max(1, Math.min(qty, item.maxStock));
          return { ...item, quantity: newQty };
        })
      );
    },
    []
  );

  const handleRemoveItem = useCallback((index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCreateOrder = useCallback(
    (data: CreateOrderFormData) => {
      if (cartItems.length === 0) {
        toast.error("Add at least one product to the order");
        return;
      }
      setFormHandle({ isLoading: true, loadingButtonType: "create" });

      const items: CreateOrderItemRequest[] = cartItems.map((item) => ({
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
      }));

      orderService
        .createOrder({ ...data, items })
        .then((order) => {
          toast.success(`Order ${order.invoiceId} created successfully`);
          navigate(`/orders/${order.id}`);
        })
        .catch((err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || "Failed to create order"
          );
        })
        .finally(() => {
          setFormHandle({ isLoading: false, loadingButtonType: "" });
        });
    },
    [cartItems, navigate]
  );

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center gap-2 text-sm mb-2">
          <Link to="/orders" className="text-indigo-600 hover:underline">Orders</Link>
          <span className="text-muted-foreground">&rsaquo;</span>
          <span className="text-muted-foreground">New Order</span>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Create New Order</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Left - Product Selection */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Search results dropdown */}
              {(searching || searchResults.length > 0) && searchQuery.trim() && (
                <div className="max-h-72 overflow-y-auto rounded-md border">
                  {searching && searchResults.length === 0 ? (
                    /* Loading skeleton rows while initial search is in progress */
                    <div className="divide-y">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 animate-pulse"
                        >
                          <div className="h-8 w-8 rounded bg-gray-200" />
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="h-3.5 w-3/4 rounded bg-gray-200" />
                            <div className="h-3 w-1/2 rounded bg-gray-200" />
                          </div>
                          <div className="h-3.5 w-16 rounded bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="flex w-full items-center gap-3 border-b p-3 text-left hover:bg-accent last:border-b-0"
                          onClick={() => handleSelectProduct(product)}
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-gray-100" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku} | Stock: {product.stockQuantity}
                            </p>
                          </div>
                          <span className="text-sm font-medium">
                            {formatBDT(
                              product.salePrice ?? product.regularPrice
                            )}
                          </span>
                        </button>
                      ))}
                      {/* Loading indicator when refining search with existing results */}
                      {searching && searchResults.length > 0 && (
                        <div className="flex items-center justify-center border-t p-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-xs text-muted-foreground">
                            Updating results...
                          </span>
                        </div>
                      )}
                      {/* Load more and count indicator */}
                      {!searching && (
                        <div className="border-t bg-gray-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Showing {searchResults.length} of {searchTotal} results
                            </span>
                            {searchResults.length < searchTotal && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="h-7 text-xs"
                              >
                                {loadingMore ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : null}
                                Load more
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Variation selector */}
              {loadingProduct && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Loading variations...
                </p>
              )}
              {selectedProduct && (
                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Select variation for: {selectedProduct.name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProduct(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                  {selectedProduct.variations.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="flex w-full items-center justify-between rounded border p-2 text-left hover:bg-accent"
                      onClick={() => handleSelectVariation(v)}
                      disabled={v.stockQuantity <= 0}
                    >
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(v.attributes).map(([k, val]) => (
                          <Badge key={k} variant="secondary" className="text-xs">
                            {k}: {val}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-right text-sm">
                        <p>{formatBDT(v.salePrice ?? v.regularPrice)}</p>
                        <p
                          className={
                            v.stockQuantity <= 0
                              ? "text-red-500 text-xs"
                              : "text-muted-foreground text-xs"
                          }
                        >
                          Stock: {v.stockQuantity}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Cart */}
              {cartItems.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item, index) => (
                        <TableRow key={`${item.productId}-${item.variationId}`}>
                          <TableCell>
                            <p className="text-sm font-medium">
                              {item.productName}
                            </p>
                            {item.variationLabel && (
                              <p className="text-xs text-muted-foreground">
                                {item.variationLabel}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={item.maxStock}
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  index,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatBDT(item.unitPrice * item.quantity)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {cartItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Plus className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Search and add products to the order
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Customer & Summary */}
        <div className="sticky top-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  id="create-order-form"
                  onSubmit={form.handleSubmit(handleCreateOrder)}
                  className="space-y-5"
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
                          <Textarea rows={3} placeholder="Full delivery address" {...field} />
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
          <Card className="bg-indigo-50/50">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Items ({cartItems.reduce((s, i) => s + i.quantity, 0)})
                </span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping Fee</span>
                <span>{formatBDT(shippingFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total (COD)</span>
                <span className="text-lg text-indigo-600">{formatBDT(grandTotal)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Due Amount</span>
                <span>{formatBDT(grandTotal)}</span>
              </div>
              <Button
                type="submit"
                form="create-order-form"
                className="w-full h-12"
                disabled={
                  cartItems.length === 0 ||
                  (formHandle.isLoading &&
                    formHandle.loadingButtonType === "create")
                }
              >
                {formHandle.isLoading &&
                formHandle.loadingButtonType === "create" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Order
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Order will be automatically sent to Steadfast courier
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
