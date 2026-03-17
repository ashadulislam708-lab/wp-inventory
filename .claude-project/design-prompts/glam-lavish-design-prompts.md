---
project_name: "Glam Lavish"
total_pages: 10
design_system:
  type: "Web Application (Desktop-first, Responsive)"
  style: "Modern Admin Dashboard, Clean, Professional"
  industry: "E-commerce Inventory Management"
  primary_color: "#4f46e5"
  secondary_color: "#7c3aed"
  font: "Inter"
  icons: "Lucide Icons"
---

# Glam Lavish - AURA.build Design Prompts

## Design System

Glam Lavish - Web Application (Desktop-first, Responsive) for E-commerce Inventory Management.
Style: Modern Admin Dashboard, Clean, Professional with #4f46e5 (Indigo) primary and #7c3aed (Violet) secondary colors.

**Colors:**
- Primary: #4f46e5 (Indigo 600)
- Secondary: #7c3aed (Violet 600)
- Success: #22c55e (Green 500)
- Warning: #f59e0b (Amber 500)
- Error: #ef4444 (Red 500)
- Background: #f9fafb (Gray 50)
- Surface: #ffffff (White)
- Text Primary: #111827 (Gray 900)
- Text Secondary: #6b7280 (Gray 500)
- Border: #e5e7eb (Gray 200)

**Typography:**
- Font Family: Inter
- Monospace: JetBrains Mono

**Styling:**
- Card Radius: 12px
- Button Radius: 8px
- Input Radius: 6px
- Shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
- Transition: 150ms ease
- Icons: Lucide Icons (outlined style)

---

## Page: 01-login
name: Login Page
category: auth

### SCREEN OVERVIEW
Login page for the Glam Lavish Inventory Management System. This is the single entry point for Admin and Staff users. There is no sign-up page — only admins can create accounts. No forgot password flow — admin resets passwords via Settings.

Purpose:
- Authenticate Admin and Staff users via email and password
- Provide clear branding for the Glam Lavish inventory system
- Redirect authenticated users to the Dashboard

### LAYOUT INSTRUCTIONS

**OVERALL LAYOUT:**
- Split screen: 55% branding panel (left), 45% login form (right)
- Branding panel: Indigo-to-violet gradient background
- Form panel: White background, vertically centered content

**BRANDING PANEL (Left 55%):**
- Background: Linear gradient from #4f46e5 (top-left) to #7c3aed (bottom-right)
- Content centered vertically and horizontally
- Logo: "Glam Lavish" text in white, 36px, font-weight 700
- Subtitle: "Inventory Management System" in white/80% opacity, 16px
- Abstract illustration: Inventory/logistics themed — boxes, charts, shipping icons
- Decorative: Subtle dot grid overlay at 5% opacity

**FORM PANEL (Right 45%):**
- Content centered vertically, max-width 380px, padding 48px
- Header: "Welcome back" (24px, bold, gray-900)
- Subtitle: "Sign in to your account" (14px, gray-500)
- Gap between header and form: 32px

**FORM FIELDS (20px vertical gap):**
- Email Input: Label "Email address", 44px height, mail icon left, placeholder "admin@glamlavish.com"
- Password Input: Label "Password", 44px height, lock icon left, eye toggle right
- Submit Button: "Sign In" (full-width, 44px height, indigo-600 bg, white text, font-weight 600)
- Loading state: Spinner icon replaces text

**FOOTER:**
- Small text at bottom: "Glam Lavish Inventory v1.0" in gray-400, 12px
- No "Sign Up" or "Forgot Password" links

### KEY FEATURES
- Real-time email format validation
- Password visibility toggle (eye icon)
- Loading spinner on submit button during auth request
- Error state: red border on invalid fields, error message below form
- Auto-focus on email field on page load
- Mobile: Branding panel hidden, form full-width with indigo header bar

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| Submit Login | Click "Sign In" or press Enter | Validate fields, send POST /api/auth/login, show loading state |
| Login Success | Valid credentials | Store JWT tokens, redirect to Dashboard (/) |
| Login Failed | Invalid credentials | Show error toast "Invalid email or password", clear password field |
| Toggle Password | Click eye icon | Show/hide password text |

### BRANDING ELEMENTS
- Indigo-to-violet gradient on branding panel
- Clean, minimal form design
- Professional tone — no playful elements
- Trust: Lock icon in password field
- Focus states use indigo-600 ring

---

## Page: 02-dashboard
name: Dashboard
category: admin

### SCREEN OVERVIEW
The main dashboard for Glam Lavish inventory management. Displays key business metrics at a glance with stat cards and alert widgets. This is the landing page after login for both Admin and Staff users. Serves as the primary notification mechanism — no email or push notifications.

