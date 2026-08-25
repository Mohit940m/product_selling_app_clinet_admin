# Kartly Migration Notes — Seller Admin

Running log kept alongside `docs/KARTLY_UI_PLAN.md`. Record decisions and
baselines here as each phase completes; do not duplicate plan content.

## Phase 0 — Audit baseline (recorded before any code changes)

### 0.1.1 — Confirmed finding

`tailwind.config.js` is not read by Tailwind v4 (`@tailwindcss/vite`, no
`@config` directive in `src/index.css`). Legacy token classes render as
unstyled utilities — same root cause as the user client before its
migration.

### 0.1.2 — Legacy token class inventory (before)

```
grep -rnoE "(bg|text|border|from|to|via)-(primary|secondary|accent|background|text)\b" src/
```

| Class | Count |
|---|---|
| `text-text` | 100 |
| `text-accent` | 43 |
| `bg-secondary` | 33 |
| `text-primary` | 31 |
| `border-primary` | 18 |
| `bg-background` | 10 |
| `bg-primary` | 6 |
| **Total** | **241** |

Per file (top): `DashboardPage.tsx` 32, `OffersPage.tsx` 24, `SignUpPage.tsx`
19, `AddProductPage.tsx` 17, `LoginPage.tsx` 16, `ProductListPage.tsx` 14,
`EditProductPage.tsx` 12, `ShippingConfigPage.tsx` 10, `OrderListPage.tsx`
10, `ProductDetailsPage.tsx` 8, `Header.tsx` 8, plus small hits in
`MetricCard.tsx`, `Card.tsx`, and the five icon components under
`src/assets/icons/`.

