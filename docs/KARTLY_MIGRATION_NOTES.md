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

### 4.8 OffersPage

**Root cause for most of this section's gaps:** the seller offer routes
(`product_selling_app_server/src/routes/seller.routes/offerManagement.routes.ts`)
expose exactly one endpoint — `POST /create-offer`. There is no list, get,
update, delete, or enable/disable endpoint. This page was always a
create-only form, never a list+CRUD screen, so the plan's grid-of-offer-
cards / Modal edit / delete-with-Switch / status filter chips (4.8.2-4.8.4,
4.8.7, and their mobile equivalents 4.8.9-4.8.12) don't have data to work
against and weren't built.

Implemented: the create form restyled on the new primitives (`Panel`,
`Input`, `Textarea`, `Chip` for offer-type and discount-type selection,
`Switch` for "active immediately", `Button`), plus an honest panel at the
top of the page explaining that offer listing isn't available yet
(mirroring the `OrderListPage` pattern) rather than the plan's assumed
"no offers yet" empty state — this app genuinely cannot know whether
offers exist, only that it can't list them. Also fixed the pre-existing
baseline lint **error**: `useState<BundleItem[]>([{ id: Date.now(), ... }])`
called the impure `Date.now()` directly in the initializer expression;
replaced with a `makeBundleItem()` factory called from a lazy `useState`
initializer, same pattern used in `AddProductPage`.

**Not built (all a consequence of the missing list/edit endpoints):** the
target-product picker as a searchable checkbox list (kept the original
comma-separated product-ID textarea — there's no product-list fetch wired
into this form to back a picker with), and everything Modal/Sheet/grid
related above.

With this page fixed, **all three pre-existing baseline lint issues from
Phase 0 are now resolved** — `npm run lint` is fully clean.

## Phase 5 — motion & interaction pass

12 of 13 items done. Added a `Reveal`-style stagger (`animate-up`,
`index * 40ms`, capped at 400ms) to `DataTable`'s mobile card list, and
wired `showKartlyToast` into two representative save-confirmation flows
(`AddProductPage` create, `EditProductPage` save) as the sample for that
pattern — matching the scope the user client's Phase 5 used for the same
item, not an exhaustive sweep of every `toast.success` call in the app.

Not built: **5.8 stat-value count-up animation** on `StatCard` — no
count-up was implemented; values render at their final number immediately.

## Phase 6 — Responsive QA matrix: code-audit pass, not live-viewport

Same constraint as the user client: no browser/screenshot tool available
in this session, so this is a code audit rather than live rendering.

**Verified by class/structure inspection:**
- 6.1 no horizontal overflow — audited every `w-[Npx]`/`max-w-[Npx]` in
  `src/pages` and `src/components`. `AuthLayout`'s decorative circle/card
  are inside `hidden ... lg:block` (desktop-only). `OrderListPage`'s
  search bar is `lg:max-w-[340px]` (correctly scoped);
  `ProductListPage`'s equivalent is unscoped `max-w-[340px]`, but since
  it sits in a `flex-1` row inside a `flex-col` (stacked) mobile layout,
  `max-width` only caps growth and the box still shrinks to fit — no
  overflow risk, just an inconsistency worth tidying later.
- 6.2 wide-content scroll containment — `DataTable`'s desktop `<table>`
  is wrapped in its own `overflow-x-auto`, confirmed in the component
  itself.
- 6.3 tables — every table-shaped view (`ProductListPage`) uses
  `DataTable`: real `<table>` at `lg+`, stacked `Card` list below.
  `OrderListPage`/`OffersPage` never reach a table at all (no data).
- 6.4 sidebar/drawer — `Sidebar` is `hidden lg:flex`, `MobileTopBar` (with
  the drawer) is present unconditionally but its own trigger row uses
  `lg:hidden`.
- 6.5 sheets — `Sheet.tsx` bottom-sheet classes apply unconditionally,
  drawer classes are `lg:`-gated, same as the user client's component.
- 6.11 `AdminLayout`'s content column has `min-w-0` (confirmed in the
  component), which is exactly what prevents a wide table from forcing
  page-level horizontal scroll.