Purpose:
- Show today's key metrics (orders, revenue, pending orders)
- Surface alerts for low stock, failed courier pushes, and sync errors
- Provide quick access to recent orders
- Give staff a reason to check the dashboard regularly

### LAYOUT INSTRUCTIONS

**SIDEBAR NAVIGATION (left, 256px width, fixed):**
- Background: white, right border gray-200
- Top: "Glam Lavish" logo/text (indigo-600, 20px, bold), with small "IMS" tag
- Nav items (vertical, 12px gap): Dashboard (active), Products, Orders, Settings (admin only)
- Each nav item: icon (20px) + label (14px), 44px height, rounded-lg
- Active state: indigo-50 bg, indigo-600 text+icon
- Hover state: gray-50 bg
- Bottom: User avatar circle (32px) + name + role badge (ADMIN/STAFF) + logout icon

**TOP BAR (right of sidebar, full width):**
- Height: 64px, white bg, bottom border gray-200
- Left: Page title "Dashboard" (20px, bold)
- Right: Notification bell icon + user avatar dropdown

**STAT CARDS ROW (4 cards, equal width, 16px gap):**
- Card 1: "Orders Today" — large number (32px, bold), Package icon (indigo-100 bg circle), subtle up/down trend arrow
- Card 2: "Revenue Today" — BDT amount formatted with commas, BanknoteIcon (green-100 bg circle)
- Card 3: "Pending Orders" — count with amber badge, Clock icon (amber-100 bg circle)
- Card 4: "Low Stock Items" — count with red badge if > 0, AlertTriangle icon (red-100 bg circle)
- Each card: white bg, rounded-xl, shadow-sm, padding 24px, border gray-100

**ALERT WIDGETS ROW (2 cards, equal width, 16px gap):**
- Card 1: "Failed Courier Pushes" — Red accent left border (4px), count of failed pushes, "View Orders" link. Shows if courierConsignmentId = null. Empty state: green check "All orders dispatched"
- Card 2: "Sync Errors" — Amber accent left border, count of recent WC sync failures, last error timestamp, "View Sync Logs" link. Empty state: green check "Sync healthy"

**RECENT ORDERS TABLE (full width below alerts):**
- Card with header "Recent Orders" (16px, bold) + "View All" link (indigo-600)
- Table columns: Invoice ID, Customer, Items, Total (BDT), Status, Source, Date
- 10 rows max
- Status badges: colored pills (green=DELIVERED, amber=PENDING, blue=PROCESSING, red=CANCELLED, gray=RETURNED)
- Source badges: "Manual" (indigo outline), "WooCommerce" (purple outline)
- Row hover: gray-50 bg
- Click row → navigate to order detail

### KEY FEATURES
- Auto-refresh stats every 60 seconds
- Alert cards pulse animation when count > 0
- Responsive: Cards stack to 2-column on tablet, 1-column on mobile
- Sidebar collapses to icon-only on tablet
- All monetary values formatted as BDT with comma separators
- All dates in BST (UTC+6)

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| View All Orders | Click "View All" link | Navigate to /orders |
| View Order Detail | Click table row | Navigate to /orders/:id |
| View Failed Couriers | Click "View Orders" in alert | Navigate to /orders?courierStatus=failed |
| View Sync Logs | Click "View Sync Logs" | Navigate to /settings (sync log section) |
| Logout | Click logout icon | POST /api/auth/logout, redirect to /login |

### BRANDING ELEMENTS
- Indigo accent for active nav and primary actions
- Clean card-based layout with consistent shadows
- Status colors consistent across all pages
- Professional data presentation

---

## Page: 03-product-list
name: Product List
category: admin

### SCREEN OVERVIEW
Paginated product listing page showing all products synced from WooCommerce. Products are read-only (content managed in WooCommerce). Staff can view stock levels and identify low-stock items. 25 items per page with traditional pagination.

Purpose:
- Browse all imported products with search and filters
- Identify low-stock and out-of-stock products at a glance
- Navigate to product detail for stock management
- Provide "Edit in WooCommerce" quick link

### LAYOUT INSTRUCTIONS

**SIDEBAR:** Same as Dashboard (Products nav item active)

**PAGE HEADER:**
- Title: "Products" (20px, bold)
- Subtitle: "Synced from WooCommerce" (14px, gray-500)
- Right: "Import Products" button (indigo-600, outlined) — triggers WC product import

**FILTERS BAR (below header, 16px gap):**
- Search input: "Search products..." with magnifying glass icon, 360px width
- Category dropdown: "All Categories" default, populated from /api/categories
- Stock status dropdown: "All Stock" / "In Stock" / "Low Stock" / "Out of Stock"
- Layout: Horizontal row, 12px gap between filters

