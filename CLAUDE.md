# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (default port 5173, or VITE_PORT)
npm run build      # Type-check with tsc -b, then Vite production build → dist/
npm run lint       # Run ESLint across all files
npm run preview    # Serve the built dist/ locally
```

There is no test suite configured in this project.

## Environment Variables

Create a `.env` file at the project root:

```
VITE_SERVER_URL=https://product-selling-app-server.onrender.com   # Backend base URL
VITE_PORT=5203                                                      # Dev server port (optional)
```

The `VITE_SERVER_URL` variable defaults to the production Render URL if omitted. Cloudinary credentials (cloud name, API key, signature) are fetched from the backend at runtime — they are not stored in the frontend `.env`.

## Architecture

This is a **React 19 + TypeScript + Vite SPA** serving as the seller admin dashboard for a product-selling platform, implementing the **Kartly** design system (see `docs/KARTLY_UI_PLAN.md` and `docs/KARTLY_MIGRATION_NOTES.md`). It has no global state management — all state is local `useState` per page.

### Key layers

**`src/api/`** — Two Axios instances:
- `sellerApi.ts`: base URL `{VITE_SERVER_URL}/api/v1/seller`, attaches `Authorization: Bearer {sellerToken}` from localStorage on every request via a request interceptor.
- `cloudinaryApi.ts`: fetches a signed upload credential from the backend (`/products/cloudinary-signature`), then uploads files directly to Cloudinary's API. Returns `{ url, publicId }` per file.

**`src/pages/`** — One component per route. Each page manages its own loading/error/data state with `useEffect` + `sellerApi` calls. Auth is guarded once, centrally: `layout/RequireSellerAuth.tsx` wraps the `AdminLayout` route in `App.tsx` and redirects to `/login` if `sellerToken` is absent — pages no longer check it themselves.

**`src/components/layout/`** — Admin shell: `AdminLayout` (persistent `Sidebar` at `lg+`, `MobileTopBar` + left drawer below it, routed content, `Footer`; `min-w-0` on the content column so a wide table can't force page-level horizontal scroll), `Sidebar`/`SidebarNavLinks` (shared nav list — real routes only: Overview/Products/Orders/Shipping/Offers; the prototype's Customers/Fulfilment/Discounts have no route and were dropped), `MobileActionBar`, `PageHeader`, `BrandMark`, `Container`, `AuthLayout` (shared shell for `/login` and `/signup`, outside `AdminLayout`).

**`src/components/ui/`** — The primitive library: `Button` (includes a `danger` variant), `Input`, `Select`, `Textarea`, `FileDrop` (drag/drop product-image zone), `Chip`, `Badge` + `statusTone.ts` (maps the backend's real order/payment status enum to a Badge tone), `Card`, `Panel`, `StatCard`, `ProgressBar`, `Skeleton`, `EmptyState`, `ImageFrame`, `Switch`, `Sheet`/`Modal` (sharing `useDialogBehavior`), `ConfirmDialog` (replaces every `window.confirm`), `Toast`/`showKartlyToast.tsx`, and the admin-only `DataTable` (real `<table>` at `lg+`, stacked `Card` list below, with its own `overflow-x-auto`), `BarChart` (pure CSS, with an accessible sr-only table fallback), `QueueList`, `Toolbar`.

**`src/theme/`** — `ThemeProvider`/`ThemeContext`/`useTheme` — light/dark mode via a `data-theme` attribute on `<html>`, persisted to `localStorage` (`kartlyAdminTheme`). Toggled live from the `Sidebar`'s dark-mode `Switch`.

**`src/components/auth/OtpInput.tsx`**, **`src/hooks/useCountdown.ts`** — the six-box OTP input and resend-countdown hook shared by `LoginPage`/`SignUpPage`.

**~~`src/assets/icons/`~~** — deleted; was a set of unused custom SVG wrapper components. The app uses `react-icons` (Feather set, `fi` prefix) directly everywhere.

### Routing (App.tsx)

Nested routing: `/login` and `/signup` render outside the shell (their own `AuthLayout`); every other route is nested under `RequireSellerAuth` → `AdminLayout`.

```
/                         → redirect to /login
/login                    → two-step OTP flow (credentials → OTP verify)
/signup                   → seller registration
/dashboard                → stats, recent products, shipping config
/products                 → product list with search & status filter
/products/new             → create product with Cloudinary image uploads
/products/:productId      → product details view
/products/:productId/edit → edit product
/orders                   → order list
/shipping                 → shipping origin + per-zone rate configuration
/offers                   → offer creation (discount/cashback/buy-get/bundle)
```

### Authentication flow

Login is two-step: POST `/auth/login` with email+password → backend sends OTP to email → POST `/auth/verify-login` with email+otp → receives JWT → stored in `localStorage` as `sellerToken`. Seller profile is cached in `localStorage` as `sellerProfile` — but **only by `SignUpPage`**; `LoginPage`'s verify-login response is never written there, so a seller who only ever logs in (never signs up on this device) has no cached profile. `Sidebar`'s account card falls back to a generic "Seller account" label in that case rather than rendering blank.

The backend returns the OTP in the response body ("for testing/demo purposes" — no real email delivery). Both auth pages surface it in a clearly-labelled `Badge tone="warn"` dev-notice card.

### Known backend gaps that shape the UI

Several seller routes the Kartly prototype assumes don't exist yet — the corresponding UI is built as an honest "coming soon" state rather than against fabricated data (see `docs/KARTLY_MIGRATION_NOTES.md` for the full reasoning per page):
- **No order-listing/detail endpoint** (`seller.routes/` has no order routes at all) — `OrderListPage` and the dashboard's "recent orders"/"fulfilment queue" stay `EmptyState`s.
- **`offerManagement.routes.ts` exposes only `POST /create-offer`** — no list/get/update/delete/enable-disable — so `OffersPage` is create-only, with a panel explaining the rest isn't available yet.
- **`ProductListPage`'s `/products/get-all-products` has no sort or pagination params wired**, and **`ShippingConfigPage`'s five rate zones are a fixed shape**, not an addable/removable list.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin — **not** `tailwind.config.js`, which Tailwind v4 does not read and which has been deleted). All design tokens live in `src/index.css`:

- **Raw custom properties** (`--k-*`) on `:root` and `[data-theme="dark"]` — these flip when the theme toggles. Includes the fixed (theme-independent) order-status palette (`--k-ok-*`, `--k-warn-*`, `--k-bad-*`, `--k-plum-fg`, `--k-danger`) and `--k-on-soft`/`--k-on-soft-muted` for text on the `--k-soft` wash (queue card, stat tiles).
- **Tailwind `@theme` mappings** (`--color-*`, `--radius-*`, `--font-*`, `--animate-*`) generating the utilities used everywhere (`bg-card`, `text-ink`, `border-line`, `bg-accent`, `rounded-panel`, `animate-up`, `animate-bar`, etc).
- Ten ported prototype keyframes plus hover-lift/transition utilities (`.lift-stat`, `.slide-x`, `.t-base`, etc), all disabled under `prefers-reduced-motion: reduce`.

Dark mode is a real, working feature — same `data-theme` + no-flash-inline-script mechanism as the user client, keyed to `kartlyAdminTheme` instead of `kartlyTheme` so the two apps don't share (or fight over) one preference.

Toast notifications use `react-toastify`, restyled to the Kartly tokens in `App.tsx`; `showKartlyToast()` renders the dark inline toast variant for save confirmations. Icons from `react-icons` (Feather set, `fi` prefix).

### TypeScript

Strict mode is on (`noUnusedLocals`, `noUnusedParameters`). Module resolution is `bundler` (Vite). The build fails on type errors — run `npm run build` to catch them, or `tsc -b --noEmit` to type-check without producing output.