**Not verified — needs an actual browser pass:** the full route × width ×
theme matrix, 6.6 (exact 44px tap-target compliance — a few sidebar/nav
icon tiles are 38-40px, matching the prototype's own sizing), 6.7 (visual
text-clipping), 6.8 (forms single-column below `lg` — true by construction
in every page built this phase, but not visually confirmed), 6.9 (both
themes side by side), 6.10 (landscape phone), 6.12 (landscape drawer/action
bar). Recommend a manual device/browser pass before shipping.

## Phase 7.2 — accessibility

- **7.2.1 contrast** — fixed proactively in Phase 1 (see the `--k-muted`
  comment in `src/index.css`), same value and same reasoning as the user
  client: light-mode `#767C8C` was ~4.18:1 on white, now `#6B7180` at
  ~4.89:1.
- **7.2.2** — audited for the `<div onClick>` anti-pattern. Every hit is a
  legitimate `aria-hidden` backdrop click-catcher (`Modal`, `Sheet`,
  `MobileTopBar`'s drawer) or a `stopPropagation` wrapper
  (`ProductListPage`'s row-action cluster) — Esc already covers keyboard
  dismissal for the dialogs via `useDialogBehavior`.
- **7.2.3 focus rings** — found and fixed the same class of gap as the
  user client, in two places this time: `OrderListPage` and
  `ProductListPage` both had a custom search bar with `outline-none` on
  the `<input>` and no replacement. Added `focus-within:outline-*` to
  both wrappers, and made `ProductListPage`'s `max-w-[340px]` consistently
  `lg:`-scoped to match `OrderListPage` (was unscoped, though not an
  actual overflow risk per the Phase 6 audit).
- **7.2.4 DataTable** — already real `<table>`/`<thead>`/`<th scope="col">`
  from Phase 2.
- **7.2.5 dialog semantics** — already correct from Phase 2 via
  `useDialogBehavior`, shared by `Sheet`, `Modal`, and `MobileTopBar`'s
  drawer.
- **7.2.6 sidebar** — `SidebarNavLinks`' `<nav aria-label="Admin">`;
  `aria-current="page"` comes free from react-router's `NavLink`.
- **7.2.7 Switch** — `role="switch" aria-checked`, used live in `Sidebar`
  (theme toggle) and `OffersPage` ("Active immediately").
- **7.2.8 ConfirmDialog** — focuses `Modal`'s own close button first (the
  first focusable element in the DOM), which is exactly as safe as
  focusing a dedicated Cancel button — never the destructive action.
- **7.2.9 BarChart accessible fallback** — already built in Phase 2: an
  `aria-label` summary plus a visually-hidden `<table>` of the values.
- **7.2.10 keyboard-only pass** — needs a live browser; not performed in
  this session for the same reason as Phase 6.

## Post-Phase-7 follow-up — wire up MobileActionBar

`layout/MobileActionBar.tsx` was built in Phase 3 but never actually used
by any page — every page kept its primary action in the `PageHeader`
instead, reachable but not thumb-pinned on mobile. Wired it into the six
pages the plan named it for:

- `DashboardPage` — Products / New product.
- `ProductListPage` — New product.
- `AddProductPage` — Publish (submits via `form="add-product-form"` so the
  fixed-position action bar's button still participates in the page's
  `<form>`; `Save draft` stays out, no draft-status field exists).
- `EditProductPage` — Save changes (same `form` attribute pattern); Delete
  stays in the page body, not the action bar, so it can't be hit by
  accident from a thumb-reachable position.
- `ProductDetailsPage` — Edit; Delete likewise stays in the page body.
- `ShippingConfigPage` — Update/Create configuration.

Each page's header/in-form action button is now `hidden lg:inline-flex`
(desktop only) with the `MobileActionBar` copy taking over below `lg`,
and each page's `Container` got `pb-28 lg:pb-8` so content clears the
fixed bar. Confirmed the `form`-attribute submit pattern actually works:
`Button` already spreads native `ButtonHTMLAttributes`, so `form="..."` on
a button rendered outside its `<form>` in the DOM still submits it — no
component change needed.
