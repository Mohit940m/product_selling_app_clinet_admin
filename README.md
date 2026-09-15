# Kartly Seller Admin

A seller-facing React SPA for managing products, offers, and shipping configuration. Part of the `product_selling_app` monorepo, implementing the **Kartly** design system. Note the intentional `clinet` typo in this folder's own name (`product_selling_app_clinet_admin`) — it isn't corrected in paths.

> This README replaces the unedited Vite scaffold template that shipped here before — it had zero project-specific content. For full, actively-maintained architecture detail — routing, styling tokens, known backend gaps — see this app's own `CLAUDE.md`, which this file defers to rather than duplicating.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Routing | react-router-dom v7 |
| HTTP client | Axios |
| Notifications | react-toastify |
| Icons | react-icons (Feather `fi` prefix) |
| Image uploads | Direct-to-Cloudinary via a backend-signed upload |

No global state management — all state is local `useState` per page.

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of `product_selling_app_server` (or use the hosted backend)

### Installation

```bash
cd product_selling_app_clinet_admin
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SERVER_URL=https://product-selling-app-server.onrender.com
VITE_PORT=5203
VITE_AGENT_URL=http://localhost:4100   # seller assistant (agentic-chat branch)
```

Cloudinary credentials are fetched from the backend at runtime — they are not stored in this app's own `.env`.

### Running the App

```bash
npm run dev       # Start dev server at http://localhost:5203
npm run build     # Type-check (tsc -b) then build to dist/
npm run lint      # ESLint
npm run preview   # Serve the built dist/ locally
```

## Features

- **Authentication** — Two-step OTP login (email + password, then OTP) and registration
- **Dashboard** — Stats, recent products, shipping config shortcut
- **Products** — List with search/status filter/pagination, create with Cloudinary image uploads, edit, per-variant price/stock/active-status management, restock
- **Orders** — Paid orders that include your products (your items and subtotal only) with a detail drawer; each product in an order has its own sub-order number, stage and tracking
- **Shipping** — Origin + five fixed delivery-zone rates (same-city/state/region, rest of India, remote)
- **Offers** — Create discount/cashback/buy-get/bundle offers targeting products or specific variants, a real persisted offer list, enable/disable and delete per offer
- **Assistant** *(branch `agentic-chat`)* — Chat to check stock, restock, see orders and item statuses, and add products through an in-chat form with photo upload; changes wait for your confirmation. Needs `product_selling_app_agent` (branch `mcp`) and the server's `mcp` branch running.

## Routes

| Path | Page | Notes |
|---|---|---|
| `/` | Redirects to `/login` | — |
| `/login` | Two-step OTP login | — |
| `/signup` | Seller registration | — |
| `/dashboard` | Stats, recent products, shipping config | Behind `RequireSellerAuth` |
| `/products` | Product list | Behind `RequireSellerAuth` |
| `/products/new` | Create product | Behind `RequireSellerAuth` |
| `/products/:productId` | Product details | Behind `RequireSellerAuth` |
| `/products/:productId/edit` | Edit product | Behind `RequireSellerAuth` |
| `/orders` | Order list + status updates | Behind `RequireSellerAuth` |
| `/shipping` | Shipping origin + rates | Behind `RequireSellerAuth` |
| `/offers` | Offer creation + list | Behind `RequireSellerAuth` |
| `/assistant` | Seller assistant chat | Behind `RequireSellerAuth` |
| `*` | 404 page | Catch-all |

Unlike the buyer storefront (`product_selling_app_client_user`), every route except `/login`/`/signup` sits behind a single centralized guard (`RequireSellerAuth`), not a per-page check.

## Authentication Flow

```
Login:    POST /auth/login (email + password)
            → backend sends OTP to email
          POST /auth/verify-login (email + otp)
            → JWT stored as sellerToken in localStorage

Register: POST /auth/register (name, email, password, phone?)
          POST /auth/verify-registration (email + otp)
            → JWT stored as sellerToken in localStorage
```

Unlike the buyer storefront's passwordless login, seller login requires a password in addition to the OTP step. The OTP is returned directly in the API response for testing/demo purposes — there's no real email delivery; both auth pages surface it in a labelled dev-notice badge.

## Design Tokens

Current Kartly tokens (defined as CSS custom properties + a Tailwind v4 `@theme` block in `src/index.css`, with full light/dark theming, `localStorage` key `kartlyAdminTheme` — deliberately separate from the buyer storefront's `kartlyTheme` so the two apps' theme preferences don't collide):

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--k-accent` | `#A87BF5` | `#B999F7` | Buttons, links, active states |

See `CLAUDE.md` → Styling for the full token/component inventory, including the fixed order-status palette — kept there rather than duplicated here to avoid this section going stale.

## Related Apps

| App | Description | Port |
|---|---|---|
| `product_selling_app_server` | Node.js + Express backend | 4000 |
| `product_selling_app_clinet_admin` | Seller admin dashboard (this app) | 5203 |
| `product_selling_app_client_user` | Buyer storefront | 5204 |
| `product_selling_app_agent` | AI shopping-assistant service | 4100 |