**PRODUCT TABLE:**
- Columns: Image (48px thumbnail), Product Name, SKU, Type (SIMPLE/VARIABLE badge), Category, Stock, Price (BDT), Sync Status, Actions
- Image: Rounded-md, 48x48px, gray-100 placeholder if no image
- Product Name: 14px, font-weight 500, truncate at 40 chars
- Type badge: "Simple" (gray pill), "Variable" (violet pill)
- Stock column: Number with color coding — green (>threshold), amber (<=threshold, >0), red (0)
- Low stock indicator: Small amber dot next to number when stock <= threshold
- Price: Regular price, strikethrough if sale price exists, sale price in red
- Sync Status: Green dot "Synced", amber dot "Pending", red dot "Error"
- Actions: "View" button (ghost), "Edit in WC" icon link (external link icon)
- Row hover: gray-50 bg, cursor pointer
- Click row → navigate to product detail

**PAGINATION (below table):**
- "Showing 1-25 of 150 products" text (left)
- Page buttons: Previous, 1, 2, 3, ..., 6, Next (right)
- Active page: indigo-600 bg, white text
- 25 items per page

**EMPTY STATE (no products):**
- Centered illustration: Empty box
- "No products imported yet"
- "Import products from WooCommerce to get started"
- "Import Products" button (indigo-600)

### KEY FEATURES
- Debounced search (300ms delay)
- URL-persisted filters (query params)
- Low stock items highlighted with amber background tint
- Out of stock items highlighted with red background tint
- Responsive: Table scrolls horizontally on mobile
- Loading skeleton while fetching

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| Search Products | Type in search input | Debounce 300ms, filter products by name/SKU |
| Filter by Category | Select from dropdown | Re-fetch with category filter |
| Filter by Stock | Select from dropdown | Re-fetch with stock status filter |
| View Product | Click row or "View" button | Navigate to /products/:id |
| Edit in WooCommerce | Click external link icon | Open WC admin edit page in new tab |
| Import Products | Click "Import Products" | POST /api/woocommerce/import/products, show progress |
| Change Page | Click pagination button | Fetch page N with current filters |

### BRANDING ELEMENTS
- Consistent table styling with subtle borders
- Status colors: green/amber/red for stock levels
- Clean filter bar above table
- Professional data density — enough info without clutter

---

## Page: 04-product-detail
name: Product Detail
category: admin

### SCREEN OVERVIEW
Detailed view of a single product showing all WooCommerce-synced content (read-only) alongside the stock management form (editable). For variable products, shows all variations with their dynamic attributes. Includes stock adjustment history.

Purpose:
- View complete product information synced from WooCommerce
- Adjust stock quantities with audit trail
- View stock change history for accountability
- Quick link to edit product in WooCommerce

### LAYOUT INSTRUCTIONS

**SIDEBAR:** Same as Dashboard (Products nav item active)

**BREADCRUMB:** Products > Product Name (14px, gray-500, indigo links)

**PRODUCT HEADER CARD (white bg, rounded-xl, shadow-sm):**
- Left section (70%):
  - Product image: 200x200px, rounded-lg, gray-100 border
  - Product name: 24px, bold
  - SKU: "SKU: GL-PROD-001" (14px, gray-500, monospace)
  - Type badge: "Simple Product" or "Variable Product" (pill badge)
  - Category: Category name with folder icon
  - Sync status badge: green/amber/red dot with label
- Right section (30%):
  - "Edit in WooCommerce" button (outlined, external link icon) — opens WC admin
  - Price display: Regular price (if no sale), or strikethrough regular + red sale price
  - Stock quantity: Large number (32px, bold), color-coded (green/amber/red)
  - Low stock threshold: "Alert below: 5" (12px, gray-400)

**DESCRIPTION SECTION (collapsible):**
- "Description" header with chevron toggle
- Short description rendered as HTML (14px, gray-700)
- Full description expandable

**VARIATIONS TABLE (variable products only):**
- Card with header "Variations ({count})"
- Table columns: Attributes (dynamic — rendered as "Color: Red, Size: XL"), SKU, Price (BDT), Stock, Image (32px thumb), Actions
- Attributes column: Key-value pairs rendered as small badges/tags
- Stock: Editable inline — click number to open quick edit popover
- Actions: "Adjust Stock" button per variation

**STOCK ADJUSTMENT FORM (right sidebar or modal):**
- Card with header "Adjust Stock"
- Current stock display (large number)
- Adjustment type: "Set to" / "Add" / "Subtract" radio buttons
- Quantity input: Number input, min 0
- Reason dropdown: "Physical Count", "Return", "Damage", "Restock", "Other"
- Note field: Optional text area
- "Update Stock" button (indigo-600)
- Warning if resulting stock would be 0: amber banner

**STOCK HISTORY TABLE (below):**
- Card with header "Stock History"
- Table columns: Date (BST), Previous Qty, New Qty, Change (+/-), Reason, Adjusted By
- Change column: Green "+5", Red "-3"
- Paginated, 10 per page
- Most recent first

