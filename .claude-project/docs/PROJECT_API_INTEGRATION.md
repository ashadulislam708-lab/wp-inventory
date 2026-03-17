# Frontend-API Integration: glam-lavish

## Overview

The application has a single frontend project:
- **dashboard/** (port 8041) — Admin panel with all protected pages + public tracking page

Connects to the backend API at `http://localhost:8040/api`.

## Dashboard Pages (dashboard/ — port 8041)

### Public Pages

| Route | Page | API Endpoints | Status |
|-------|------|---------------|--------|
| `/login` | Login | `POST /api/auth/login` | Not Started |
| `/tracking/:invoiceId` | Order Tracking | `GET /api/tracking/:invoiceId` | Not Started |

### Protected Pages (Require Auth)

| Route | Page | Role | API Endpoints | Status |
|-------|------|------|---------------|--------|
| `/` | Dashboard | All | `GET /api/dashboard/stats`, `GET /api/dashboard/low-stock`, `GET /api/dashboard/recent-orders` | Not Started |
| `/products` | Product List | All | `GET /api/products?page=&limit=&category=&stockStatus=&search=`, `GET /api/categories` | Not Started |
| `/products/:id` | Product Detail | All | `GET /api/products/:id`, `PATCH /api/products/:id/stock`, `PATCH /api/products/variations/:id/stock`, `GET /api/products/:id/stock-history` | Not Started |
| `/orders` | Order List | All | `GET /api/orders?page=&limit=&status=&source=&startDate=&endDate=`, `GET /api/orders/export` | Not Started |
| `/orders/new` | Create Order | All | `POST /api/orders`, `GET /api/products?search=`, `GET /api/categories` | Not Started |
| `/orders/:id` | Order Detail | All | `GET /api/orders/:id`, `PATCH /api/orders/:id`, `PATCH /api/orders/:id/status`, `POST /api/orders/:id/retry-courier`, `GET /api/orders/:id/qr` | Not Started |
| `/orders/:id/invoice` | Invoice Print | All | `GET /api/orders/:id/invoice` | Not Started |
| `/settings` | Settings | Admin | `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id`, `DELETE /api/users/:id`, `GET /api/settings/wc-status`, `POST /api/woocommerce/import/products`, `POST /api/woocommerce/sync/products`, `POST /api/woocommerce/sync/orders`, `GET /api/woocommerce/sync-logs` | Not Started |

### Auth Integration

| Endpoint | Used By | Notes |
|----------|---------|-------|
| `POST /api/auth/login` | Login page | Returns access + refresh tokens |
| `POST /api/auth/refresh` | Axios interceptor | Silent token refresh on 401 |
| `POST /api/auth/logout` | Dashboard header | Revokes refresh token |
| `GET /api/auth/me` | App initialization | Load user profile on mount |

## Routing Strategy

### dashboard/ (port 8041)
- All routes protected by auth guard except `/login` and `/tracking/:invoiceId`
- `/login` redirects to `/` on successful auth
- `/tracking/:invoiceId` is fully public, no header/nav needed
- Role-based visibility:
  - `/settings` — Admin only (hidden from Staff)
  - All other pages — both Admin and Staff
- Sidebar navigation with route links
- Auto-refresh JWT tokens via Axios interceptor

## API Client Configuration

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // http://localhost:8040/api
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await api.post('/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Status Legend

| Status | Meaning |
|--------|---------|
| Not Started | Page and API integration not yet implemented |
| In Progress | Currently being developed |
| Done | Page connected to all required API endpoints |
| Blocked | Waiting on backend API implementation |

---

**Last Updated:** 2026-03-15
