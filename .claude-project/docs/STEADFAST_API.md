# Steadfast Courier API Reference

**Source:** [Official Documentation](https://docs.google.com/document/d/e/2PACX-1vTi0sTyR353xu1AK0nR8E_WKe5onCkUXGEf8ch8uoJy9qxGfgGnboSIkNosjQ0OOdXkJhgGuAsWxnIh/pub)
**Last Updated:** 2026-03-15

---

## Base URL

```
https://portal.packzy.com/api/v1
```

> **Note:** The PRD references `portal.steadfast.com.bd` but official docs now use `portal.packzy.com`.

---

## Authentication

All requests require these headers:

| Header | Type | Description |
|--------|------|-------------|
| `Api-Key` | string | Provided by Steadfast Courier Ltd. |
| `Secret-Key` | string | Provided by Steadfast Courier Ltd. |
| `Content-Type` | string | `application/json` |

---

## Endpoints

### 1. Create Order

| | |
|---|---|
| **Method** | POST |
| **Path** | `/create_order` |
| **Used by Glam Lavish** | Yes — auto-push on order creation |

**Request Body:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `invoice` | string | Yes | Unique, alphanumeric with hyphens/underscores | `"GL-0001"` |
| `recipient_name` | string | Yes | Max 100 characters | `"John Smith"` |
| `recipient_phone` | string | Yes | 11-digit Bangladesh format | `"01234567890"` |
| `alternative_phone` | string | No | 11-digit format | |
| `recipient_email` | string | No | | |
| `recipient_address` | string | Yes | Max 250 characters | `"House# 17/1, Road# 3/A, Dhanmondi, Dhaka-1209"` |
| `cod_amount` | numeric | Yes | BDT, minimum 0 | `1060` |
| `note` | string | No | Delivery instructions | `"Deliver within 3 PM"` |
| `item_description` | string | No | Item details | |
| `total_lot` | numeric | No | Total lot count | |
| `delivery_type` | numeric | No | 0 = home delivery, 1 = point delivery | `0` |

**Response (200):**

```json
{
  "status": 200,
  "message": "Consignment has been created successfully.",
  "consignment": {
    "consignment_id": 1424107,
    "invoice": "GL-0001",
    "tracking_code": "15BAEB8A",
    "recipient_name": "John Smith",
    "recipient_phone": "01234567890",
    "recipient_address": "House# 17/1, Road# 3/A, Dhanmondi, Dhaka-1209",
    "cod_amount": 1060,
    "status": "in_review",
    "note": "Deliver within 3PM",
    "created_at": "2021-03-21T07:05:31.000000Z",
    "updated_at": "2021-03-21T07:05:31.000000Z"
  }
}
```

**Mapping to Glam Lavish Order fields:**
- `consignment.consignment_id` → `Order.courierConsignmentId`
- `consignment.tracking_code` → `Order.courierTrackingCode`

---

### 2. Bulk Order Create

| | |
|---|---|
| **Method** | POST |
| **Path** | `/create_order/bulk-order` |
| **Used by Glam Lavish** | No (future consideration) |

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `data` | JSON array | Yes | Array of order objects (max 500 items) |

Each item in the array uses the same fields as the single create order endpoint.

**Response:** Array of order objects, each with a `status` field (`"success"` or `"error"`).

---

### 3. Check Delivery Status

Three variants available — all return the same response format.

| Variant | Method | Path | Used by Glam Lavish |
|---------|--------|------|---------------------|
| By Consignment ID | GET | `/status_by_cid/{consignment_id}` | Yes — for status checks |
| By Invoice ID | GET | `/status_by_invoice/{invoice}` | Alternative option |
| By Tracking Code | GET | `/status_by_trackingcode/{tracking_code}` | Alternative option |

**Response (200):**

```json
{
  "status": 200,
  "delivery_status": "in_review"
}
```

---

### 4. Check Current Balance

| | |
|---|---|
| **Method** | GET |
| **Path** | `/get_balance` |
| **Used by Glam Lavish** | No (future dashboard widget) |

**Response (200):**

```json
{
  "status": 200,
  "current_balance": 0
}
```

---

### 5. Create Return Request

| | |
|---|---|
| **Method** | POST |
| **Path** | `/create_return_request` |
| **Used by Glam Lavish** | Potentially — see note below |

> **Note:** The PRD references a cancel endpoint (`POST /cancel_order/{consignment_id}`) that is NOT in the official documentation. This return request endpoint may be the replacement. During implementation, test both approaches.

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `consignment_id` OR `invoice` OR `tracking_code` | numeric/string | Yes (one of) | Identifier for the consignment |
| `reason` | string | No | Reason for return |

**Response (200):**

```json
{
  "id": 1,
  "user_id": 1,
  "consignment_id": 10000042,
  "reason": null,
  "status": "pending",
  "created_at": "2025-07-30T23:11:45.000000Z",
  "updated_at": "2025-07-30T23:11:45.000000Z"
}
```

**Return Request Statuses:** `pending`, `approved`, `processing`, `completed`, `cancelled`

---

### 6. Get Single Return Request

| | |
|---|---|
| **Method** | GET |
| **Path** | `/get_return_request/{id}` |

---

### 7. Get Return Requests (List)

| | |
|---|---|
| **Method** | GET |
| **Path** | `/get_return_requests` |

---

### 8. Get Payments

| | |
|---|---|
| **Method** | GET |
| **Path** | `/payments` |
| **Used by Glam Lavish** | No (future consideration) |

---

### 9. Get Single Payment with Consignments

| | |
|---|---|
| **Method** | GET |
| **Path** | `/payments/{payment_id}` |

---

### 10. Get Police Stations

| | |
|---|---|
| **Method** | GET |
| **Path** | `/police_stations` |

---

## Delivery Status Values

| Status | Description | Maps to Glam Lavish |
|--------|-------------|---------------------|
| `in_review` | Awaiting review (initial state after creation) | PENDING |
| `pending` | Not delivered/cancelled yet | PENDING / PROCESSING |
| `hold` | Consignment is held | PROCESSING |
| `delivered_approval_pending` | Delivered, awaiting approval | SHIPPED |
| `partial_delivered_approval_pending` | Partially delivered, awaiting approval | SHIPPED |
| `cancelled_approval_pending` | Cancelled, awaiting approval | CANCELLED |
| `unknown_approval_pending` | Unknown status, awaiting approval | — |
| `delivered` | Delivered, balance added to account | DELIVERED |
| `partial_delivered` | Partially delivered, balance added | DELIVERED |
| `cancelled` | Cancelled, balance updated | CANCELLED |
| `unknown` | Unknown status | — |

> **Note:** Glam Lavish does not auto-poll these statuses. Staff manually updates order status from the order detail page. The status check endpoints above can be used for the "Retry Courier" feature or future status polling if needed.

---

## Constraints & Limits

| Constraint | Value |
|------------|-------|
| Bulk order max items | 500 per request |
| Phone number format | 11 digits |
| Invoice format | Alphanumeric + hyphens/underscores, must be unique |
| Recipient name max length | 100 characters |
| Recipient address max length | 250 characters |
| COD amount minimum | 0 BDT |

---

## PRD Discrepancies

| Item | PRD Says | Official Docs Say | Action |
|------|----------|-------------------|--------|
| Base URL | `portal.steadfast.com.bd` | `portal.packzy.com` | Use `packzy.com` |
| Cancel endpoint | `POST /cancel_order/{id}` | Not listed (has return request instead) | Test cancel during implementation; fallback to return request |
| Status polling | 15-min cron (early PRD) / Manual (revised PRD) | N/A | Manual — no auto-polling (per revised PRD) |
| Delivery statuses | Not detailed | 11 granular statuses | Map to Glam Lavish statuses as shown above |