### KEY FEATURES
- Dynamic attribute rendering for any WooCommerce attribute type
- Inline stock editing on variations table
- Stock adjustment auto-pushes to WooCommerce
- Stock history shows complete audit trail
- All WC-sourced fields are visually marked as read-only (gray background tint, lock icon)
- Confirmation dialog before stock adjustment

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| Edit in WooCommerce | Click button | Open {WC_URL}/wp-admin/post.php?post={wcId}&action=edit in new tab |
| Adjust Product Stock | Submit stock form | PATCH /api/products/:id/stock, update display, sync to WC |
| Adjust Variation Stock | Click "Adjust Stock" on variation | Open modal/popover, PATCH /api/products/variations/:id/stock |
| View Stock History | Scroll to bottom | Loads GET /api/products/:id/stock-history |
| Navigate Back | Click breadcrumb | Navigate to /products |

### BRANDING ELEMENTS
- Read-only fields have subtle gray-50 background with lock icon
- Editable stock section has white background with indigo accent border
- Clear visual separation between WC-sourced and locally-managed data
- Stock color coding consistent with product list

---

## Page: 05-order-list
name: Order List
category: admin

### SCREEN OVERVIEW
Paginated order listing page showing all orders from both manual creation and WooCommerce. Supports filtering by status, source, and date range. Includes CSV export for filtered results. 25 items per page with traditional pagination.

Purpose:
- Browse all orders with powerful filtering
- Quickly identify order status and source
- Export filtered orders as CSV for reporting
- Navigate to order details for management

### LAYOUT INSTRUCTIONS

**SIDEBAR:** Same as Dashboard (Orders nav item active)

**PAGE HEADER:**
- Title: "Orders" (20px, bold)
- Right: "New Order" button (indigo-600, solid) with Plus icon + "Export CSV" button (outlined) with Download icon

**FILTERS BAR (below header):**
- Status dropdown: "All Statuses" / PENDING / CONFIRMED / PROCESSING / SHIPPED / DELIVERED / CANCELLED / RETURNED
- Source dropdown: "All Sources" / Manual / WooCommerce
- Date range picker: Start date — End date (calendar popover)
- Search input: "Search by invoice ID, customer name, or phone..." (400px width)
- Layout: Horizontal row, 12px gap, wraps on mobile

**ORDERS TABLE:**
- Columns: Invoice ID, Customer Name, Phone, Items (count), Total (BDT), Status, Source, Courier Status, Date
- Invoice ID: Monospace font, "GL-0042" format, font-weight 500
- Status column: Colored pill badges
  - PENDING: amber-100 bg, amber-800 text
  - CONFIRMED: blue-100 bg, blue-800 text
  - PROCESSING: indigo-100 bg, indigo-800 text
  - SHIPPED: cyan-100 bg, cyan-800 text
  - DELIVERED: green-100 bg, green-800 text
  - CANCELLED: red-100 bg, red-800 text
  - RETURNED: gray-100 bg, gray-800 text
- Source: "Manual" (indigo outline pill), "WooCommerce" (purple outline pill)
- Courier Status: Green check if consignment exists, red "!" if failed (no consignment ID)
- Date: BST formatted, "12 Mar 2026, 2:30 PM"
- Row hover: gray-50, cursor pointer
- Click row → navigate to order detail

**PAGINATION:** Same pattern as product list, 25 per page

**EMPTY STATE:**
- "No orders found"
- If filters active: "Try adjusting your filters"
- If no filters: "Create your first order" + "New Order" button

### KEY FEATURES
- Date range picker with preset options (Today, Last 7 days, Last 30 days, Custom)
- CSV export respects current filters
- Failed courier push orders highlighted with subtle red left border
- URL-persisted filters for bookmarkable views
- Responsive: Key columns only on mobile (Invoice, Customer, Status, Total)

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| Create New Order | Click "New Order" | Navigate to /orders/new |
| Export CSV | Click "Export CSV" | GET /api/orders/export with current filters, download file |
| Filter by Status | Select status | Re-fetch with status filter |
| Filter by Source | Select source | Re-fetch with source filter |
| Filter by Date | Select date range | Re-fetch with startDate/endDate |
| Search | Type in search | Debounce 300ms, search by invoiceId/name/phone |
| View Order | Click row | Navigate to /orders/:id |
| Change Page | Click pagination | Fetch page N |

### BRANDING ELEMENTS
- Status badge colors are consistent and distinct
- Failed courier indicator is prominent but not overwhelming
- Clean table with good data density
- Export button uses outline style to not compete with "New Order" CTA

---

## Page: 06-order-form
name: Create Order
category: admin