This is the "before" baseline for Phase 7.1.1's re-run of the same grep
(with the ambiguity fix — see the user client's notes on why "accent"
alone can't be the check once the new `--color-accent` token exists).

### 0.2 — Prerequisites

- `npm install` already satisfied (node_modules present).
- `.env` present with `VITE_SERVER_URL` and `VITE_PORT=5203`.
- Baseline build: `npm run build` — clean.
  ```
  vite v8.0.10 building client environment for production...
  ✓ 96 modules transformed.
  dist/index.html                   0.48 kB
  dist/assets/index-*.css          42.46 kB
  dist/assets/index-*.js          390.57 kB
  ✓ built in 1.59s
  ```
- Baseline `npm run lint` — **not** clean, pre-existing and unrelated to
  this migration (the initial capture via `tail -20` cut off the first of
  these three — corrected here after Phase 2 re-ran a full, untruncated
  lint):
  - `DashboardPage.tsx:84` — calls `setNotice(...)` synchronously inside a
    `useEffect` body (the "not logged in" early-return branch), which
    `react-hooks/set-state-in-effect` flags. Pre-existing, not introduced
    by this migration. Will fix opportunistically in Phase 4.1.
  - `OffersPage.tsx:57` — `useState<BundleItem[]>([{ id: Date.now(), ... }])`
    calls `Date.now()` directly in the initializer expression, which the
    React Compiler / eslint-plugin-react-hooks purity rule flags as an
    impure call during render. Pre-existing bug, not introduced by this
    migration. Will fix opportunistically when `OffersPage.tsx` is
    restyled in Phase 4.8, using `useState(() => [{ id: Date.now(), ... }])`
    (lazy initializer) instead.
  - `ProductListPage.tsx:67` — missing `loadProducts` in a `useEffect` dep
    array (pre-existing `exhaustive-deps` warning, not an error).
- `.env` also present; no `.env.example` existed for this app before —
  added one at the same time as the user client's, when the Kartly
  migration reaches feature flags for this app (none currently apply to
  admin — the flag is user-client-only).

### 0.2.4 — Prototype read

`kartly-ecommerce-template-kit/project/Kartly Commerce Kit.dc.html` — the
Admin tab (706-818) and Components tab (820-1045) — read in full during
plan authoring, plus reused from the user client's Phase 0 read of the
full prototype (tokens, keyframes, `renderVals()` data block).

Phase 0 complete.


## Phase 2 — a fast-refresh rule surfaced as `error` here (not just a warning)

This app's ESLint config (`eslint-plugin-react-refresh`) treats
`only-export-components` as an **error**, unlike the user client's oxlint
config where the same rule is a warning. Two Phase 2 files co-exported a
component alongside a helper function/type and tripped it:

- `src/theme/ThemeProvider.tsx` originally exported both `ThemeProvider`
  and a `useTheme` hook. Split `useTheme` into `src/theme/useTheme.ts` and
  the shared context into `src/theme/ThemeContext.ts`; `ThemeProvider.tsx`
  now exports only the component.
- `src/components/ui/Toast.tsx` originally exported both the `Toast`
  component and a `showKartlyToast` helper. Split the helper into
  `src/components/ui/showKartlyToast.tsx`; `Toast.tsx` now exports only
  the component (plus its prop type, which the rule doesn't flag).

`npm run lint` is clean after these splits except the three pre-existing
baseline issues above.

## Phase 4 — deliberate deviations

### 4.1 DashboardPage

Implemented: PageHeader, responsive 2/4-col StatCard grid (with a
mobile-sized value variant added to StatCard itself), an honest
EmptyState-based revenue panel and fulfilment-queue block (no fabricated
$4,820/+12.4%/18-orders numbers), the real recent-products list restyled
on Panel/ImageFrame/Badge, and the shipping/next-actions panels. Also
fixed the pre-existing `react-hooks/set-state-in-effect` baseline error by
deriving `isLoading`/`notice`'s initial values from lazy `useState`
initializers instead of setting them inside the effect body.

Deliberately **not** built:

- **4.1.6 recent-orders DataTable** — no orders endpoint on the seller API
  (same root cause as `OrderListPage`, see below).
- **4.1.7 quick add-product form + low-stock panel** — kept the existing
  "Next Actions" tips panel in that slot instead. A real low-stock panel
  is plausible later (product variants already carry `stock`), but wasn't
  built this pass; noted as a follow-up.
- **4.1.11/4.1.13/4.1.14 mobile-specific revenue-chart/orders-table/quick-form
  treatments** — not applicable, since none of those desktop elements were
  built to begin with.
- **4.1.15 "+New product" in MobileActionBar** — kept as an always-visible
  PageHeader action instead (reachable at every width, just not pinned to
  a bottom bar).

### 4.2 ProductListPage

Implemented: PageHeader with real counts, search + status Chip filters,
the responsive DataTable (real `<table>` at `lg+`, stacked cards below),
row actions (Activate/Deactivate, Edit, Delete) kept always-visible on
both breakpoints rather than hover-gated, `ConfirmDialog` replacing the
page's own hand-rolled delete modal, `EmptyState`/skeleton loading via
`DataTable`. Fixed the pre-existing `exhaustive-deps` baseline warning
with the same `eslint-disable-next-line` pattern already used elsewhere
in this codebase for the identical intentional-omission case.

Not built: **4.2.2 sort Select** (no sort query param confirmed on the
backend), **4.2.7 pagination** (the endpoint is called with a flat
`limit: 50`, no page param wired — pre-existing scope, not added), and
**4.2.11 MobileActionBar** for "+New product" (kept as an always-visible
`PageHeader` action instead, matching the Dashboard note above).

### 4.3/4.4 AddProductPage / EditProductPage — no shared ProductForm

Plan 4.4.1 calls for extracting a single `src/components/products/ProductForm.tsx`
both pages render with a `mode` prop, on the assumption they're "the exact
same form composition." They aren't: `AddProductPage` manages variant rows
(attributes/price/stock per variant) and `EditProductPage` has no variant
editing at all today — only name/description/category/images. Forcing a
single shared form would mean either bolting variant-editing onto Edit (a
real feature addition, out of scope for a design migration) or building a
form that pretends the two pages have identical capabilities when they
don't. Restyled each page independently instead, on the same primitives
(`Panel`, `Input`, `Textarea`, `FileDrop`, `Button`, `ProgressBar`, new
this phase since the admin Phase 2 primitive list didn't include it but
both this page and the planned 4.5.5 stock-health strip need it).

**AddProductPage implemented:** two-column Basics/Variants/Images/Publish
panels, `FileDrop` for the Cloudinary upload flow, staged-image thumbnails
with a "Cover" badge on the first image, an aggregate upload-progress
indicator, single-column stacking below `lg`. Also swapped the
module-level `defaultVariant` object (built once with `Date.now()` at
import time — not actually the lint-flagged pattern, but the same latent
smell as `OffersPage`) for a `makeVariant()` factory called from a lazy
`useState` initializer.

**Not built:** a "Save draft" action (no draft-status field confirmed on
the backend — the original form never had one either), a product
active/inactive `Switch` on create (no field exposed), per-field inline
validation (kept the existing native-`required` + submit-toast pattern),
per-file (vs. aggregate) upload progress bars, a horizontal thumbnail
rail specifically on mobile, and a `MobileActionBar` for Publish/Save
draft.

### 4.5 ProductDetailsPage

Implemented: variant table with a real stock-health `ProgressBar` per row
(danger-toned below a 5-unit threshold) at `lg+`, the same data as a
stacked card list below `lg`, `Badge`-based status, product metadata
(id/created/updated, when the API returns them), and a "Delete product"
danger action behind `ConfirmDialog` (same soft-delete endpoint as
`EditProductPage`).

Deliberately simplified rather than mirroring the storefront's D2 PDP
composition (thumbnail rail + full-bleed hero, mono price eyebrow, mobile
dot pager) — this is a seller-facing detail view, not a buyer product
page; kept a plain image grid instead. **Not built:** an "Offers" section
(no per-product offers-lookup endpoint verified from this page), a
"Preview in store" link (no confirmed public storefront base URL exposed
to this app), and a `MobileActionBar` for Edit.

### 4.6 OrderListPage

Kept the page's existing honest stance — "Order management API routes
coming soon" — since the seller routes (`product_selling_app_server/src/routes/seller.routes/`)
have no order-listing endpoint at all. Restyled the shell: `PageHeader`,
`Chip`-based status filter rail (using the **real** backend order-status
enum from `order.model.ts` — `CREATED/CONFIRMED/SHIPPED/OUT FOR
DELIVERY/DELIVERED/CANCELLED` — replacing the page's previous invented
`pending/processing/shipped/delivered/cancelled` set that didn't match the
schema), `EmptyState`, and `Badge`+`statusTone` for the status-legend row.

The `DataTable` (4.6.3), row-click detail `Sheet` (4.6.5), date-range
filter (4.6.6), and the mobile card-list equivalents (4.6.8-4.6.11) are
not built — there is no order data to populate them with, and a table
that always renders its own empty state would just be this page's
`EmptyState` with extra steps.

### 4.7 ShippingConfigPage

Implemented: restyled on `Panel`/`Input`/`Button`/`Skeleton`, rate rows as
bordered tiles with a hover state. Kept the existing single-column,
whole-form-save UX (all five rate zones always editable, one Save action)
rather than the plan's inline-edit-per-row pattern — this backend's
shipping config is one document with five **fixed** rate keys
(`sameCity/sameState/sameRegion/restOfIndia/remote`), not a addable/
removable list, so "+ Add rate" (4.7.5) and per-row inline-edit-then-Save
(4.7.4/4.7.9) don't map onto the real data model. A free-shipping
threshold field (4.7.6) doesn't exist in the schema either.

Not built: the two-column origin/rates desktop layout (kept one stacked
column at every width, matching the original), a real-data `PageHeader`
subtitle showing the configured city/state, moving Save into the page
header, and a `MobileActionBar`.
