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
- **4.1.7 low-stock panel** — built in a post-Phase-7 follow-up (see
  below), replacing the "Next Actions" tips panel. The **quick add-product
  form** half stays out deliberately: `/products/new` (`AddProductPage`)
  is a complete, fully-built form already one click away — a shortened
  duplicate inline on the dashboard would be redundant, not a genuine
  convenience, and risks drifting out of sync with the real form.
- **4.1.11/4.1.13/4.1.14 mobile-specific revenue-chart/orders-table/quick-form
  treatments** — not applicable, since none of those desktop elements were
  built to begin with.
- **4.1.15 "+New product" in MobileActionBar** — built in the "wire up
  MobileActionBar" post-Phase-7 follow-up further down; this paragraph
  is the original Phase-4-pass state, kept as the historical record of
  what wasn't true yet.

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
backend — still true). **4.2.7 pagination** and **4.2.11 MobileActionBar**
were both built in later post-Phase-7 follow-ups (see further down) —
this paragraph is the original Phase-4-pass state, kept as the
historical record of what wasn't true yet.

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

**Not built:** a "Save draft" action — still correct, `create-product`
has no draft-status field, confirmed by reading the controller — per-
field inline validation (4.3.7, still open), and per-file (vs.
aggregate) upload progress bars. **Corrected since this original pass:**
an active/inactive `Switch` on create *is* now built (`create-product`
has no `isActive` field, but a real follow-up `PATCH edit-product-status`
call after creation achieves the same outcome — see the "AddProductPage
Status panel" follow-up), and the mobile thumbnail rail + `MobileActionBar`
for Publish were both also built later — see the "wire up MobileActionBar"
and "AddProductPage mobile refinements" follow-ups further down.

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
(no per-product offers-lookup endpoint verified from this page — still
true) and a "Preview in store" link (no confirmed public storefront base
URL exposed to this app — still true). **Corrected since this original
pass:** a `MobileActionBar` for Edit was built in the "wire up
MobileActionBar" follow-up further down.

### 4.6 OrderListPage

Kept the page's existing honest stance — "Order management API routes
coming soon" — since the seller routes (`product_selling_app_server/src/routes/seller.routes/`)
have no order-listing endpoint at all. Restyled the shell: `PageHeader`,
`EmptyState`, and `Badge`+`statusTone` for the status-legend row (using
the **real** backend order-status enum from `order.model.ts` —
`CREATED/CONFIRMED/SHIPPED/OUT FOR DELIVERY/DELIVERED/CANCELLED` —
replacing the page's previous invented
`pending/processing/shipped/delivered/cancelled` set that didn't match
the schema).

The `DataTable` (4.6.3), row-click detail `Sheet` (4.6.5), date-range
filter (4.6.6), and the mobile card-list equivalents (4.6.8-4.6.11) are
not built — there is no order data to populate them with, and a table
that always renders its own empty state would just be this page's
`EmptyState` with extra steps.

**Post-Phase-7 correction:** an earlier version of this page also shipped
a search `Input` and a `Chip`-based status-filter rail above the
`EmptyState` — both updated real local state (`search`/`activeStatus`)
but had zero effect on what rendered, since the `EmptyState` shows
unconditionally regardless of either. That's the exact "dead control"
anti-pattern the paragraph above correctly reasoned about for the
`DataTable`, just not applied consistently to the search/filter UI sitting
right next to it — a seller could type a search term or tap a status
chip and get no indication their input did anything. Removed both;
kept only the non-interactive status-badge legend, now showing all six
real statuses instead of an arbitrary four.

### 4.7 ShippingConfigPage

Implemented: restyled on `Panel`/`Input`/`Button`/`Skeleton`, rate rows as
bordered tiles with a hover state. Kept the existing single-column,
whole-form-save UX (all five rate zones always editable, one Save action)
rather than the plan's inline-edit-per-row pattern — this backend's
shipping config is one document with five **fixed** rate keys
(`sameCity/sameState/sameRegion/restOfIndia/remote`), not an addable/
removable list, so "+ Add rate" (4.7.5) doesn't map onto the real data
model. A free-shipping threshold field (4.7.6) doesn't exist in the
schema either. Both of those two are still correctly blocked.

**Everything else in this original paragraph was corrected in later
follow-ups** (see "ShippingConfigPage header + layout" and
"ShippingConfigPage per-row inline edit" further down): the two-column
origin/rates desktop layout, a real-data `PageHeader` subtitle, moving
Save into the page header, a `MobileActionBar`, and — reversing this
pass's own claim — per-row inline-edit-then-Save (4.7.4/4.7.9) turned
out to map onto the real data model just fine, since
`updateShippingConfig` deep-merges a single rate key rather than
requiring the whole `shippingRates` object.

### 4.8 OffersPage

**Root cause for most of this section's gaps:** the seller offer routes
(`product_selling_app_server/src/routes/seller.routes/offerManagement.routes.ts`)
expose exactly one endpoint — `POST /create-offer`. There is no list, get,
update, delete, or enable/disable endpoint. This page was always a
create-only form, never a list+CRUD screen, so the plan's grid-of-offer-
cards / Modal edit / delete-with-Switch / status filter chips
(4.8.2/4.8.4/4.8.7, and their nested-modal mobile equivalents
4.8.10/4.8.11) genuinely have no data to work against and stay unbuilt.

**Corrected since this original pass** — turned out some items in this
same numeric range didn't actually depend on the missing list/CRUD
endpoints, since they're about the create-form's own UI, not about
listing existing offers: **4.8.3** now shows a session-scoped grid of
just-created offers (not a persisted list, but real `Card`s from real
POST responses); **4.8.6** got a real searchable product-target picker
(see below — this was mistakenly attributed to the offer-listing gap
originally); **4.8.9** (mobile `grid-cols-1`) and **4.8.12**
(`MobileActionBar`) are just responsive/layout details of the create
form itself and were always independently buildable. See the relevant
follow-ups further down for each.

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

**Not built (genuine consequences of the missing list/edit endpoints):**
everything Modal/Sheet/grid-of-existing-offers related above (4.8.2/
4.8.4/4.8.7/4.8.10/4.8.11). The target-product picker claim originally
here was a mistake — `/products/get-all-products` was never blocked by
the offer-listing gap; it's the same endpoint `ProductListPage` already
uses, and a real searchable picker was built later (4.8.6, see further
down) using exactly that.

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


## Post-Phase-7 follow-up — Dashboard low-stock panel

Replaced the static "Next Actions" tips panel with a real **Low stock**
panel, computed from the same `products` array the dashboard already
fetches (`limit: 6`, so honestly scoped as "among your N most recent
products," not the full catalog — building a true full-catalog scan would
need a separate, larger fetch this pass didn't add). Flattens each
product's variants, filters `stock <= 5`, and renders up to 4 rows with a
thumbnail, product name, SKU, and a `{n} left` `Badge`. Shows a skeleton
while loading and an honest "nothing low on stock" message when the list
is empty — never a fabricated count.

## Post-Phase-7 follow-up — ProductListPage pagination (4.2.7)

`ProductListPage` previously fetched a flat `limit: 50` with no page
controls. The seller `/products/get-all-products` endpoint already
supports `page`/`limit`/`total` (confirmed in
`product.controller.ts`), so switched to `limit: 10` with real
`page` state and `outline` Previous/Next `Button`s + `Page {n} of {m}`,
matching the storefront's `ProductListPage` pattern exactly.

Two honesty-driven side effects worth noting:
- The `PageHeader` subtitle changed from `{n} products · {m} active` to
  `{total} products`. The endpoint has no `isActive` filter param, so an
  "active" count can only ever reflect the currently-fetched page — with
  a 50-item page that was a reasonable approximation for most sellers,
  but shrinking to a 10-item page would make it visibly wrong. Dropping
  it is more honest than downsizing its accuracy.
- The `All/Active/Inactive` status `Chip`s (4.2.2) still filter only the
  current page's fetched products, same limitation as before — now
  called out explicitly in a code comment since it's more noticeable at
  a 10-item page size.

## Post-Phase-7 follow-up — ShippingConfigPage header + layout (4.7.1/4.7.2/4.7.7)

Replaced the page's bespoke header markup with the shared `PageHeader`
component (every other admin page already uses it), with a dynamic
subtitle showing the configured origin city/state once set. Moved the
desktop Save button into `PageHeader`'s actions via the `form="shipping-
config-form"` attribute pattern already used for `MobileActionBar`, and
switched the form body to the spec's two-column layout (`Origin` Panel
`flex-[1.2]` left, `Rates` Panel right, `lg:grid-cols-[1.2fr_1fr]`) —
stacked on mobile as before.

Left `4.7.5`/`4.7.6` (add/remove rate zones, free-shipping threshold)
deferred: `sellerShipping.model.ts` hard-codes exactly five rate zones
with no threshold field and no add/remove support — a genuine backend
blocker confirmed by reading the model.

**`4.7.4`/`4.7.8` built in a later post-Phase-7 follow-up** (see further
down): the rate rows now do the view/edit-toggle flow the spec asks
for, since `updateShippingConfig` deep-merges a single rate key rather
than requiring the whole `shippingRates` object (confirmed by reading
the controller), so each row can save independently. `4.7.9` (mobile
Sheet) stays out — the edit-mode row's two `Input`s already collapse to
a single stacked column below `sm` via the same grid the rest of the
app uses, which reasonably addresses the "too cramped at 375px" concern
without the added complexity of a second edit surface.

## Post-Phase-7 follow-up — tap-target audit + DataTable rule ticks (1.5.3, 1.5.4, 1.5.5, 6.6)

Two items were already fully satisfied by earlier work and just hadn't
been ticked: **1.5.3** (the table rule) is exactly what
`src/components/ui/DataTable.tsx` already implements — real `<table>`
in a `rounded-panel border overflow-hidden` shell with its own
`overflow-x-auto`, `mobileCard` render prop, used by products/offers/
dashboard low-stock. **1.5.5** (no page-level horizontal scroll) is the
same rule Phase 6's `6.1` already verified.

For **1.5.4**/**6.6** (44×44px tap targets), the same class-name audit
as the storefront found two sub-44px icon-only buttons: the staged
product-image remove (`FiTrash2`) buttons on `AddProductPage.tsx` and
`EditProductPage.tsx`, both 28px visible circles in a tight
`grid-cols-3 gap-2.5` thumbnail grid. Fixed with the same invisible
`before:absolute before:-inset-2` hit-area expansion used on the
storefront — the visible circle and grid layout are unchanged, only the
actual clickable box grows to 44px+.

## Post-Phase-7 follow-up — text-overflow audit (6.7)

Code-audited the one page using `DataTable` (`ProductListPage`) plus
`Sidebar`'s account card. Both the desktop table cells and the
`mobileCard` render prop already use `truncate` on product name/SKU/
category; the sidebar seller name/store-name already uses `truncate`.
No untruncated long-text cell found — checked off with no code change.

## Post-Phase-7 follow-up — session-scoped created-offers grid (4.8.3, partial)

The seller API still only exposes `POST /create-offer` — no list/get/
update/delete — so a true persisted offer list stays out of reach. As a
middle ground, `OffersPage` now tracks offers created in the current
browser session (in local component state, populated from the same
payload just POSTed successfully) and renders them as real `Card`s in a
`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` grid, per 4.8.3's spec: name,
a discount-value `Badge tone="ink"` (`−10%`, `₹500 off`, `₹50 cashback`,
`Buy 2 Get 1`, `Bundle @ ₹999` depending on offer type), a mono validity-
window line, a target-count summary, and a status `Badge`
(Active/Scheduled/Expired) derived from the validity dates exactly as
the spec describes. A caption above the grid is explicit that this is
"created this session," not a persisted list, so it can't be confused
with real listing data — refreshing the page clears it, same as before.

4.8.3 stays unticked (it still can't show offers created in a previous
session or by anyone else) and 4.8.2/4.8.4/4.8.7/4.8.10-4.8.12
(extracting `OfferForm`, edit/delete/enable-disable, filter chips, mobile
`Sheet` form) remain deferred for the same reason as before — no
endpoints to back edit/delete/list-filtering. (4.8.6, the target picker,
was completed in a later follow-up — see further down.)

## Post-Phase-7 follow-up — dashboard stock-data bug fix + real Restock action

Found a real bug while investigating another endpoint: `GET
/products/get-all-products` (used by `DashboardPage`) does **not**
return a `variants` array at all — it only flattens the *first*
variant's `sku`/`price` onto the product object (confirmed by reading
`getAllProducts` in `product.controller.ts`). The dashboard's "STOCK
UNITS" `StatCard` and the "Low stock" panel both read
`product.variants[].stock`, so both were silently always computing 0 /
empty — the low-stock panel never had real data to show, regardless of
actual inventory. This was a genuine defect from earlier this session's
low-stock panel work, not a documented limitation.

Fixed by fetching each recent product's full detail
(`GET /products/get-product/:id`, which *does* return real variants with
stock — confirmed the same way) in parallel via `Promise.allSettled`
after the initial list loads, merging the results in. A failed detail
fetch just leaves that one product without variants rather than failing
the whole dashboard.

While in there: found `PATCH /products/increase-stock/:productId` (body
`{ variantId, addedStock }`) sitting completely unused — not called
anywhere in this frontend. Wired a real "Restock" button onto each
low-stock row, opening a `Modal` with a units-to-add `Input`; on success
the local `products` state updates from the response's returned stock
figure so the panel reflects the new count immediately, no full reload.

## Post-Phase-7 follow-up — real per-variant management on ProductDetailsPage

Kept finding real, working seller endpoints with zero frontend usage:
`PATCH /products/edit-variant-price/:productId` (body `{ variantId, price
}`) and `PATCH /products/edit-variant-status/:productId` (body
`{ variantId, status }`) — confirmed by reading `product.controller.ts`.
`EditProductPage`'s `PUT /edit-product/:id` only ever touches
name/description/category/images, never variants, so there was
previously **no way at all** to change an existing variant's price or
active status, or add stock, after initial product creation — only
`AddProductPage` could set them, once, at creation time.

Added a "Manage" action (settings icon on desktop table rows, a full-
width button on mobile cards) on `ProductDetailsPage`'s existing
Variants panel, opening a `Modal` with a price `Input`, an "Add stock"
`Input` (additive, matching `increase-stock`'s actual semantics — not a
replace), and an Active `Switch`. On save, only the fields that actually
changed are sent (each via its own real endpoint, in parallel via
`Promise.allSettled` so one failing doesn't block the others), then the
product is refetched so the table reflects the authoritative saved
state rather than an optimistic guess.

## Post-Phase-7 follow-up — real "Add variant" action on ProductDetailsPage

One more genuinely unused endpoint: `POST /products/add-variant/:productId`
(body `{ attributes, price, stock }`) — `AddProductPage.tsx` has a local
`addVariant()` helper, but it only appends a row to in-memory form state
before the initial `create-product` submit; it never calls this route.
Once a product existed, there was no way to add a new size/color
combination to it later — only what was chosen at creation time, forever
(short of deleting and recreating the whole product).

Added an "Add variant" button to `ProductDetailsPage`'s Variants panel
header, opening a `Modal` with two option `Input`s labelled from the
product's existing `variantTypes` (e.g. `Size`/`Color` — these are fixed
per-product, matching how `AddProductPage` establishes them) plus price
and stock. Builds the same `{ [variantTypes[0]]: optionOne, ... }`
attributes shape `AddProductPage` already uses, so the payload matches
what the backend expects; refetches the product on success so the new
row appears in the table immediately.

## Post-Phase-7 follow-up — tap-target fix on today's new buttons

Re-applied the 1.5.4/6.6 tap-target audit to everything added in this
session's follow-up work (the earlier audit predated these): the
variant "Manage" settings-icon button and mobile "Manage" button on
`ProductDetailsPage`, and the dashboard's "Restock" button, were all
custom pill/icon buttons under 44px. Fixed the same way as the earlier
audit — an invisible `before:absolute before:-inset-2` hit-area
expansion, sized to stay within each button's actual surrounding
padding/gap so it can't swallow a neighboring control's hit area.

## Post-Phase-7 follow-up — real product target picker on OffersPage (4.8.6, partial)

Replaced the free-text, comma-separated product-ID `Textarea` (error-
prone — a seller had to know and correctly type raw Mongo ObjectIds)
with a real searchable picker: a debounced search box hitting the same
`/products/get-all-products` endpoint `ProductListPage` already uses,
a checkbox list of results, and selected products rendered as removable
`Chip`s above the list — matching 4.8.6's spec. The submitted payload
shape is unchanged (`appliesTo: { productIds: [...] }`), and submission
is now blocked with a real validation message if nothing is selected
(the old `Textarea`'s native `required` no longer applies to a checkbox
list).

**Variant narrowing built in a later post-Phase-7 follow-up** (see
further down) — completing 4.8.6, now ticked.

Also: the row-height of the search-results checkbox list is a dense,
scrollable multi-select list, not a primary action control — its rows
run under the usual 44px tap-target guideline the same way a native
OS settings list's rows commonly do. Not treated as a 1.5.4/6.6
violation for that reason.

## Post-Phase-7 follow-up — ShippingConfigPage per-row inline edit (4.7.4, 4.7.8)

Reconsidered this deferral: `updateShippingConfig`'s controller deep-
merges one rate key at a time (`if (shippingRates.sameCity) config.
shippingRates.sameCity = { ...current, ...shippingRates.sameCity }`,
same for each zone) — so a per-row save was always backend-safe, not
just a frontend risk as previously assessed.

Once a config exists (`hasConfig`), each rate row now renders as a
clickable view row (name, delivery time muted below, cost
`font-extrabold text-accent`) that switches into the spec's inline
edit mode on click — two `Input`s (cost, time) plus `Save`/`Cancel`
`outline` `Button`s — and PUTs only that one rate key via
`shippingRates: { [key]: { cost, time } }`, updating local state from
the confirmed response rather than assuming success. Before a config
exists, all rows stay part of the single initial create-config submit,
since there's nothing to PUT to yet. The view row also now stacks cost
below the name below `sm` (4.7.8) instead of staying right-aligned.

## Post-Phase-7 follow-up — variant narrowing completes the target picker (4.8.6)

Completed the deferred half of 4.8.6: each selected product in the
search-results list gets a "Variants" toggle that fetches and expands
that product's variants (`GET /products/get-product/:id`, the same
detail endpoint used elsewhere) into a checkbox list nested under the
row. Checked variants across any expanded products are collected into
`appliesTo.variantIds`; omitted entirely when nothing's checked, so the
default "all variants" behavior is unchanged unless the seller
deliberately narrows down.

Interpretation choice: the expand toggle only appears once a product is
already checked/selected — narrowing a product's variants before the
product itself is targeted would leave checkboxes that don't do
anything yet, which felt more confusing than useful. Deselecting a
product also clears any variant-level selections scoped to it, so a
stale `variantIds` entry can't outlive its parent product's selection.
Created-offer cards' target summary now reads "{n} variants" instead of
"{n} products (all variants)" when narrowing was used.

## Post-Phase-7 follow-up — AddProductPage Status panel + PageHeader (4.3.1 partial, 4.3.6)

`createProduct` has no `isActive` field at all — confirmed by reading
the controller — so a new product is always created active; there was
previously no way to create one inactive without a separate manual step
afterward. Added a Status `Panel` with an Active `Switch` (4.3.6): when
off, a real follow-up `PATCH /products/edit-product-status/:id` call
fires right after creation succeeds — two genuine requests composing a
"create inactive" outcome, not a fabricated draft flag. If that second
call fails, the product itself still exists (created successfully) and
the seller is told to flip the status from the product list instead of
losing their work.

Also switched the page's bespoke `<h1>` header to the shared
`PageHeader` (title, subtitle, the desktop `Publish` action moved into
`PageHeader`'s actions via `form="add-product-form"`, matching the
pattern already used on `ShippingConfigPage`/`OffersPage`), with the
back-to-products link kept above it. **4.3.1 stays partial/unticked**:
its spec also wants an `outline` "Save draft" button beside `Publish` —
since there's no backend draft concept (the same `create-product` call
would just create the same live product either way), a "Save draft"
button would be indistinguishable from "Publish" and thus a misleading
control. Not built.

## Post-Phase-7 follow-up — EditProductPage PageHeader (4.4.2)

Same conversion as `AddProductPage`: swapped the bespoke `<h1>` block
for the shared `PageHeader`, with `Save changes` moved into its actions
via `form="edit-product-form"`. Subtitle shows the live product name
(falling back to a plain description while it's still loading) plus
the product's mono id, per spec. `PageHeader`'s `subtitle` prop type
widened from `string` to `ReactNode` to allow the mixed plain-text +
`font-mono` styling — backward compatible, every other page's plain-
string subtitle still works unchanged.

## Post-Phase-7 follow-up — EditProductPage unsaved-changes guard (4.4.5)

`isDirty` is derived by comparing current form state against a snapshot
captured once when the product loads (state, not a ref — the React
Compiler's `react-hooks/refs` rule correctly flagged an initial `useRef`
version of this: reading `ref.current` during render isn't safe since
ref mutations don't trigger re-renders, so a value used in render needs
to live in real state).

Two real guards, both scoped by what this app's router actually
supports:
- A `beforeunload` listener blocks browser-level navigation (refresh,
  close tab, typed URL) while dirty — works regardless of router mode.
- The "Product details" back link is intercepted with `preventDefault`
  and a `ConfirmDialog` ("Discard unsaved changes?") when dirty, rather
  than a raw `window.confirm`.

**Scoped out:** react-router's `useBlocker` — the idiomatic way to
intercept *all* in-app `Link`/programmatic navigation — only works with
the data-router APIs (`createBrowserRouter`), and this app still uses
`<BrowserRouter>` declarative mode (`App.tsx`). Switching the whole
app's router setup is a bigger, riskier change than one page's guard
justifies, so only the one known exit point (the back link) got an
explicit intercept; other in-app navigation (e.g. the sidebar) isn't
covered.

## Post-Phase-7 follow-up — OffersPage MobileActionBar + tick 4.8.9

`Create offer` was previously a normal fullWidth `Button` at the very
bottom of a genuinely long form (offer type, details, target picker,
type-specific config) — reachable only after scrolling all the way
down. Gave the `<form>` an id and wired the standard
`MobileActionBar` pattern already used on every other admin form page
(Dashboard, ProductListPage, ShippingConfigPage, Add/EditProductPage),
with the desktop button now `hidden lg:inline-flex`.

Also ticked **4.8.9** (offer grid → `grid-cols-1` on mobile) — already
true from the earlier target-picker follow-up's
`grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`, just never checked off.

## Post-Phase-7 follow-up — AddProductPage mobile refinements (4.3.11, 4.3.12) + a tick correction (4.3.13)

**Correction:** un-ticked **4.3.13** (`Save draft`/`Publish` in
`MobileActionBar`). Checked the actual `MobileActionBar` content —
it only ever had `Publish`; there is no `Save draft` ghost button next
to it, for the same reason `4.3.1`'s desktop header doesn't have one
either (no backend draft concept — see the earlier `4.3.1`/`4.3.6`
follow-up). The item as written needs both buttons; only one is real,
so it wasn't accurately tickable.

**4.3.11**: staged thumbnails now render as a `flex gap-2 overflow-x-
auto no-scrollbar` rail of `72×72` tiles below `lg` (dropping the
filename caption at that size — too cramped to read on a 72px tile),
falling back to the existing `grid-cols-2` 96×96 layout at `lg+`
(4.3.4).

**4.3.12**: variant rows now use an explicit `grid-cols-2` base
(previously implicit single-column, which happened to already avoid
the "four-across squeeze" the spec worried about, but wasn't the
"two-up" layout it actually asks for) — option-1/option-2/price/stock
form a 2×2 grid, with the remove button spanning the full row below
(gaining a "Remove variant" text label at that size, icon-only again at
`md+` matching the original desktop treatment) rather than being an
odd fifth grid cell.

## Post-Phase-7 follow-up — ProductDetailsPage header + Metadata panel (4.5.2/4.5.3, partial)

Two safe, additive pieces of 4.5.2/4.5.3, without touching the page's
overall column layout (see below for why the full composition stays
out):

- Category now renders as a mono uppercase eyebrow above the name
  (matching the storefront PDP convention), and the name itself scales
  up to the spec's `text-[34px]` at `lg+` (kept smaller on mobile,
  consistent with how every other page in this app scales headings
  down for small widths — the spec doesn't call out a separate mobile
  size).
- Metadata (id, created/updated timestamps) is now its own `Panel`
  instead of being appended inside the Description `Panel`.

**Still not built:** the discount `Badge tone="ink"` in the price row
(4.5.2) — the seller `getProductById` response has no offer/discount
data on it at all (confirmed by re-reading the controller earlier this
session; only the *user-facing* product endpoints compute
`activeOffer`), so there's nothing to derive a discount tag from here.
An "Offers" panel (4.5.3) is blocked the same way `OffersPage` itself
is — no endpoint to list offers targeting a given product.

**4.5.1 (thumbnail column + full-bleed hero + fixed `w-[340px]` info
column, matching the storefront PDP composition) and 4.5.6 (mobile
gallery with a dot pager) stay deferred** — that's a real visual
layout rewrite of a page with several working, tested features built
this session (variant management, add-variant), and there's no browser
available to verify a layout overhaul didn't regress any of it.

## Post-Phase-7 follow-up — one more missed tap target on EditProductPage

Re-swept both apps for the `h-7 w-7` remove-button pattern the earlier
1.5.4/6.6 audits fixed, and found one that was missed: the "Current
Images" grid's mark-for-removal toggle button (28px, no hit-area
expansion) — its sibling on the same page ("New Images to Upload") had
already been fixed, but this one was overlooked. Applied the same
`before:absolute before:-inset-2` fix. Re-checked every other `h-7 w-7`/
`h-8 w-8`/`h-9 w-9` button in both apps afterward; nothing else missing.

## Post-Phase-7 follow-up — inline validation error on AddProductPage (4.3.7)

The only pre-submit validation check with no native HTML equivalent is
"at least one product image" — a custom `FileDrop` dropzone can't carry
a `required` attribute the way a text `Input` can, so it was a toast-
only check. Added an `error` prop to the shared `FileDrop` primitive
(red border, `aria-invalid`, matching `Input`'s own error styling) and
an inline error line below it, replacing the toast for this specific
check — set on a failed submit attempt, cleared as soon as an image is
added. The two `required` text `Input`s (name/category/description,
etc.) already get real inline feedback from the browser's native
validation, and backend request failures still surface via the
submit-level toast, per the spec's own instruction to keep that.

## Post-Phase-7 follow-up — status filter chips on the created-offers grid (4.8.7)

Added the spec's `All`/`Active`/`Scheduled`/`Expired` `Chip` filter rail
above the created-offers grid. This is a genuine filter over real data —
`getOfferStatus` already derives a real status per offer from its
validity dates — just scoped to the same session-created set as the
grid itself (still no listing endpoint to filter a true full catalog
with). Shows an honest "No {status} offers created this session"
message rather than an empty grid when a filter matches nothing.

## Post-Phase-7 follow-up — Chip aria-pressed

The shared `Chip` primitive's `selected` prop drove visual state only —
no ARIA state, so a screen reader had no way to know which chip in a
filter/selection row was active. Added `aria-pressed={selected}` to the
component itself, so every existing and future `Chip` usage (status
filters, category rails, discount-type selectors, offer-type cards)
picks it up for free. An explicit `aria-pressed`/`aria-selected` passed
at a call site still overrides it (prop spread order).

## Post-Phase-7 follow-up — top-level ErrorBoundary

Same fix as the user client: neither app had a React error boundary, so
an unhandled render error anywhere would white-screen the whole app.
Added `src/components/ErrorBoundary.tsx` wrapping `<Routes>` inside
`<Router>` (kept outside `ToastContainer`), with a themed fallback and a
"Reload page" button. Not a Kartly-plan item — cross-cutting robustness
hardening, same spirit as the earlier tap-target/dead-controls audits.

## Post-Phase-7 follow-up — guard localStorage reads at the two real choke points

`localStorage` can throw (privacy-mode storage blocking, some corporate
browser policies). Unlike the user client, this app funnels auth through
exactly two places, so both got a real fix rather than scattered
per-page guards:

- `sellerApi.ts`'s request interceptor — an unguarded throw here would
  have failed every single API call app-wide. Falls through to an
  unauthenticated request instead.
- `RequireSellerAuth.tsx` — the one shared route guard for every admin
  page. An unguarded throw here (during render) would hit the new
  `ErrorBoundary`'s generic fallback; now it's treated the same as "not
  logged in" and redirects to `/login`, a more specific and more useful
  outcome for this exact failure mode.

## Post-Phase-7 follow-up — global 401 handling (expired/invalid token)

Same gap as the user client: no response interceptor existed, so an
expired/invalid `sellerToken` just meant every page's own fetch failed
with a generic "unable to load" toast, no path back except manually
visiting `/login`. Added a response interceptor on `sellerApi` that, on
a `401`, clears the token and redirects to `/login` — guarded the same
way: only when a token was actually present, and only when not already
on `/login`/`/signup`, so it can't loop or clobber a real invalid-OTP
error on those pages. `RequireSellerAuth` already redirects on page
*load* when there's no token; this covers the case where the token goes
stale *during* a session, mid-page.

## Post-Phase-7 follow-up — request timeout

Same fix as the user client: `sellerApi` had no timeout configured, so a
dropped connection left a page's loading spinner stuck forever. Added
`timeout: 45000` — generous enough not to interrupt this app's real
Render free-tier cold-start delay. Confirmed the actual Cloudinary file
upload (`cloudinaryApi.ts`) is a separate, untouched `axios.post` call
straight to Cloudinary's own API, not routed through `sellerApi` — this
timeout only covers requests through this instance, so it can't cut off
an in-progress image upload.

## Post-Phase-7 follow-up — same race condition on ProductDetailsPage/EditProductPage

Same real bug as the user client's `ProductDetailPage`: navigating
between products (or between two products' edit forms) before the first
fetch resolved could let a stale response for the *previous* `productId`
overwrite the correct, newer product's data. Added the same `isCurrent`
flag guard to both pages' load effects, checked before every `setState`
in the load path.

## Post-Phase-7 follow-up — same race condition on search-debounced fetches

Same bug class as `ProductDetailsPage`/`EditProductPage`'s fix, on the
two search-debounced fetches: `ProductListPage`'s search/pagination
effect and `OffersPage`'s target-picker search. A debounce only cancels
a still-*pending* timer — two requests can still end up in flight
together if one fires, then the seller types/clicks again before it
resolves, letting a stale response land after a newer one and silently
show wrong results. Added the same `isCurrent` guard to both. Checked
both apps for any other `window.setTimeout`-based debounce and confirmed
these were the only two.

## Post-Phase-7 follow-up — explicit double-submit guards

Every submit/save handler already disabled its trigger button while a
request was in flight, but only via the `disabled` attribute — which
takes effect on React's *next* render, not synchronously. A fast
double-click (or a double Enter-key press) could still fire the handler
twice before that re-render lands. Added an explicit `if (isX) return;`
as the first real line of every handler across the app (`submitOffer`,
`submitProduct`, `saveProduct`, `saveConfig`, `saveRate`, `saveVariant`,
`submitAddVariant`, `submitRestock`, `submitLogin`, `submitSignUp`) —
belt-and-suspenders on top of the disabled attribute, not a replacement
for it (the attribute still matters for the visual/keyboard-focus state).

## Post-Phase-7 follow-up — object-URL leak in staged product image previews (4.3.7, 4.4.x)

Both `AddProductPage.tsx` and `EditProductPage.tsx` call
`URL.createObjectURL(file)` per staged image to build the `FileDrop`
preview grid, and paired it with a revoke only when a single image was
individually removed — never on unmount, so navigating away mid-upload
(back button, or just moving to another page) leaked every still-staged
preview until the tab fully unloaded. Added an unmount-cleanup effect to
both pages that revokes whatever is still staged at that point:

```tsx
const [images, setImages] = useState<SelectedProductImage[]>([]);
const imagesRef = useRef(images);
useEffect(() => {
  imagesRef.current = images;
}, [images]);
useEffect(() => {
  return () => {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  };
}, []);
```

(`EditProductPage.tsx` mirrors this for its `newImages`/`newImagesRef`,
which track only the *newly added* images in that flow — the existing
Cloudinary URLs loaded with the product are ordinary https: URLs, not
blob: ones, so they need no revoke.)

The ref indirection is required, not stylistic: the cleanup closure
captures whatever `images` was on the *first* render if read directly,
so a plain `images.forEach(...)` in the unmount effect would only ever
revoke an empty initial array. Reading `imagesRef.current` at cleanup
time gets the latest value instead. Writing the ref itself has to happen
in its own effect rather than inline during render — assigning
`ref.current` in the render body trips the `react-hooks/refs` lint rule
(refs may only be read/written from effects, event handlers, or other
refs' cleanups, never during render).

## Post-Phase-7 follow-up — ProductListPage pagination left stale after delete

`softDeleteProduct` removed the deleted row from local `products` state
but never touched `total`, and never adjusted `page`. Two consequences:
the pager's "Page X of Y" (computed from `total`) went stale by one
product per delete, and — the concrete bug — deleting the last remaining
product on any page past the first left the seller looking at e.g. "Page
3 of 3" with zero rows showing, since neither `page` nor `total` moved to
reflect that page 3 no longer exists. Fixed by decrementing `total` on
every successful delete, and stepping `page` back by one specifically
when the deleted row was the only one left on a page beyond the first
(captured as `wasLastOnPage` before the state update, from the pre-delete
`products.length`) — which lands the pager on the new-last page and lets
the existing `[search, page]` debounce effect's dependency on `page`
trigger a refetch automatically.

## Known backend gap — orphaned Cloudinary assets on a failed create/edit

Both `AddProductPage.tsx` and `EditProductPage.tsx` upload staged images
straight to Cloudinary (`uploadProductImages`, via the signed
`/products/cloudinary-signature` endpoint) *before* calling
`POST /products/create-product` / `PUT /products/edit-product/:id`. If
that second call fails — network blip, validation error, backend down —
the images are already sitting in Cloudinary with nothing in Mongo
referencing them. This isn't fixable from either client alone: cleaning
up an orphaned asset needs `cloudinary.uploader.destroy`, which requires
the API secret and so can only run server-side, and
`seller.routes/product.routes.ts` exposes no delete-by-`publicId` (or
any other cleanup) endpoint — only the upload signature. Per this
project's stated policy of naming a missing endpoint rather than
fabricating around it: this is that gap. Today a failed save after a
successful upload just surfaces the normal error toast and leaves the
seller free to retry (which re-uploads fresh copies rather than reusing
the orphaned ones, compounding the waste on repeated failures) — there's
no user-facing incorrectness, only unused storage on the Cloudinary
account accumulating silently. Fixing it for real needs a backend
`DELETE /products/cloudinary-asset/:publicId` (or similar) that the
client calls from the create/edit catch block when a save fails after a
successful upload.

## Backend bug found + fixed — editProduct silently dropped new images

While tracing the above gap, found a real one, not just a limitation:
`editProduct` (`product_selling_app_server/src/controllers/seller.controllers/product.controller.ts`)
only ever read `req.files` for new images — it had no equivalent of
`createProduct`'s files-then-`productImagesURL`-fallback. Since
`EditProductPage.tsx` uploads new images directly to Cloudinary and
sends only the resulting URLs (never raw files, by design — see the
"orphaned Cloudinary assets" note above), `req.files` was always empty
for this flow, and the URLs were never read anywhere in the function.
The PUT request still returned 200 and showed "Product updated," but
any new image added during an edit was silently discarded — the
seller had no way to know from the UI, since the request looked
entirely successful. Fixed server-side by mirroring `createProduct`'s
existing files-fallback-to-`productImagesURL` handling; verified with
`npm run build` in the server project. No frontend change was needed —
`EditProductPage.tsx` was already sending the right payload.

## Backend bug found + fixed — createOffer accepted an inverted date range

`createOffer` validated that `validFrom`/`validTill` weren't in the past
but never checked `validTill` was actually after `validFrom` — nor does
the `Offer` Mongoose schema (only `required: true` on each field).
`OffersPage.tsx`'s `getOfferStatus` and the checkout-time offer resolver
(`src/utils/offer.util.ts`'s `findApplicableOffers`) both key off `now`
falling between the two dates, so a seller submitting a reversed range
(e.g. mis-clicking the date pickers) would get a "created successfully"
toast for an offer that could never be active — silently broken, no
error to act on. Added the missing check server-side, and added a
matching `min` on both `OffersPage.tsx` date inputs (`min={today()}` on
Valid From, `min={validFrom || today()}` on Valid Till) so the picker
itself steers a seller away from the invalid range before they ever hit
submit, mirroring how the numeric fields already use `min="0"`.

## Post-Phase-7 follow-up — cap percentage discounts at 100 on OffersPage

`Offer.model.ts`'s config validator only checks that a `DISCOUNT`
offer's `value` is a number — no upper bound, for either `PERCENTAGE` or
`FLAT`. That's correct for `FLAT` (an unbounded rupee amount is fine),
but a `PERCENTAGE` value over 100 has no real meaning; the checkout-time
calculation (`offer.util.ts`'s `calculateBestPrice`) already clamps the
final price at `Math.max(0, ...)`, so this was never a price-goes-negative
bug — just a silent no-op past 100 (a seller who fat-fingers 150 instead
of 15 gets an offer indistinguishable from "100% off," with nothing
telling them their number was ignored). Left the backend model as-is
(the clamp already makes it safe, and `FLAT`'s legitimate unbounded range
shares the same `value` field) and added `max="100"` to the discount
value input, but only while `discountType === 'PERCENTAGE'` — switching
to `FLAT` drops the cap back to unbounded, mirroring how the label and
placeholder already branch on `discountType`.

## Backend + frontend bug found + fixed — negative price via Manage Variant

`ProductDetailsPage.tsx`'s "Manage variant" panel is a `Modal`, not a
`<form>` — its Price input carries `type="number" min="0"`, but since
the Save button is a plain `onClick` (not a form submit), that `min`
never actually gets enforced by the browser. `saveVariant` itself only
checked `Number.isFinite(nextPrice)`, not its sign, before sending it to
`PATCH /products/edit-variant-price/:productId` — so typing a negative
number and clicking Save actually persisted a negative price on a live
variant. The backend offered no safety net either:
`editVariantPrice` only checked that `price` was present, not that it
was positive, and used `findOneAndUpdate` (which doesn't run Mongoose
schema validators by default) — and the `Variant` schema itself had no
`min` bound on `price` to begin with. Fixed at every layer: explicit
`nextPrice <= 0` rejection in `saveVariant` (matching the check
`submitAddVariant` already does correctly for this same field a few
lines up — this was a same-file inconsistency, not a new rule), a
matching `price <= 0` rejection in the `editVariantPrice` controller,
and `min` bounds added to the `Variant` schema's `price`/`stock` fields
as defense-in-depth for any other path (`createProduct`, `addVariant`)
that creates a variant directly. Also found and fixed the same class of
gap in `increaseStock`: it validated nothing about `addedStock`, so a
negative value would pass straight through to a `$inc` and silently
*decrease* stock — added the equivalent positive-number check there
too. All three are server-side fixes (see `product_selling_app_server`
commit `15ccfff`); verified with `npm run build` in both the server and
this app.

## Backend fix (cross-repo) — product search 500'd on normal punctuation

Found the most impactful bug of this audit while reviewing the seller
API's search handling: the seller `getAllProducts` (used by this app's
`ProductListPage` search) built its filter as `new RegExp(search, 'i')`
straight from the raw query string — the exact same bug existed on the
user-facing endpoint too. Any search term containing a regex
metacharacter throws a `SyntaxError` there instead of returning
results, and this app's product search is debounced live-as-you-type,
so a seller typing something as ordinary as `"Samsung (Galaxy"` hits an
unbalanced paren mid-keystroke and 500s the request before finishing
the word. Verified the exact crash (`Unterminated group`) before
fixing. Fixed server-side with a shared `escapeRegex()` utility applied
at every `new RegExp(userInput, ...)` call site across both product
search endpoints and the variant attribute filter
(`product_selling_app_server` commit `c4f8ebb`) — no frontend change
needed here either.

## Critical backend fix (cross-repo) — cross-tenant product authorization gaps

The most severe backend findings of this audit. Three seller product
endpoints — `getProductById` (backs `ProductDetailsPage.tsx`'s detail
view), `editProductStatus` (backs `ProductListPage.tsx`'s status
toggle and `AddProductPage.tsx`'s inactive-on-create flip), and
`editVariantStatus` (backs `ProductDetailsPage.tsx`'s Manage Variant
Active switch) — all used a bare `Product.findById(productId)` with no
check that the product belonged to the calling seller, unlike every
other function in that same controller file. The two status-toggle
endpoints are writes: any authenticated seller could activate or
deactivate *any other seller's* product or variant just by knowing (or
enumerating) its ID — including pulling a competitor's listing off the
marketplace entirely. `getProductById` let any seller view a
competitor's full product details, stock, and pricing. Both
status-toggle functions had a commented-out
`// const sellerId = req.seller._id;` line, suggesting the ownership
check existed at some point and was lost. Also found, while fixing
`editVariantStatus`, a separate and unconditionally-broken bug in the
same function: it looked up the variant with
`Variant.findById({ _id: variantId, productId })` — `findById` takes a
single id value, not a filter object, so this nested the whole object
*as* the `_id` condition instead of matching two separate fields.
Verified empirically that the resulting query could never match a real
document, meaning this endpoint 404'd unconditionally regardless of
whether the variant existed — the Manage Variant Active switch's PATCH
call has likely never actually worked. Fixed all of it server-side
(`product_selling_app_server` commit `6fd6d14`), scoping every lookup
to `sellerId: req.seller._id` to match the rest of the file, and
switching the broken variant lookup to `Variant.findOne({ _id:
variantId, productId })`. No frontend change needed — these three
`ProductDetailsPage.tsx`/`ProductListPage.tsx`/`AddProductPage.tsx`
flows were already calling the right endpoints correctly.

## Post-Phase-7 follow-up — no size limit anywhere on product image uploads

Related to, but distinct from, the profile-photo upload gap documented
in the user client's notes: `AddProductPage.tsx`/`EditProductPage.tsx`
upload product images directly from the browser to Cloudinary
(`uploadProductImages` in `cloudinaryApi.ts`), bypassing the backend's
multer path — and therefore its newly-added file-size limit — entirely.
There was no size check anywhere in this flow: not client-side, not
server-side (since the server never sees these bytes), only whatever
limit Cloudinary's own account plan happens to impose, surfaced as
whatever raw error their API returns rather than a friendly,
product-specific one. Added a shared `MAX_IMAGE_SIZE_MB` (10, matching
the server's own limit) and `partitionBySize()` helper to
`cloudinaryApi.ts`, and applied it in both pages' file-selection
handlers (`handleImages`/`handleNewImages`) — oversized files are
filtered out before ever reaching the upload step, with a toast naming
which file(s) were rejected and why, following the same pattern
already used there for the 5-image slot limit.

## Post-Phase-7 follow-up — ImageFrame didn't actually handle a broken image

Same fix as the user client's `ImageFrame.tsx` (same component, ported
independently to both apps). The doc comment claimed it handles a
"broken" image, but the implementation only ever checked `!src`
(absent) — a `src` that's present but fails to load rendered the raw
browser broken-image icon instead. Added an `onError` handler plus a
`failed` flag gating the placeholder branch, with the flag reset done
via React's render-time "adjust state when a prop changes" pattern
(track the `src` `failed` applies to, compare and reset in the render
body on a change) rather than a `useEffect` — this app's
`react-hooks/set-state-in-effect` rule rejects the effect version
outright (hit it directly: `Calling setState() directly within an
effect` error on build), and the render-time version also avoids an
extra render cycle per image switch.

## Post-Phase-7 follow-up — DataTable's clickable rows were keyboard-unreachable

`DataTable`'s `onRowClick` rows had a click handler and nothing else —
no `tabIndex`, `role`, or key handler — so they were entirely
unreachable by keyboard or by a screen reader navigating via Tab. This
is live: `ProductListPage.tsx` uses it as the primary way to navigate
from the list to a product's detail page. Added `role="button"`,
`tabIndex={0}`, an `onKeyDown` handling Enter/Space, and a
focus-visible ring to both the mobile card wrapper and the desktop
`<tr>` (the `<tr>`'s ring uses a negative outline-offset rather than
the usual positive one, so it draws inside the row instead of
overlapping into the tightly-packed row above/below it), gated on
`onRowClick` being provided at all.

## Post-Phase-7 follow-up — removed an orphaned pre-migration Button.tsx

Found while sweeping for the same "clickable element, no keyboard
support" pattern elsewhere: `src/components/Button.tsx`, distinct from
the actively-used `src/components/ui/Button.tsx`. Zero imports
anywhere in the codebase, and still styled with the old pre-Kartly
purple (`#A78BFA`/`#4C1D95` hardcoded hex) instead of the `--k-accent`
tokens — clearly a leftover from before the migration. Deleted rather
than left in place, where it risked misleading a future contributor
into using it and reintroducing the wrong colors. Swept the rest of
`src/` for duplicate-named files or similar leftovers — found none.

## Backend fix (cross-repo) — Min Cart Value offers checked the wrong number

`OffersPage.tsx`'s "Min Cart Value" field on discount offers sets
`minCartValue`, which the backend's `calculateBestPrice` used as a
"spend over this amount" gate — but it checked it against a single
cart item's own price, not the actual cart total, even at checkout
where the real total is available. A shopper's cart split across
several smaller items (e.g. five ₹500 items totalling ₹2500) would
never qualify for a seller's "Min Cart Value ₹2000" offer, since no
single item alone reached ₹2000 — silently defeating the field this
page exposes, for essentially every real cart. Fixed server-side
(`product_selling_app_server` commit `5221b1d`) by threading the real
cart/order subtotal through to the offer-resolution utility from every
call site that has one (cart, checkout, order creation); no frontend
change was needed — this page was already sending the right value,
the backend just wasn't checking it against the right number.

## Significant known gap (cross-repo) — three of four offer types do nothing

Worth its own entry, separate from the `minCartValue` fix above: only
`DISCOUNT`-type offers actually change a price anywhere in the
backend. `BUY_GET`, `CASHBACK`, and `PRODUCT_BUNDLE` — all fully
creatable through this very page's UI, with their own dedicated form
sections and `BundleItem` state — are accepted, validated, saved, and
returned as "applicable" in `offers: [...]` on cart/product responses,
but nothing computes any actual price effect for any of them
(confirmed by grepping the whole backend: the only places these three
types appear at all are the `OFFER_TYPES` enum and the config-shape
validator). A seller building a "Buy 2 Get 1 Free" or "₹50 cashback"
promotion through this page today gets a save confirmation and a real
database record, but a buyer's price never changes because of it —
this isn't a display bug, the underlying calculation genuinely
doesn't exist yet for these three types. Documented in detail at the
source (`product_selling_app_server` commit `9aa4eaa`,
`src/utils/offer.util.ts`) rather than fixed here, since each type
needs materially different logic (identifying a "free" unit within
existing cart lines, a post-purchase credit rather than a
checkout-time price change, detecting a specific item combination and
repricing that group) — a real feature to design and build per type,
not a shared shortcut.

## Post-Phase-7 follow-up — added a 404 page (there was no catch-all route)

Same gap as the user client, same fix. `App.tsx` had no `path="*"`
route — React Router v6's path-less parent routes (`RequireSellerAuth`
and `AdminLayout`'s wrappers here) only match when a nested child's
path matches, not everything by default, so any unmatched URL rendered
completely blank: no sidebar, no message, nothing. Added
`NotFoundPage.tsx` (reuses the existing `EmptyState` primitive) as a
top-level `path="*"` route, outside both `RequireSellerAuth` and
`AdminLayout` so it renders regardless of auth state, with a single
"Back to dashboard" action.

## Post-Phase-7 follow-up — every page now has a real document.title (11/11)

Same gap and fix as the user client. Added
`src/hooks/useDocumentTitle.ts` and called it from all 11 pages,
including `NotFoundPage`. `ProductDetailsPage` uses the loaded
product's name; `EditProductPage` shows "Edit {name}" once loaded;
every other page uses a fixed, page-appropriate title.

## Post-Phase-7 follow-up — added a skip-to-content link (WCAG 2.4.1)

Same gap and fix as the user client. `Sidebar`'s full nav (Overview/
Products/Orders/Shipping/Offers, dark-mode toggle, account card,
logout) repeats identically on every authenticated page — without a
bypass, a keyboard or screen-reader user had to tab through all of it
on every navigation before reaching that page's content. Added a
visually-hidden-until-focused "Skip to content" link as the first
element in `AdminLayout`, pointing at a new `id="main-content"` on
`<main>`.

## Post-Phase-7 follow-up — hamburger toggle missing aria-expanded

`MobileTopBar.tsx`'s hamburger button had `aria-label="Open menu"` but
nothing reflecting whether the drawer it controls was actually open —
a screen reader announced the same "Open menu, button" regardless of
state. Added `aria-expanded={open}`. Swept the user client for the
same pattern (a disclosure toggle button with no state reflected in
its accessible name/attributes) and found one instance there too — see
its own notes.

## Post-Phase-7 follow-up — variant-row inputs relied on placeholder-only text

`AddProductPage.tsx`'s per-variant option/price/stock inputs had no
`aria-label`, only a placeholder — and since a product can have several
variant rows, a screen reader user had no way to tell which row an
unlabeled "Price" or "Stock" field belonged to, or what an unlabeled
option-value field was even for. Added `aria-label` to all four inputs
per row, reusing the same dynamic text already used for the
placeholder (e.g. `${variantTypeOne} value`) plus a `variant ${index +
1}` suffix so each row's fields are distinguishable. Verified (not
changed, already correct) the product/variant checkboxes in
`OffersPage.tsx`'s target picker — both are properly wrapped in
`<label>` elements, giving them implicit accessible names already.

## Post-Phase-7 follow-up — form error messages weren't linked to their fields

`Input.tsx`, `Textarea.tsx`, and `Select.tsx` — the three shared form
primitives every form in this app is built from — each correctly set
`aria-invalid={!!error}` and rendered the error text visually below
the field, but never linked the two with `aria-describedby`. A screen
reader user landing on an invalid field heard that it was invalid, but
not *why* — the error text had no programmatic connection to the
field, only screen proximity. Added an `errorId` (`${fieldId}-error`)
to all three components: the error `<p>` now carries that `id`, and
the field carries `aria-describedby={error ? errorId : undefined}`
pointing at it. Fixes every form across the whole app at once, since
they're all built from these three primitives.

## Post-Phase-7 follow-up — removed an orphaned Toolbar component, kept two others

Swept for other genuinely-unused components after the earlier
`Button.tsx` cleanup and found two more with zero imports anywhere:
`Toolbar.tsx` and `QueueList.tsx`. Deleted `Toolbar.tsx` — a generic
"title left, actions right" row wrapper superseded by `PageHeader`,
which now owns that exact job everywhere, with no tie to any specific
unbuilt feature.

Kept `QueueList.tsx`, on reflection, despite it also having zero
current usage: it's the intended fulfilment-queue widget for
`DashboardPage`, and this file's own 4.1 notes already document that
section as deliberately built as an honest `EmptyState` instead,
*specifically because* there's no seller order/fulfilment endpoint yet
— "an honest EmptyState-based revenue panel and fulfilment-queue
block (no fabricated ... numbers)". That's the same status as
`BarChart.tsx` (the revenue chart's real implementation, also unused
today, also kept) — both are well-built, current-design-system,
ready-to-wire-up components for documented, backend-blocked features,
not abandoned leftovers like `Toolbar.tsx` or the old `Button.tsx`
were. Deleting `QueueList.tsx` while keeping `BarChart.tsx` would have
been an inconsistent call for the same underlying reason, so it stays.
