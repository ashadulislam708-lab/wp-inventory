import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router";
import { orderService } from "~/services/httpServices/orderService";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import { formatBDT, formatDate } from "~/utils/formatting";
import { ArrowLeft, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import type { InvoiceData } from "~/types/order";

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
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
      <div className="mx-auto max-w-sm shadow-lg">
        <div
          ref={printRef}
          id="invoice-print"
          className="bg-white p-4"
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            width: "3in",
            minHeight: "4in",
            fontSize: "12px",
            lineHeight: "1.4",
            color: "#000",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              Glam Lavish
            </div>
            <div style={{ fontSize: "9px" }}>Inventory Management</div>
          </div>

          <div
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "4px 0",
              marginBottom: "6px",
            }}
          >
            <div>
              <strong>Invoice:</strong> {invoice.invoiceId}
            </div>
            <div>
              <strong>Date:</strong> {formatDate(invoice.date)}
            </div>
            {invoice.courierName && (
              <div>
                <strong>Courier:</strong> {invoice.courierName}
              </div>
            )}
            {invoice.trackingCode && (
              <div>
                <strong>Tracking:</strong> {invoice.trackingCode}
              </div>
            )}
          </div>

          {/* Customer */}
          <div style={{ marginBottom: "6px" }}>
            <div>
              <strong>To:</strong> {invoice.customerName}
            </div>
            <div>
              <strong>Ph:</strong> {invoice.customerPhone}
            </div>
            <div style={{ fontSize: "9px" }}>
              <strong>Addr:</strong> {invoice.customerAddress}
            </div>
          </div>

          {/* Items */}
          <div
            style={{
              borderTop: "1px dashed #000",
              paddingTop: "4px",
              marginBottom: "4px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Item</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td
                      style={{
                        textAlign: "left",
                        maxWidth: "120px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>
                      {item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div
            style={{
              borderTop: "1px dashed #000",
              paddingTop: "4px",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Subtotal:</span>
              <span>BDT {invoice.subtotal}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Delivery:</span>
              <span>BDT {invoice.shippingFee}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "12px",
                marginTop: "2px",
              }}
            >
              <span>Total (COD):</span>
              <span>BDT {invoice.grandTotal}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
              }}
            >
              <span>Due Amount</span>
              <span>BDT {invoice.grandTotal}</span>
            </div>
          </div>

          {/* QR Code - conditionally rendered based on toggle */}
          {showQrCode && invoice.qrCodeDataUrl && (
            <div style={{ textAlign: "center", marginTop: "6px" }}>
              <img
                src={invoice.qrCodeDataUrl}
                alt="Track Order"
                style={{ width: "80px", height: "80px", margin: "0 auto" }}
              />
              <div style={{ fontSize: "8px", marginTop: "2px" }}>
                Scan to track your order
              </div>
            </div>
          )}

          <div
            style={{
              textAlign: "center",
              fontSize: "8px",
              marginTop: "6px",
              borderTop: "1px dashed #000",
              paddingTop: "4px",
            }}
          >
            Thank you for shopping with Glam Lavish!
          </div>
        </div>
      </div>
    </div>
  );
}