### SCREEN OVERVIEW
The main order generator form. Staff selects products, enters customer details, and submits the order. On submission, the system generates an invoice ID (GL-XXXX), decrements stock, auto-pushes to Steadfast courier, generates a QR code, and syncs stock to WooCommerce. Real-time stock validation prevents orders with insufficient stock.

Purpose:
- Create new orders with product line items
- Enter customer delivery information
- Calculate shipping fees based on zone
- Validate stock availability in real-time
- Auto-dispatch to Steadfast courier on submit

### LAYOUT INSTRUCTIONS

**SIDEBAR:** Same as Dashboard (Orders nav item active)

**PAGE HEADER:**
- Breadcrumb: Orders > New Order
- Title: "Create New Order" (20px, bold)

**TWO-COLUMN LAYOUT (60% left, 40% right, 24px gap):**

**LEFT COLUMN — Product Selection:**

- Card 1: "Order Items"
  - Product search input: "Search products by name or SKU..." with autocomplete dropdown
  - Search results dropdown: Shows product name, SKU, price, available stock. Variable products show variation selector
  - For variable products: After selecting product, show variation dropdown with attributes (e.g., "Red - XL")
  - Added items table:
    - Columns: Product (name + variation attributes), Unit Price, Qty (number input, min 1), Total, Remove (X icon)
    - Quantity input: Live validation against available stock. Red border + "Only X available" if exceeded
    - Remove button: Red X icon, removes line item
  - "Add Product" section always visible below items
  - Subtotal displayed at bottom of card: "Subtotal: BDT 2,998.00" (16px, bold)

**RIGHT COLUMN — Customer & Shipping:**

- Card 2: "Customer Information"
  - Customer Name input: Required, placeholder "Full name"
  - Phone input: Required, placeholder "01XXXXXXXXX", Bangladesh format validation
  - Address textarea: Required, placeholder "Full delivery address", 3 rows

- Card 3: "Shipping"
  - Shipping Partner: Radio buttons — "Steadfast" (selected default), "Pathao" (disabled, "Coming Soon" tag)
  - Shipping Zone: Radio buttons — "Inside Dhaka (BDT 80)", "Dhaka Sub Area (BDT 100)", "Outside Dhaka (BDT 150)"
  - Shipping fee displayed after selection

- Card 4: "Order Summary" (sticky on scroll)
  - Subtotal: BDT X,XXX.00
  - Shipping Fee: BDT XX.00
  - Divider line
  - Grand Total: BDT X,XXX.00 (20px, bold, indigo-600)
  - "Due Amount: BDT X,XXX.00" (same as grand total — full COD)
  - "Create Order" button (full-width, indigo-600, 48px height, font-weight 600)
  - Small text: "Order will be automatically sent to Steadfast courier"

### KEY FEATURES
- Product search with autocomplete (debounced 300ms)
- Variable product variation selector with dynamic attributes
- Real-time stock validation — blocks submit if any item exceeds available stock
- Auto-calculation of subtotal, shipping fee, grand total
- Order summary card is sticky on scroll
- Form validation: All customer fields required, phone format validated
- Submit shows loading state with progress steps: "Creating order... Pushing to courier... Generating QR code..."
- On success: Redirect to order detail page with success toast

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| Search Products | Type in search | Autocomplete dropdown with matching products |
| Add Product | Select from dropdown | Add line item to order items table |
| Select Variation | Choose from variation dropdown | Set specific variation with attributes |
| Change Quantity | Edit qty input | Validate against stock, recalculate totals |
| Remove Item | Click X icon | Remove line item, recalculate totals |
| Select Shipping Zone | Click radio button | Update shipping fee and grand total |
| Create Order | Click "Create Order" | Validate all, POST /api/orders, show progress, redirect on success |
| Cancel | Click browser back | Confirm if form has data, navigate to /orders |

### BRANDING ELEMENTS
- Clean card-based form sections
- Indigo CTA button prominent at bottom
- Real-time validation feedback in red
- Summary card has subtle indigo-50 background
- Professional, form-heavy layout optimized for speed

---

## Page: 07-order-detail
name: Order Detail
category: admin

### SCREEN OVERVIEW
Complete order detail view with order info, line items, customer details, courier info, and status management. Orders in PENDING or CONFIRMED status can be edited. Staff can update order status, retry failed courier pushes, print invoices, and view QR codes. Also serves as the order edit page.

Purpose:
- View complete order information
- Edit order details (only in PENDING/CONFIRMED status)
- Update order status through the workflow
- Manage courier integration (retry, cancel)
- Access invoice printing and QR code

### LAYOUT INSTRUCTIONS

**SIDEBAR:** Same as Dashboard (Orders nav item active)

