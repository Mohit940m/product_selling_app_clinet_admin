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
