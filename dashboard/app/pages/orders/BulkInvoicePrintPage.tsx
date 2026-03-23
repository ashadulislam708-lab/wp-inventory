import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { orderService } from "~/services/httpServices/orderService";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import InvoiceTemplate from "~/components/shared/InvoiceTemplate";
import { ArrowLeft, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import type { InvoiceData } from "~/types/order";

export default function BulkInvoicePrintPage() {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);

  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedCount, setFailedCount] = useState(0);
  const [showQrCode, setShowQrCode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.allSettled(ids.map((id) => orderService.getInvoiceData(id)))
      .then((results) => {
        const successful = results
          .filter(
            (r): r is PromiseFulfilledResult<InvoiceData> =>
              r.status === "fulfilled"
          )
          .map((r) => r.value);
        setInvoices(successful);
        setFailedCount(results.length - successful.length);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoices-${invoices.length}`,
  });

  const onPrintClick = useCallback(() => {
    handlePrint();
  }, [handlePrint]);

  if (loading) {
    return (
      <LoadingSpinner
        className="h-64"
        text={`Loading ${ids.length} invoices...`}
      />
    );
  }

  if (ids.length === 0 || invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {ids.length === 0
            ? "No order IDs provided"
            : "Failed to load invoice data"}
        </p>
        <Link
          to="/orders"
          className="text-primary hover:underline mt-2 block"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls - hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            Invoices ({invoices.length})
          </h1>
          {failedCount > 0 && (
            <span className="text-sm text-destructive">
              {failedCount} failed to load
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              checked={showQrCode}
              onCheckedChange={setShowQrCode}
              size="sm"
            />
            <span className="text-sm text-muted-foreground">
              Include QR Code
            </span>
          </label>
          <Button onClick={onPrintClick}>
            <Printer className="mr-2 h-4 w-4" />
            Print All
          </Button>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: 3in 4in;
            margin: 2mm;
          }
          body * {
            visibility: hidden;
          }
          #bulk-invoice-print, #bulk-invoice-print * {
            visibility: visible;
          }
          #bulk-invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 3in;
          }
        }
      `}</style>

      {/* Invoice previews */}
      <div className="flex flex-col items-center gap-6">
        {invoices.map((invoice) => (
          <div
            key={invoice.invoiceId}
            className="shadow-lg"
            style={{ width: "3in" }}
          >
            <InvoiceTemplate invoice={invoice} showQrCode={showQrCode} />
          </div>
        ))}
      </div>

      {/* Hidden print container with page breaks */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={printRef} id="bulk-invoice-print">
          {invoices.map((invoice, idx) => (
            <InvoiceTemplate
              key={invoice.invoiceId}
              invoice={invoice}
              showQrCode={showQrCode}
              pageBreak={idx > 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
