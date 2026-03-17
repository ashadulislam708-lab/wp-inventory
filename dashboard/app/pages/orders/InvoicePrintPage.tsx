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
                maxWidth: "2.2in",
                height: "auto",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>

          {/* Invoice Metadata */}
          <div
            style={{
              borderTop: "1px dashed #000",
              borderBottom: "1px dashed #000",
              padding: "4px 0",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong>Invoice No:</strong></span>
              <span>{invoice.invoiceId}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong>Invoice Date:</strong></span>
              <span>{formatDate(invoice.date)}</span>
            </div>
            {invoice.courierName && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span><strong>Courier:</strong></span>
                <span>{invoice.courierName}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><strong>Delivery ID:</strong></span>
              <span>{invoice.deliveryId || "-"}</span>
            </div>
          </div>

          {/* Invoice To */}
          <div
            style={{
              borderBottom: "1px dashed #000",
              paddingBottom: "4px",
              marginBottom: "6px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "2px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Invoice To
            </div>
            <div>
              <strong>Name:</strong> {invoice.customerName}
            </div>
            <div>
              <strong>Phone:</strong> {invoice.customerPhone}
            </div>
            <div style={{ fontSize: "10px" }}>
              <strong>Address:</strong> {invoice.customerAddress}
            </div>
          </div>

          {/* Items Table */}
          <div
            style={{
              borderBottom: "1px dashed #000",
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
                  <th style={{ textAlign: "left", paddingBottom: "2px", width: "40%" }}>Product</th>
                  <th style={{ textAlign: "center", paddingBottom: "2px", width: "20%" }}>Color/Size</th>
                  <th style={{ textAlign: "center", paddingBottom: "2px", width: "15%" }}>Qty</th>
                  <th style={{ textAlign: "right", paddingBottom: "2px", width: "25%" }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td
                      style={{
                        textAlign: "left",
                        paddingTop: "2px",
                        maxWidth: "100px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        paddingTop: "2px",
                        maxWidth: "55px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.variation || "-"}
                    </td>
                    <td style={{ textAlign: "center", paddingTop: "2px" }}>
                      {item.quantity}
                    </td>
                    <td style={{ textAlign: "right", paddingTop: "2px" }}>
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
              borderBottom: "1px dashed #000",
              paddingBottom: "4px",
              marginBottom: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Sub Total:</span>
              <span>BDT {invoice.subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Delivery Charge:</span>
              <span>BDT {invoice.shippingFee}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                marginTop: "2px",
              }}
            >
              <span>Grand Total:</span>
              <span>BDT {invoice.grandTotal}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
              }}
            >
              <span>Due Amount:</span>
              <span>BDT {invoice.dueAmount}</span>
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
