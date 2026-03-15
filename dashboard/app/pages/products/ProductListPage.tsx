import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "~/redux/store/hooks";
import { fetchProducts, fetchCategories } from "~/services/httpServices/productService";
import { settingsService } from "~/services/httpServices/settingsService";
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
import Pagination from "~/components/atoms/Pagination";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import EmptyState from "~/components/atoms/EmptyState";
import { formatBDT } from "~/utils/formatting";
import {
  getProductTypeColor,
  getSyncStatusColor,
  getStockColor,
} from "~/utils/badges";
import { cn } from "~/lib/utils";
import { StockStatusEnum } from "~/enums";
import { Search, Download, Loader2, Eye, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { FormHandleState } from "~/types/common";

export default function ProductListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { products, categories, loading, meta } = useAppSelector(
    (state) => state.products
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formHandle, setFormHandle] = useState<FormHandleState>({
    isLoading: false,
    loadingButtonType: "",
  });

  const loadProducts = useCallback(() => {
    dispatch(
      fetchProducts({
        page,
        limit: 25,
        search: search || undefined,
        category: category || undefined,
        stockStatus: stockStatus || undefined,
      })
    );
  }, [dispatch, page, search, category, stockStatus]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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

  const handleImport = useCallback(() => {
    setFormHandle({ isLoading: true, loadingButtonType: "import" });
    settingsService
      .importProducts()
      .then((result) => {
        toast.success(
          `Imported ${result.imported} products, ${result.updated} updated, ${result.errors} errors`
        );
        loadProducts();
      })
      .catch((err: unknown) => {
        toast.error((err as { message?: string })?.message || "Import failed");
      })
      .finally(() => {
        setFormHandle({ isLoading: false, loadingButtonType: "" });
      });
  }, [loadProducts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Synced from WooCommerce</p>
        </div>
        <Button
          variant="outline"
          onClick={handleImport}
          disabled={formHandle.isLoading && formHandle.loadingButtonType === "import"}
        >
          {formHandle.isLoading && formHandle.loadingButtonType === "import" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Import Products
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={category}
              onValueChange={(val) => {
                setCategory(val === "all" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={stockStatus}
              onValueChange={(val) => {
                setStockStatus(val === "all" ? "" : val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value={StockStatusEnum.IN_STOCK}>
                  In Stock
                </SelectItem>
                <SelectItem value={StockStatusEnum.LOW}>Low Stock</SelectItem>
                <SelectItem value={StockStatusEnum.OUT_OF_STOCK}>
                  Out of Stock
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner className="h-48" text="Loading products..." />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center">
              <EmptyState
                title="No products found"
                description="Import products from WooCommerce to get started."
              />
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleImport}
                disabled={formHandle.isLoading && formHandle.loadingButtonType === "import"}
              >
                {formHandle.isLoading && formHandle.loadingButtonType === "import" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Import Products
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sync</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow
                        key={product.id}
                        className={cn(
                          "cursor-pointer hover:bg-gray-50",
                          product.stockQuantity <= 0 && "bg-red-50",
                          product.stockQuantity > 0 &&
                            product.stockQuantity <= product.lowStockThreshold &&
                            "bg-amber-50"
                        )}
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <TableCell>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                              N/A
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[240px] truncate">
                            <Link
                              to={`/products/${product.id}`}
                              className="font-medium text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {product.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getProductTypeColor(product.type)}
                          >
                            {product.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.category?.name ?? "-"}
                        </TableCell>
                        <TableCell
                          className={getStockColor(
                            product.stockQuantity,
                            product.lowStockThreshold
                          )}
                        >
                          {product.stockQuantity}
                        </TableCell>
                        <TableCell>
                          {product.salePrice ? (
                            <div>
                              <span className="text-muted-foreground line-through text-xs">
                                {formatBDT(product.regularPrice)}
                              </span>
                              <br />
                              <span className="font-medium">
                                {formatBDT(product.salePrice)}
                              </span>
                            </div>
                          ) : (
                            formatBDT(product.regularPrice)
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getSyncStatusColor(product.syncStatus)}
                          >
                            {product.syncStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/products/${product.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {product.wcPermalink && (
                              <a
                                href={product.wcPermalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
                            )}
                          </div>
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
