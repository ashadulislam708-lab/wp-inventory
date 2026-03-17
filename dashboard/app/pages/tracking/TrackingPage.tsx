import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { trackingService } from "~/services/httpServices/trackingService";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import { formatDateTime } from "~/utils/formatting";
import { getOrderStatusColor } from "~/utils/badges";
import { OrderStatusEnum } from "~/enums";
import { Package, Check, Circle, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import type { TrackingData } from "~/types/tracking";

const maskName = (name: string): string => {
  const parts = name.split(" ");
  return parts
    .map((part) => {
      if (part.length <= 2) return part;
      return part.slice(0, 1) + "*".repeat(part.length - 2) + part.slice(-1);
    })
    .join(" ");
};

export default function TrackingPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualInvoiceId, setManualInvoiceId] = useState("");

  useEffect(() => {
    if (invoiceId) {
      setLoading(true);
      setError(null);
      trackingService
        .getTracking(invoiceId)
        .then(setTracking)
        .catch((err: unknown) => {
          setError(
            (err as { message?: string })?.message || "Order not found"
          );
        })
        .finally(() => setLoading(false));
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner text="Loading tracking information..." />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground">
              {error ||
                `No order found with invoice ID "${invoiceId}". Please check the ID and try again.`}
            </p>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Enter Invoice ID"
                className="flex-1"
                value={manualInvoiceId}
                onChange={(e) => setManualInvoiceId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualInvoiceId.trim()) {
                    navigate(`/tracking/${manualInvoiceId.trim()}`);
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (manualInvoiceId.trim()) {
                    navigate(`/tracking/${manualInvoiceId.trim()}`);
                  }
                }}
              >
                Track
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-[480px] shadow-md">
        {/* Branding */}
        <CardHeader className="text-center border-b pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package className="h-6 w-6 text-indigo-600" />
            <span className="text-2xl font-bold text-indigo-600">Glam Lavish</span>
          </div>
          <CardTitle className="text-lg font-medium text-muted-foreground">Order Tracking</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Order Info */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground">Invoice</p>
            <p className="text-2xl font-bold font-mono">{tracking.invoiceId}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(tracking.orderDate)}
            </p>
            <Badge
              variant="outline"
              className={cn("mt-1", getOrderStatusColor(tracking.status))}
            >
              {tracking.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-medium">{maskName(tracking.customerName)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Order Date</p>
              <p className="font-medium">{formatDateTime(tracking.orderDate)}</p>
            </div>
          </div>

          <Separator />

          {/* Status Timeline - Vertical */}
          <div className="space-y-0">
            <h3 className="text-sm font-semibold mb-4">Delivery Progress</h3>
            {tracking.statusTimeline.map((item, index) => {
              const isLast = index === tracking.statusTimeline.length - 1;
              // Find the last active index to identify the current step
              const lastActiveIndex = tracking.statusTimeline.reduce(
                (acc, curr, i) => (curr.active ? i : acc),
                -1
              );
              const isCurrentStep = item.active && index === lastActiveIndex;
              // The next step after the last active one gets the pulse ring
              const isNextStep = !item.active && index === lastActiveIndex + 1;

              return (
                <div key={item.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border-2",
                        item.active
                          ? isCurrentStep
                            ? "border-indigo-500 bg-indigo-500 text-white"
                            : "border-indigo-500 bg-indigo-500 text-white"
                          : isNextStep
                            ? "border-gray-300 text-gray-400 ring-2 ring-indigo-300 animate-pulse"
                            : "border-gray-300 text-gray-400"
                      )}
                    >
                      {item.active ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Circle className="h-2.5 w-2.5" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          "w-0.5 h-8",
                          item.active ? "bg-indigo-500" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                  <div className={cn("pb-6", isLast && "pb-0")}>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        item.active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.status}
                    </p>
                    {item.active && item.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.timestamp)}
                      </p>
                    )}
                    {item.active && item.updatedBy && (
                      <p className="text-xs text-muted-foreground/80 mt-0.5">
                        {item.updatedBy}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Courier Info */}
          {tracking.courierName && (
            <>
              <Separator />
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="text-sm font-semibold">Courier Information</h3>
                <div className="text-sm">
                  <span className="text-muted-foreground">Courier: </span>
                  <span className="font-medium">{tracking.courierName}</span>
                </div>
                {tracking.courierTrackingCode && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Tracking: </span>
                    <span className="font-medium">
                      {tracking.courierTrackingCode}
                    </span>
                  </div>
                )}
                {tracking.courierTrackingUrl && (
                  <a
                    href={tracking.courierTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Track on {tracking.courierName}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-gray-400 mt-6">Powered by Glam Lavish</p>
    </div>
  );
}