**PAGE HEADER:**
- Breadcrumb: Orders > GL-0042
- Left: Invoice ID "GL-0042" (24px, bold, monospace) + Status badge (large, colored pill)
- Right actions row:
  - "Print Invoice" button (outlined, Printer icon)
  - "Edit Order" button (outlined, Edit icon) — only visible if PENDING/CONFIRMED
  - Status update dropdown: "Update Status" with allowed transitions

**STATUS TIMELINE (horizontal, below header):**
- Steps: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- Completed steps: Indigo filled circles with checkmarks, indigo connecting line
- Current step: Indigo filled circle, pulsing ring
- Future steps: Gray outlined circles, gray connecting line
- CANCELLED/RETURNED: Shows as red/gray badge breaking the timeline

**THREE-COLUMN LAYOUT (40% / 30% / 30%):**

**Column 1 — Order Items:**
- Card: "Order Items ({count})"
- Table: Product (name + variation attributes), Unit Price, Qty, Total
- Bottom: Subtotal, Shipping Fee, Grand Total (bold), Due Amount

**Column 2 — Customer Information:**
- Card: "Customer Details"
- Name: with User icon
- Phone: with Phone icon, clickable to dial
- Address: with MapPin icon, full address displayed
- If editable: Show edit icons next to each field

**Column 3 — Courier & Tracking:**
- Card: "Courier Information"
- Courier: "Steadfast" with truck icon
- Consignment ID: monospace text, or "Failed — " with red "Retry" button if null
- Tracking Code: monospace text
- QR Code: 120x120px QR image, "Download QR" link below
- "Track on Steadfast" link (external, if consignment exists)

**ORDER METADATA (bottom full-width card):**
- Two-column grid:
  - Source: "Manual" or "WooCommerce" badge
  - WC Order ID: if from WooCommerce
  - Created: Date in BST
  - Last Updated: Date in BST
  - Created By: User name

**EDIT MODE (activated by "Edit Order" button):**
- Same layout but customer fields become editable inputs
- Order items become editable (add/remove/change qty)
- Shipping zone becomes radio buttons
- "Save Changes" and "Cancel Edit" buttons replace header actions
- Warning banner: "Editing will cancel the current courier consignment and create a new one"

### KEY FEATURES
- Status update with confirmation dialog showing effects (e.g., "Cancelling will restore stock and cancel courier consignment")
- Retry courier button for failed pushes
- QR code display and download
- Invoice print opens print-optimized page
- Edit mode with full validation
- Locked fields when order is PROCESSING or beyond (gray background, no edit button)
- Status transition validation (only allowed transitions shown in dropdown)

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| Print Invoice | Click "Print Invoice" | Navigate to /orders/:id/invoice, trigger print dialog |
| Edit Order | Click "Edit Order" | Switch to edit mode (only PENDING/CONFIRMED) |
| Save Edit | Click "Save Changes" | PATCH /api/orders/:id, recalculate, re-push to Steadfast |
| Update Status | Select from dropdown | Confirm dialog, PATCH /api/orders/:id/status |
| Cancel Order | Select "CANCELLED" | Confirm with warning about stock restore + courier cancel |
| Retry Courier | Click "Retry" button | Re-push to Steadfast, update consignment info |
| Download QR | Click "Download QR" | Download QR code image |
| View Tracking | Click "Track on Steadfast" | Open Steadfast tracking page in new tab |

### BRANDING ELEMENTS
- Status timeline is a visual centerpiece
- Clear separation between viewable and editable sections
- Warning banners for destructive actions (cancel, return)
- Consistent color coding for statuses
- Monospace for IDs and tracking codes

---

## Page: 08-invoice-print
name: Invoice Print
category: admin

### SCREEN OVERVIEW
Thermal receipt layout designed for 3-inch x 4-inch thermal printers. This page is print-optimized and triggered via the browser print dialog using react-to-print. Shows order details in a compact format with a QR code for tracking.

Purpose:
- Generate print-ready thermal receipt (3x4 inch)
- Display order summary, customer info, line items
- Include QR code for public tracking
- Trigger browser print dialog automatically

### LAYOUT INSTRUCTIONS

**SCREEN WRAPPER (non-print view):**
- Centered card with thermal receipt preview
- Above receipt: "Print Invoice" button (indigo-600, large) + "Back to Order" link
- Receipt card has subtle shadow to simulate paper

**THERMAL RECEIPT (3in x 4in, CSS @page size):**
- Monospace font throughout (12px base)
- Margins: 2mm all sides
- No colors — pure black on white for thermal printing

**RECEIPT LAYOUT (top to bottom):**

- **Header (centered):**
  - "Glam Lavish" (16px, bold, centered)
  - Horizontal divider line (dashed)

- **Invoice Info:**
  - "Invoice: GL-0042" (bold)
  - "Date: 12/03/2026"
  - "Courier: Steadfast"
  - "Tracking: 227241927"
  - Horizontal divider line (dashed)

