# Negative-Test Report — product_selling_app_clinet_admin (seller dashboard)

**Date:** 2026-09-16
**Branch:** `agentic-chat`
**Method:** As a Vite/React SPA with no automated test suite, "negative testing" here means static robustness verification — type-checking, linting, and an audit of the client's error/edge-case handling against the backend it calls. The backend it targets was independently exercised with 79 live negative HTTP tests (see `product_selling_app_server/doc/NEGATIVE_TEST_REPORT.md`), including seller cross-tenant isolation.

## Summary

| Check | Result |
|-------|--------|
| `tsc -b` (type-check) | ✅ clean (exit 0) |
| `eslint .` | ✅ 0 errors, 0 warnings |
| Build config sanity | ✅ |
| Error-handling audit | ✅ no gaps found |

## Client-side negative-path handling verified (by code audit)

### Network / API resilience (`src/api/sellerApi.ts`, `agentApi.ts`, `cloudinaryApi.ts`)
- **Request timeout** 45s on the store API so a dropped connection can't hang a spinner forever. (The direct-to-Cloudinary upload is a separate axios call and intentionally not covered by this instance's timeout.)
- **`localStorage` access wrapped in try/catch** on every read; requests fall through unauthenticated rather than throwing.
- **Global 401 interceptor** clears `sellerToken` and redirects to `/login`, only when a token was present and not already on an auth page.
- **Direct Cloudinary upload** enforces a client-side 10 MB size limit (`partitionBySize`) matching the server's multer limit, giving a friendly error before the upload is attempted rather than a raw Cloudinary API error.

### Routing / auth guard
- `RequireSellerAuth` guards every route inside `AdminLayout`; a thrown `localStorage` read is treated as "not logged in" and redirects, rather than falling into the generic `ErrorBoundary`.
- Catch-all `*` route renders `NotFoundPage`.
- `ErrorBoundary` wraps the whole route tree.

### Data/UI edge cases
- Features whose backend endpoints don't exist yet (order cancellation/refunds, dashboard revenue charts, addable shipping zones, editing an existing offer's full field set) are rendered as honest `EmptyState`s or omitted, with the missing endpoint named in `docs/KARTLY_MIGRATION_NOTES.md` — no fabricated data or dead controls.

## Backend cross-tenant isolation (confirmed live against the API)
The dashboard's most sensitive assumption — that a seller only ever sees/edits their own catalog, offers, and order line items — was verified end-to-end on the server:
- Seller 2 viewing / deactivating / deleting seller 1's product → **404**.
- Seller-scoped offer listing returns only the caller's offers.
- A buyer JWT on any `/seller/*` route → **401**.

## API-contract cross-check
Verified the admin client calls paths that exist on the backend's `mcp` branch:
- `sellerApi` base `…/api/v1/seller`; product CRUD, per-variant price/stock/status edits, restock, add-variant, offers (list/create/edit-status/delete), shipping (get/create/update/calc), orders (list/detail/item-status) all match their route files.
- `/products/cloudinary-signature` used by the direct-upload flow — matches `product.routes.ts`.
- `agentApi` base `…/api/v1/seller-chat` — matches the agent's `sellerChatRoutes`.

## Not covered (needs a manual device/browser pass)
- Live responsive/accessibility verification (recorded in `docs/KARTLY_UI_PLAN.md`).
- Real end-to-end product-create with photo upload and the live seller assistant chat (Gemini quota).

## How to reproduce
```bash
# from product_selling_app_clinet_admin/
npm run build     # tsc -b + vite build
npm run lint      # eslint
```
