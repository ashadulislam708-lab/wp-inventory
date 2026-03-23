import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router";
import { orderService } from "~/services/httpServices/orderService";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import LoadingSpinner from "~/components/atoms/LoadingSpinner";
import { formatDate } from "~/utils/formatting";
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
        <div
          ref={printRef}
          id="invoice-print"
          className="bg-white"
          style={{
            fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
            width: "3in",
            minHeight: "4in",
            fontSize: "11px",
            lineHeight: "1.3",
            color: "#000",
            padding: "6px",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            <img
              src="/logo.png"
              alt="Glam Lavish"
              style={{
                maxWidth: "1.6in",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
            <div style={{ fontSize: "8px", marginTop: "2px", color: "#000" }}>
              www.glamlavish.com | 09678-770181
            </div>
          </div>

          {/* Invoice Metadata */}
          <div
            style={{
              borderBottom: "1px dashed #ccc",
              padding: "4px 0",
              marginBottom: "6px",
            }}
          >
            <div>
              <span style={{ fontWeight: "normal" }}>Invoice No:</span> {invoice.invoiceId}
            </div>
            <div>
              <span style={{ fontWeight: "normal" }}>Invoice Date:</span> {formatDate(invoice.date)}
            </div>
            {invoice.courierName && (
              <div>
                <span style={{ fontWeight: "normal" }}>Courier:</span> {invoice.courierName}
              </div>
            )}
            <div>
              <span style={{ fontWeight: "normal" }}>Delivery ID:</span> {invoice.deliveryId || "-"}
            </div>
          </div>

          {/* Invoice To */}
          <div
            style={{
              paddingBottom: "4px",
              marginBottom: "6px",
            }}
          >
            <div style={{ fontWeight: "normal", marginBottom: "2px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Invoice To
            </div>
            <div>
              <span style={{ fontWeight: "normal" }}>Name:</span> {invoice.customerName}
            </div>
            <div>
              <span style={{ fontWeight: "normal" }}>Phone:</span> {invoice.customerPhone}
            </div>
            <div style={{ fontSize: "10px" }}>
              <span style={{ fontWeight: "normal" }}>Address:</span> {invoice.customerAddress}
            </div>
          </div>

          {/* Items Table */}
          <div
            style={{
              borderTop: "1px solid #000",
              paddingBottom: "4px",
              marginBottom: "6px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "10px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #000" }}>
                  <th style={{ textAlign: "left", paddingBottom: "2px", paddingTop: "2px", width: "35%", fontWeight: "normal" }}>Product</th>
                  <th style={{ textAlign: "center", paddingBottom: "2px", paddingTop: "2px", width: "18%", fontWeight: "normal" }}>Color/Size</th>
                  <th style={{ textAlign: "center", paddingBottom: "2px", paddingTop: "2px", width: "12%", fontWeight: "normal" }}>Qty</th>
                  <th style={{ textAlign: "center", paddingBottom: "2px", paddingTop: "2px", width: "15%", fontWeight: "normal" }}>Price</th>
                  <th style={{ textAlign: "right", paddingBottom: "2px", paddingTop: "2px", width: "20%", fontWeight: "normal" }}>Item Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < invoice.items.length - 1 ? "1px dashed #ddd" : "none" }}>
                    <td
                      style={{
                        textAlign: "left",
                        padding: "2px 0",
                        maxWidth: "100px",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.name}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "2px 0",
                        maxWidth: "55px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.variation || "-"}
                    </td>
                    <td style={{ textAlign: "center", padding: "2px 0" }}>
                      {item.quantity}
                    </td>
                    <td style={{ textAlign: "center", padding: "2px 0" }}>
                      {item.price}
                    </td>
                    <td style={{ textAlign: "right", padding: "2px 0" }}>
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
              borderBottom: showQrCode && invoice.qrCodeDataUrl ? "1px dashed #000" : "none",
              paddingBottom: "4px",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Discount:</span>
              <span>{invoice.discountAmount ?? 0} TK</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Sub Total:</span>
              <span>{invoice.subtotal} TK</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Delivery Charge:</span>
              <span>{invoice.shippingFee} TK</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "2px",
              }}
            >
              <span>Grand Total:</span>
              <span>{invoice.grandTotal} TK</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Advance Payment:</span>
              <span>{invoice.advanceAmount ?? 0} TK</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Due Amount:</span>
              <span>{invoice.dueAmount} TK</span>
            </div>
          </div>

          {/* QR Code */}
          {showQrCode && invoice.qrCodeDataUrl && (
            <div style={{ textAlign: "center", marginBottom: "4px" }}>
              <img
                src={invoice.qrCodeDataUrl}
                alt="Track Order"
                style={{ width: "60px", height: "60px", margin: "0 auto" }}
              />
              <div style={{ fontSize: "8px", marginTop: "2px" }}>
                Scan to track your order
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              fontSize: "8px",
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