- **Customer Info:**
  - "To: Customer Name"
  - "Ph: 01XXXXXXXXX"
  - "Addr: Full delivery address text wrapping as needed"
  - Horizontal divider line (dashed)

- **Line Items:**
  - Header row: "Product    Qty    Price" (right-aligned amounts)
  - Each item: Product name (truncated if long), quantity, BDT amount
  - Variation attributes shown below product name in smaller text
  - Horizontal divider line (dashed)

- **Totals:**
  - "Subtotal:     BDT 1,499.00" (right-aligned)
  - "Delivery:     BDT    80.00"
  - "Grand Total:  BDT 1,579.00" (bold)
  - "Due Amount:   BDT 1,579.00" (bold)

- **QR Code (centered):**
  - QR code image: ~2cm x 2cm
  - Below QR: "Scan to track your order" (10px, centered)

**PRINT CSS:**
- `@page { size: 3in 4in; margin: 2mm; }`
- `@media print { body { margin: 0; } .no-print { display: none; } }`
- All non-receipt elements hidden in print view

### KEY FEATURES
- Auto-triggers print dialog via react-to-print on page load (optional, configurable)
- Pure black-and-white for thermal printer compatibility
- QR code encodes: {FRONTEND_URL}/tracking/{invoiceId}
- Product names auto-truncate to fit receipt width
- Amounts right-aligned with decimal alignment
- Print preview matches actual receipt output

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| Print Invoice | Click "Print Invoice" or auto on load | Open browser print dialog with thermal receipt |
| Back to Order | Click "Back to Order" | Navigate to /orders/:id |

### BRANDING ELEMENTS
- Minimal — thermal receipt style
- "Glam Lavish" header is the only branding
- Clean monospace layout
- No colors — black and white only

---

## Page: 09-tracking
name: Public Order Tracking
category: public

### SCREEN OVERVIEW
Public-facing order tracking page accessible by anyone with the URL (no authentication required). Customers reach this page by scanning the QR code on their invoice. Displays order status timeline, basic order info, and courier tracking details. Customer name is partially masked for privacy.

Purpose:
- Allow customers to track their order status via QR code scan
- Display clear order progress timeline
- Link to courier's own tracking page
- No login required — fully public

### LAYOUT INSTRUCTIONS

**OVERALL LAYOUT:**
- Centered content, max-width 480px, padding 24px
- Light gray-50 background
- No sidebar or navigation (public page)

**HEADER (centered):**
- "Glam Lavish" logo/text (indigo-600, 24px, bold)
- "Order Tracking" subtitle (14px, gray-500)

**INVOICE CARD (white bg, rounded-xl, shadow-md, padding 32px):**

- **Invoice ID:** "GL-0042" (24px, bold, monospace, centered)
- **Order Date:** "March 12, 2026" (14px, gray-500, centered)
- Divider line

- **Status Timeline (vertical):**
  - Each step is a circle + label + optional timestamp, connected by vertical line
  - Steps: Order Placed → Confirmed → Processing → Shipped → Delivered
  - Completed: Green filled circle, green connecting line, checkmark icon
  - Current: Indigo filled circle, pulsing ring animation, bold label
  - Pending: Gray outlined circle, gray line, gray label
  - If CANCELLED: Red circle with X icon, red label "Order Cancelled"
  - If RETURNED: Gray circle with return icon, "Order Returned"
  - Timestamps next to completed steps (in BST)

- Divider line

- **Customer Info:**
  - Name: "Cus***er Na**" (partially masked, only first 3 and last 2 chars visible)
  - No phone or address shown (privacy)

- **Courier Info (if available):**
  - Courier: "Steadfast" with truck icon
  - Tracking Code: "227241927" (monospace)
  - "Track on Courier Website" button (outlined, external link icon) — links to Steadfast tracking

**FOOTER (centered, below card):**
- "Powered by Glam Lavish" (12px, gray-400)
- Small text: "For queries, contact us at [phone/email]"

**ERROR STATE (invalid invoice ID):**
- Same header
- Card with warning icon
- "Order not found"
- "Please check your invoice ID and try again"
- Manual input field: "Enter Invoice ID" + "Track" button

### KEY FEATURES
- No authentication required
- Privacy-safe: Customer name partially masked, no phone/address shown
- Clean, mobile-optimized layout (most users scan QR on phone)
- Status timeline is the visual centerpiece
- Courier tracking link opens external page
- 404 handling for invalid invoice IDs
- Works offline after initial load (static content)

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| View Status | Page load | GET /api/tracking/:invoiceId, display timeline |
| Track on Courier | Click tracking link | Open Steadfast tracking page in new tab |
| Manual Track | Enter invoice ID | Navigate to /tracking/{invoiceId} |

