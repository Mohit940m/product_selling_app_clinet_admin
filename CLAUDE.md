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

This is a **React 19 + TypeScript + Vite SPA** serving as the seller admin dashboard for a product-selling platform. It has no global state management — all state is local `useState` per page.

### Key layers

**`src/api/`** — Two Axios instances:
- `sellerApi.ts`: base URL `{VITE_SERVER_URL}/api/v1/seller`, attaches `Authorization: Bearer {sellerToken}` from localStorage on every request via a request interceptor.
- `cloudinaryApi.ts`: fetches a signed upload credential from the backend (`/products/cloudinary-signature`), then uploads files directly to Cloudinary's API. Returns `{ url, publicId }` per file.

**`src/pages/`** — One component per route. Each page manages its own loading/error/data state with `useEffect` + `sellerApi` calls. Auth guard pattern: pages check `localStorage.getItem('sellerToken')` and redirect to `/login` if absent.

**`src/components/`** — Small, stateless UI primitives (`Button`, `Card`, `Header`, `MetricCard`).

**`src/assets/icons/`** — Custom SVG icon components wrapping Feather icon shapes.

### Routing (App.tsx)

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
```

### Authentication flow

Login is two-step: POST `/auth/login` with email+password → backend sends OTP to email → POST `/auth/verify-login` with email+otp → receives JWT → stored in `localStorage` as `sellerToken`. Seller profile is cached in `localStorage` as `sellerProfile`.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin — no `tailwind.config.js` PostCSS setup needed). Custom design tokens defined in `tailwind.config.js`:
- `primary`: `#A78BFA` (purple)
- `accent`: `#4C1D95` (dark purple)
- `secondary`: `#F3F4F6`
- `background`: `#F9FAFB`
- `text`: `#1F2937`

Toast notifications use `react-toastify` with a custom `toastClassName` wired in `App.tsx`. Icons come from `react-icons` (Feather set, `fi` prefix).

### TypeScript

Strict mode is on (`noUnusedLocals`, `noUnusedParameters`). Module resolution is `bundler` (Vite). The build fails on type errors — run `npm run build` to catch them, or `tsc -b --noEmit` to type-check without producing output.
