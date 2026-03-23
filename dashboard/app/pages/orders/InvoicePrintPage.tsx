import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router";
import { orderService } from "~/services/httpServices/orderService";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import InvoiceTemplate from "~/components/shared/InvoiceTemplate";
import { ArrowLeft, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import type { InvoiceData } from "~/types/order";

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      orderService
        .getInvoiceData(id)
        .then(setInvoice)
        .catch(() => setInvoice(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice?.invoiceId ?? "Invoice",
  });

  const onPrintClick = useCallback(() => {
    handlePrint();
  }, [handlePrint]);

  if (loading) {
    return <LoadingSpinner className="h-64" text="Loading invoice..." />;
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Invoice not found</p>
        <Link to="/orders" className="text-primary hover:underline mt-2 block">
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
          <Link to={`/orders/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Invoice</h1>
        </div>
        <div className="flex items-center gap-4">
          {invoice.qrCodeDataUrl && (
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
          )}
          <Button onClick={onPrintClick}>
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
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
          #invoice-print, #invoice-print * {
            visibility: visible;
          }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 3in;
          }
        }
      `}</style>

      {/* Invoice preview */}
      <div className="mx-auto shadow-lg" style={{ width: "3in" }}>
        <div ref={printRef} id="invoice-print">
          <InvoiceTemplate invoice={invoice} showQrCode={showQrCode} />
        </div>
      </div>
    </div>
  );
}