### BRANDING ELEMENTS
- Glam Lavish branding at top
- Clean, customer-friendly design
- Mobile-first layout
- Indigo and green for positive status progression
- Professional but approachable tone

---

## Page: 10-settings
name: Settings
category: admin

### SCREEN OVERVIEW
Admin-only settings page with tabbed sections for WooCommerce configuration, user management, and sync log viewer. Admins can manage staff accounts (create, edit, reset password, deactivate), view WooCommerce connection status, trigger manual syncs, and review sync history.

Purpose:
- Manage WooCommerce integration settings and trigger manual syncs
- Create and manage staff user accounts (admin only)
- View sync operation logs and errors
- System configuration and maintenance

### LAYOUT INSTRUCTIONS

**SIDEBAR:** Same as Dashboard (Settings nav item active, only visible to Admin role)

**PAGE HEADER:**
- Title: "Settings" (20px, bold)
- Subtitle: "System configuration and user management" (14px, gray-500)

**TABS (horizontal tab bar):**
- Tab 1: "WooCommerce" (Store icon)
- Tab 2: "User Management" (Users icon)
- Tab 3: "Sync Logs" (RefreshCw icon)

**TAB 1: WooCommerce**

- Card: "Connection Status"
  - Status indicator: Green dot "Connected" or Red dot "Not configured"
  - Store URL display (from env var — not editable in UI)
  - Last sync timestamp
  - "Test Connection" button (outlined)
  - Note: "WooCommerce credentials are configured via environment variables for security"

- Card: "Manual Sync"
  - "Sync Products" button: Triggers full product content import from WC
  - "Sync Orders" button: Fetches recent WC orders (last 30 days)
  - "Push All Stock" button: Pushes all local stock values to WC
  - Each button shows loading state and result count on completion
  - Warning text: "Manual sync may take several minutes for large catalogs"

- Card: "Webhook Status"
  - List of registered webhooks with status indicators
  - Webhook URL: displayed for setup reference
  - Last received timestamp per webhook type

**TAB 2: User Management**

- Header row: "Users" + "Add User" button (indigo-600, Plus icon)
- Users table:
  - Columns: Name, Email, Role (ADMIN/STAFF badge), Status (Active/Inactive), Created, Actions
  - Role badge: "Admin" (indigo pill), "Staff" (gray pill)
  - Status: Green dot "Active", Red dot "Inactive"
  - Actions: "Edit" (pencil icon), "Reset Password" (key icon), "Deactivate" (toggle)
  - Cannot deactivate yourself

- "Add User" Modal:
  - Fields: Full Name, Email, Password (auto-generated option), Role dropdown (Admin/Staff)
  - "Create User" button
  - Success: Show generated password in copyable field

- "Edit User" Modal:
  - Same fields as add, pre-filled
  - "Reset Password" section: Generate new password, copyable

**TAB 3: Sync Logs**

- Filters: Direction (Inbound/Outbound), Entity Type (Product/Order), Status (Success/Failed), Date range
- Logs table:
  - Columns: Timestamp (BST), Direction (arrow icons), Entity Type, Entity ID, Status, Error (truncated)
  - Direction: Green down-arrow "Inbound", Blue up-arrow "Outbound"
  - Status: Green "Success", Red "Failed"
  - Failed rows: Red left border, expandable to show full error message
  - Paginated, 25 per page

### KEY FEATURES
- WC credentials are ENV-only — not editable in UI (security best practice)
- User creation with auto-generated password option
- Password reset generates new password (no email flow)
- Sync logs with detailed error messages for debugging
- Manual sync buttons with progress indicators
- Tab state persisted in URL hash (#woocommerce, #users, #sync-logs)
- Only Admin role can access this page

### MAIN ACTIONS
| Action | Trigger | Behavior |
|--------|---------|----------|
| Test WC Connection | Click "Test Connection" | Attempt WC API call, show success/error |
| Sync Products | Click "Sync Products" | POST /api/woocommerce/sync/products, show progress |
| Sync Orders | Click "Sync Orders" | POST /api/woocommerce/sync/orders, show progress |
| Push Stock | Click "Push All Stock" | Push local stock to WC, show count |
| Add User | Click "Add User" + submit | POST /api/users, show generated password |
| Edit User | Click edit icon + submit | PATCH /api/users/:id |
| Reset Password | Click key icon + confirm | PATCH /api/users/:id with new password |
| Deactivate User | Click toggle + confirm | DELETE /api/users/:id (soft deactivate) |
| Filter Logs | Use filter dropdowns | Re-fetch sync logs with filters |

### BRANDING ELEMENTS
- Tab-based organization keeps settings clean
- Consistent card styling throughout
- Warning/info banners for important notes
- Dangerous actions (deactivate) require confirmation dialog
- Sync status uses standard green/red indicators

---
