# Frontend Auth Flow: glam-lavish

## Login Flow

### Step 1: Login Page

- **Route**: `/login` (in dashboard/ app, port 8041)
- **Form fields**: email (text, required), password (password, required)
- **UI**: Simple centered login form with Glam Lavish branding
- **Links/actions**: No forgot password, no sign up (admin creates all accounts)

### Step 2: Submit Login

- **API**: `POST /api/auth/login` with `{ email, password }`

- **If Success**:
  1. Store access token and refresh token (localStorage)
  2. Redirect to `/` (dashboard home)

- **If Not Success**:
  1. Stay on Login Page
  2. Show error message: "Invalid email or password"

## Sign Up Flow

**No sign-up flow.** All user accounts are created by Admin via Settings page. No self-registration is supported.

## Forgot Password Flow

**No forgot password flow.** Admin resets user passwords via the Settings > User Management section.

## Session Management

### Token Strategy

| Token | Storage | Expiry | Purpose |
|-------|---------|--------|---------|
| Access Token | localStorage | 1 hour | API authentication via `Authorization: Bearer <token>` |
| Refresh Token | localStorage | 7 days | Silent access token renewal |

### Auto-Refresh

- Axios response interceptor catches 401 errors
- Automatically calls `POST /api/auth/refresh` with current refresh token
- On success: stores new tokens, retries original request
- On failure: clears tokens, redirects to `/login`

### Logout

- **API**: `POST /api/auth/logout` (revokes refresh token server-side)
- Clear localStorage tokens
- Redirect to login page

## Protected Routes

### Route Guards

**dashboard/ app (port 8041):**
- All routes require authentication except `/login` and `/tracking/:invoiceId`
- On mount: call `GET /api/auth/me` to verify token and load user profile
- If token invalid/expired and refresh fails → redirect to `/login`

**Role-based access:**
| Route | Admin | Staff |
|-------|-------|-------|
| `/` (Dashboard) | Yes | Yes |
| `/products` | Yes | Yes |
| `/products/:id` | Yes | Yes |
| `/orders` | Yes | Yes |
| `/orders/new` | Yes | Yes |
| `/orders/:id` | Yes | Yes |
| `/orders/:id/invoice` | Yes | Yes |
| `/settings` | Yes | **No** (hidden) |

**Public routes (no auth):**
- `/login` — redirects to `/` if already authenticated
- `/tracking/:invoiceId` — fully public, no auth check needed

## Security Notes

- JWT access tokens sent via `Authorization: Bearer <token>` header
- Passwords hashed with bcrypt (10 salt rounds) server-side
- No self-registration prevents unauthorized account creation
- Refresh tokens are revoked on logout and can be revoked by admin

---

**Last Updated:** 2026-03-15
