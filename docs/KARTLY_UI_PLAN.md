# Kartly Design System — Seller Admin Implementation Plan

> **Target app:** `product_selling_app_clinet_admin/` (seller admin dashboard SPA, React 19 + Vite + Tailwind v4, dev port 5203)
> **Design source of truth:** `kartly-ecommerce-template-kit/project/Kartly Commerce Kit.dc.html` — the **Admin** tab (lines 706–818) plus the **Components** tab (lines 820–1045)
> **Companion plan:** `product_selling_app_client_user/doc/KARTLY_UI_PLAN.md`
> **Note on the folder name:** `clinet` is an intentional existing typo. Do not "fix" it in any path.

## How to use this document

- Every actionable item is a checkbox. Tick it (`- [x]`) **in this file** as you complete it — this file is the traceability record.
- Phases are ordered by dependency. Phase 4 pages may be done in any order once Phases 1–3 are complete.
- Every task names the **exact file path** it touches. If a path does not exist, the task creates it.
- Each page task has a **Mobile** and a **Desktop** sub-checklist. Both must be ticked before the page counts as done. An admin dashboard that only works at 1280px is not done.
- `DESIGN REF` lines point at line ranges in the `.dc.html` prototype. Match the visual output; do **not** copy the prototype's inline-style structure into React.

## Shared with the storefront

Phases 1 and 2 below are **the same token layer and the same primitives** as the user client plan. The two apps are separate npm projects with no shared package, so the code is duplicated by necessity — but the values must stay byte-identical. Where a task says *"identical to the storefront"*, copy the file across rather than re-deriving it.

## Progress summary

| Phase | Title | Items | Status |
|---|---|---|---|
| 0 | Audit & prerequisites | 6 | ✅ |
| 1 | Design foundation (tokens, motion, theme) | 29 | ☐ |
| 2 | Primitive component library | 30 | ✅ |
| 3 | Admin shell (sidebar, topbar, mobile nav) | 20 | ✅ |
| 4 | Page migrations | 96 | ☐ |
| 5 | Motion & interaction pass | 13 | ☐ |
| 6 | Responsive QA matrix | 12 | ☐ |
| 7 | Cleanup, a11y & verification | 25 | ☐ |

---

# Phase 0 — Audit & prerequisites

## 0.1 Blocking finding: the Tailwind config is dead code

This app runs **Tailwind CSS v4** through `@tailwindcss/vite` (`package.json` → `@tailwindcss/vite: ^4.2.4`), and `src/index.css` contains only `@import "tailwindcss";`. Tailwind v4 does **not** auto-load `tailwind.config.js` — it reads a JS config only when the CSS explicitly does `@config "../tailwind.config.js"`.

Consequence: every `bg-primary`, `text-text`, `bg-secondary`, `text-accent`, `bg-background` class in this codebase resolves to **nothing**. `src/components/Header.tsx`, `MetricCard.tsx`, `Card.tsx` and all ten pages rely on those classes. Only `Button.tsx` renders in purple, because it hardcodes `bg-[#A78BFA]`.

`docs/design_language.md` documents this dead token set as if it were live — that doc is superseded by this plan.

**Decision:** do not revive `tailwind.config.js`. Move the token layer into `@theme` inside `src/index.css` (the v4-native way), and delete the stale config in Phase 7.

- [x] **0.1.1** Confirm the finding: `npm run dev`, open `/dashboard`, inspect a stat-tile icon chip — `bg-secondary text-primary` renders as transparent-on-black, not lavender-on-grey.
- [x] **0.1.2** Inventory every legacy token class:
  ```bash
  cd product_selling_app_clinet_admin
  grep -rnoE "(bg|text|border|from|to|via)-(primary|secondary|accent|background|text)\b" src/ | sort | uniq -c | sort -rn
  ```
  Paste the counts into `docs/KARTLY_MIGRATION_NOTES.md` (create it) as the "before" baseline.

## 0.2 Prerequisites

- [x] **0.2.1** Node deps installed: `cd product_selling_app_clinet_admin && npm install`.
- [x] **0.2.2** `.env` present with `VITE_SERVER_URL` and `VITE_PORT=5203`.
- [x] **0.2.3** Baseline green build before touching anything: `npm run build` and `npm run lint` both succeed. Record the output in `docs/KARTLY_MIGRATION_NOTES.md`.
- [x] **0.2.4** Read the Admin tab of the prototype (`.dc.html` lines 706–818) and the Components tab (820–1045) in full, plus the `renderVals()` block at the bottom of the file — it holds the exact status-badge colour pairs, the bar-chart data shape, and the sidebar nav list.

---

# Phase 1 — Design foundation

**Identical to the storefront plan's Phase 1.** Build it there first, then copy `src/index.css` and `src/theme/` across verbatim. The admin app additionally needs the `kfBar` chart animation, which the storefront does not use.

## 1.1 Typography — Montserrat

- [x] **1.1.1** In `index.html`, add the Google Fonts preconnect + Montserrat stylesheet link (weights `400;500;600;700;800;900`) to `<head>`.
- [x] **1.1.2** Set `<title>` to the seller-admin brand.
- [x] **1.1.3** In `src/index.css`, set `body { font-family: Montserrat, "Helvetica Neue", Helvetica, sans-serif; -webkit-font-smoothing: antialiased; background: var(--k-bg); color: var(--k-ink); }` and zero out `html, body` margin/padding.
- [x] **1.1.4** Register `--font-mono: ui-monospace, SFMono-Regular, Menlo, monospace` in `@theme` — the admin uses mono heavily for SKUs, order IDs, and table column headers.

## 1.2 Colour tokens — `src/index.css`

`DESIGN REF` `.dc.html` lines 19–20.

- [x] **1.2.1** Add the light `--k-*` palette on `:root` (bg `#ECECEE`, card `#FFFFFF`, ink `#171A22`, muted `#767C8C`, edge `#1B1F2A`, line `#E4E4EA`, soft `#F6E8FF`, soft2 `#FAF3FF`, accent `#A87BF5`, onAcc `#FFFFFF`, shadow `0 24px 60px rgba(20,20,30,.10)`).
- [x] **1.2.2** Add the dark palette on `[data-theme="dark"]` (bg `#0D0F14`, card `#181B23`, ink `#F1F0F4`, muted `#9AA0B0`, edge `#39404F`, line `#262B36`, soft `#2A2138`, soft2 `#201B2B`, accent `#B999F7`, onAcc `#14101C`, shadow `0 24px 60px rgba(0,0,0,.45)`).
- [x] **1.2.3** Add the **fixed** status palette. The admin uses it far more than the storefront does — it is the order-status vocabulary:
  ```css
  :root {
    --k-ok-bg:   #E6F6EE; --k-ok-fg:   #1E7A52;  /* Delivered            */
    --k-warn-bg: #FFF3DB; --k-warn-fg: #8A6415;  /* In transit / Pending */
    --k-bad-bg:  #FDE9E6; --k-bad-fg:  #A83A2A;  /* Refund / Cancelled   */
    --k-plum-fg: #5B3F86;                        /* Packed (on --k-soft) */
    --k-danger:  #E0614F;                        /* destructive actions  */
    --k-on-soft: #171A22;
  }
  ```
- [x] **1.2.4** Map every token into `@theme` as `--color-*` so `bg-card`, `text-ink`, `border-line`, `bg-ok-bg` etc. generate. Add `--font-sans` and `--font-mono`.
- [x] **1.2.5** Add the radius scale: `--radius-ctl 12px`, `--radius-btn 14px`, `--radius-tile 16px`, `--radius-card 20px`, `--radius-panel 22px`, `--radius-hero 26px`, `--radius-sheet 28px`. Admin panels and the data table use `--radius-panel`; sidebar nav items use `13px` (`rounded-[13px]`).
- [x] **1.2.6** Add the elevation utilities: `.shadow-kartly`, `.shadow-lift-accent` (`0 18px 34px rgba(168,123,245,.24)`), `.shadow-lift-accent-lg` (`0 26px 46px`), `.shadow-lift-accent-cta` (`0 16px 32px rgba(168,123,245,.45)`), `.shadow-lift-ink` (`0 16px 32px rgba(20,20,30,.30)`), and the admin-specific stat-card hover `.shadow-lift-stat` (`0 20px 38px rgba(168,123,245,.18)`).
- [x] **1.2.7** Add `.bg-hatch` / `.bg-hatch2` (the 45° repeating-linear-gradient placeholders) — used for every product thumbnail with no image.
- [x] **1.2.8** Add `.no-scrollbar` for the horizontal filter rails and the mobile order-table scroller.

## 1.3 Motion layer

- [x] **1.3.1** Port all ten keyframes (`kfPop`, `kfDraw`, `kfRing`, `kfUp`, `kfFloat`, `kfRoll`, `kfDot`, `kfShim`, `kfConf`, `kfBar`) into `src/index.css`. **`kfBar` is the one the admin genuinely needs** — it drives the revenue chart.
- [x] **1.3.2** Register `--animate-pop`, `--animate-up`, `--animate-dot`, `--animate-shim`, `--animate-bar` in `@theme`.
- [x] **1.3.3** Add the transition presets `.t-fast` (`.2s`), `.t-base` (`.25s cubic-bezier(.2,.8,.2,1)`), `.t-card` (`.28s`), `.t-slow` (`.3s`).
- [x] **1.3.4** Add the hover-lift utilities `.lift-sm`, `.lift`, `.lift-card`, `.lift-lg`, `.slide-x`, `.pop-icon`. The admin sidebar uses `.slide-x` on nav rows; stat cards use `translateY(-5px)` — add `.lift-stat:hover { transform: translateY(-5px); }`.
- [x] **1.3.5** Add the `prefers-reduced-motion` global guard (identical to the storefront).
- [x] **1.3.6** Create `src/components/motion/Reveal.tsx` and `src/components/motion/Shimmer.tsx` (copy from the storefront).

## 1.4 Theme controller (light / dark)

An admin dashboard is a long-session tool — dark mode matters more here than on the storefront.

- [x] **1.4.1** Copy `src/theme/ThemeProvider.tsx` from the storefront, changing only the storage key to `kartlyAdminTheme`.
- [x] **1.4.2** Add the no-flash inline `data-theme` script to `index.html` `<head>`.
- [x] **1.4.3** Wrap `<Router>` in `src/App.tsx` with `<ThemeProvider>`.
- [x] **1.4.4** Add `<meta name="color-scheme" content="light dark">`.
- [x] **1.4.5** Retheme `<ToastContainer>` in `src/App.tsx`: replace `toastClassName="... bg-white text-[#1F2937] ..."` with `bg-card text-ink border-line rounded-[var(--radius-tile)] shadow-kartly`, `progressClassName="bg-accent"`, and pass `theme` from `useTheme()`.
- [x] **1.4.6** Put the theme toggle in the sidebar footer (3.1.6), not buried in a settings page.

## 1.5 The responsive contract (binding for all of Phase 4)

The prototype's admin panel is a single 1280×840 desktop artboard — **it gives you no mobile design**. That is the biggest gap in this plan, and the rules below are how it gets closed. A seller checking orders from a phone is a real use case; every screen must work at 375px.

- [x] **1.5.1** Record and honour these breakpoints:

  | Range | Name | Composition |
  |---|---|---|
  | `< 640px` | mobile | 1-col; sidebar becomes a slide-in drawer; tables become card lists; bottom action bar for primary CTAs |
  | `640–1023px` | tablet | 2-col stat grid; sidebar still a drawer; tables scroll horizontally in their own container |
  | `≥ 1024px` (`lg`) | desktop | persistent `236px` sidebar; 4-col stat grid; real tables |
  | `≥ 1280px` (`xl`) | wide | content capped at `1280px`; side-by-side panel pairs |

- [x] **1.5.2** Create `src/components/layout/Container.tsx`: `mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-9`. Replace every ad-hoc `mx-auto max-w-7xl px-4 sm:px-6` in the app with it during Phase 4.
- [ ] **1.5.3** **Table rule (applies to orders, products, offers, low stock):** at `lg+` render a real `<table>` in a `rounded-panel border border-line overflow-hidden` shell with an `overflow-x-auto` wrapper. Below `lg` render the *same data* as a stacked `Card` list — one card per row, label/value pairs. Build this once as `src/components/ui/DataTable.tsx` with a `mobileCard` render prop; do **not** hand-roll the pattern per page.
- [ ] **1.5.4** Rule: every tap target ≥ 44×44 CSS px on touch widths.
- [ ] **1.5.5** Rule: no page-level horizontal scroll at any width. Wide content scrolls inside its own container.

---

# Phase 2 — Primitive component library

All new files under `src/components/ui/`. Copy from the storefront where noted; the admin-only additions are 2.6.

`DESIGN REF` `.dc.html` lines 820–1045.

## 2.1 Buttons — `src/components/ui/Button.tsx`

Replaces the existing `src/components/Button.tsx` (26 lines, hardcoded `bg-[#A78BFA]`, `label`-prop API).

- [x] **2.1.1** Implement the variants: `primary` (`bg-accent text-onacc`), `dark` (`bg-ink text-card`), `outline` (`border border-edge`, hover inverts to `bg-ink text-card`), `soft` (`bg-soft text-[var(--k-on-soft)]`), `ghost` (`text-accent`, hover `bg-soft2`), `pill`, `icon`, `danger` (`bg-bad-bg text-bad-fg`, hover `border-danger`) — the admin needs a destructive variant the storefront does not.
- [x] **2.1.2** Sizes `sm` / `md` / `lg`. The admin's toolbar buttons are `px-4.5 py-3 text-[12.5px]` — that is `sm`.
- [x] **2.1.3** Props: `variant`, `size`, `icon`, `iconPosition`, `loading`, `fullWidth` + native `ButtonHTMLAttributes`. `loading` swaps children for the three-dot `animate-dot` cluster.
- [x] **2.1.4** Keep the existing `label`-prop signature working with a deprecation comment so the ten pages migrate one at a time. `DashboardPage.tsx`, `AddProductPage.tsx`, `EditProductPage.tsx`, `OffersPage.tsx`, `ShippingConfigPage.tsx`, `LoginPage.tsx` and `SignUpPage.tsx` all use it today.

## 2.2 Form controls — `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `FileDrop.tsx`

`DESIGN REF` lines 892–898 (inputs) and 793 (the product-image drop zone).

- [x] **2.2.1** `Input` base `rounded-btn border border-line bg-transparent px-4 py-3.5 text-[12.5px] font-medium text-ink placeholder:text-muted t-fast`, hover/focus `border-accent`.
- [x] **2.2.2** Error state `border-danger text-danger` with the message below at `text-[11px] font-bold text-danger`.
- [x] **2.2.3** Filled state `border-accent font-semibold` (the prototype's "Oversized Linen Shirt" field).
- [x] **2.2.4** `label` above the field at `font-extrabold text-[12px] mb-2.5`.
- [x] **2.2.5** `Select` matches `Input` with a `▾` affordance; native `<select>` underneath for mobile ergonomics.
- [x] **2.2.6** `FileDrop` — the dashed drop zone: `rounded-tile border border-dashed border-edge p-6.5 text-center text-[12px] font-bold text-muted t-base`, hover `border-accent text-accent bg-soft2`. Supports click-to-browse, drag-over highlight, multi-file, and a thumbnail strip of staged files with per-file remove. This is what `AddProductPage` and `EditProductPage` use for Cloudinary uploads.
- [x] **2.2.7** Mobile: `<input>` font-size ≥ 16px on iOS (`text-base sm:text-[12.5px]`).

## 2.3 Chips & badges — `Chip.tsx`, `Badge.tsx`

- [x] **2.3.1** `Chip`: `rounded-full px-3.5 py-2 text-[11px] font-bold border border-line t-fast`, hover `border-accent text-accent`, selected `bg-ink text-card` (the admin uses ink, not accent, for its selected table filter — see `.dc.html` line 774).
- [x] **2.3.2** `Badge` — the **order-status vocabulary**, mapped exactly to the prototype's `orders` dataset:

  | Status | Classes |
  |---|---|
  | Delivered / Completed | `bg-ok-bg text-ok-fg` |
  | Packed / Processing | `bg-soft text-plum` |
  | In transit / Pending | `bg-warn-bg text-warn-fg` |
  | Refund / Cancelled / Failed | `bg-bad-bg text-bad-fg` |
  | Active / discount tag | `bg-ink text-card` |

  All `rounded-full px-3 py-1.5 text-[10.5px] font-extrabold`.
- [x] **2.3.3** Create `src/components/ui/statusTone.ts` — one function mapping a raw backend status string to a `Badge` tone, with a documented fallback. Every page uses it; no page hand-maps statuses.

## 2.4 Cards & surfaces

- [x] **2.4.1** `Card.tsx` — `rounded-card border border-line bg-card overflow-hidden t-card`, hover (when `interactive`) `lift-card border-accent shadow-lift-accent`.
- [x] **2.4.2** `Panel.tsx` — `rounded-panel border border-line bg-card p-6`. This is the admin's workhorse container: revenue chart, add-product form, low stock, shipping rates all sit in one.
- [x] **2.4.3** `StatCard.tsx` — `rounded-card border border-line p-5 t-card`, hover `lift-stat border-accent shadow-lift-stat`. Content: mono label `text-[11px] font-extrabold text-muted`, value `font-black text-[27px] leading-none tracking-[-.03em] my-2.75`, delta `text-[11.5px] font-extrabold text-accent`. **Replaces `src/components/MetricCard.tsx`.**
- [x] **2.4.4** `Skeleton.tsx` wrapping `Shimmer`, with `line` / `block` / `card` / `row` presets. `row` is the table-row skeleton.
- [x] **2.4.5** `EmptyState.tsx` — dashed `border border-dashed border-edge rounded-card p-12 text-center`, accent icon, `font-extrabold` title, muted sub, optional CTA.
- [x] **2.4.6** `ImageFrame.tsx` — image with `object-cover`, falling back to `bg-hatch` + a mono caption. Every product thumbnail goes through it.
- [x] **2.4.7** `Switch.tsx` — `48×27 rounded-full` track (`bg-line` → `bg-accent`), `21×21 rounded-full bg-card` knob, `t-base`. Used for the theme toggle, product active/inactive, and offer enable/disable.
- [x] **2.4.8** **Delete `src/components/Card.tsx` and `src/components/MetricCard.tsx`** once `Panel` and `StatCard` land — they are superseded, not restyled.

## 2.5 Overlays

- [x] **2.5.1** `Sheet.tsx` — bottom sheet below `lg`, right drawer at `lg+`. Focus trap, `Esc` to close, backdrop click, body-scroll lock. Used for mobile filters and the sidebar drawer.
- [x] **2.5.2** `Modal.tsx` — `rounded-hero bg-card shadow-kartly max-w-lg` on a `bg-ink/40 backdrop-blur-sm` backdrop. Used for offer create/edit and every destructive confirmation.
- [x] **2.5.3** `ConfirmDialog.tsx` — a thin `Modal` wrapper with a `danger` Button. **Every `window.confirm` in the app is replaced by this** — grep for it during Phase 4.
- [x] **2.5.4** `Toast.tsx` — the dark inline toast (`rounded-[18px] bg-ink text-card`, accent dot, title, sub, accent action). Wire `react-toastify` to render it.

## 2.6 Admin-only primitives

- [x] **2.6.1** `src/components/ui/DataTable.tsx` — the responsive table from 1.5.3.
  - Desktop: header row `grid` with mono `text-[10.5px] font-extrabold text-muted` labels on `bg-soft2`, body rows `border-t border-line px-6 py-4 text-[12.5px]`, row hover `bg-soft2`, whole row clickable.
  - Mobile: `mobileCard` render prop produces one `Card` per row.
  - Props: `columns` (with `gridTemplate` fractions matching the prototype's `1.1fr 1.6fr 1.2fr .9fr .9fr`), `rows`, `onRowClick`, `loading`, `empty`.
- [x] **2.6.2** `src/components/ui/BarChart.tsx` — the revenue chart. `flex items-end gap-3.5 h-[150px]`, each bar `flex-1 rounded-[9px]` with `height` as a percentage, `bg-soft` normally and `bg-accent` for the max bar, `animate-bar` on mount, hover `opacity-75`. Day label below at `text-[10px] font-bold text-muted`. Below `sm`, halve the height and drop to every-other label. Pure SVG-free CSS, no chart library.
- [x] **2.6.3** `src/components/ui/QueueList.tsx` — the fulfilment-queue card: `rounded-panel bg-soft p-6 text-[var(--k-on-soft)]`, rows `rounded-[15px] bg-white/70 px-3.75 py-3.25 flex justify-between`, the emphasised final row `bg-ink text-white`. Props: `title`, `rows: {label, value, emphasis?}[]`.
- [x] **2.6.4** `src/components/ui/Toolbar.tsx` — the page-header action row: title block left, actions right, wrapping to a stacked layout below `sm` with the primary action becoming full-width.

---

# Phase 3 — Admin shell

This is the biggest structural change in the app. Today every page renders a horizontal `<Header />` (`src/components/Header.tsx`), and `DashboardPage`, `LoginPage` and `SignUpPage` each define their *own* private top bar (`DashboardTopBar`, two copies of `AuthTopBar`). The Kartly admin design is a **236px left sidebar** shell.

`DESIGN REF` `.dc.html` lines 710–725 (sidebar) and 726–738 (content header).

## 3.1 Desktop sidebar — `src/components/layout/Sidebar.tsx`

- [x] **3.1.1** Create the file. Shell: `w-[236px] shrink-0 border-r border-line bg-soft2 px-5 py-7 flex flex-col gap-1.5 h-screen sticky top-0`.
- [x] **3.1.2** Brand block: extract `src/components/layout/BrandMark.tsx` — a `28×28 rounded-[10px] bg-ink` tile with a `12×12 rounded-full bg-accent` dot at `-3px/-3px`, wordmark at `font-extrabold text-[15px]`, and a mono `admin` sub-label at `text-[9px] text-muted`. Identical construction to the storefront's `BrandMark`.
- [x] **3.1.3** Nav items: `rounded-[13px] px-3.5 py-3 font-semibold text-[13px] text-muted t-fast`, hover `bg-card text-ink slide-x`, **active** `bg-ink text-card font-extrabold`. Note the admin's active state is *ink*, not accent — that is deliberate and differs from the storefront's account nav.
- [x] **3.1.4** Nav list mapped to real routes: `Overview → /dashboard`, `Products → /products`, `Orders → /orders`, `Shipping → /shipping`, `Offers → /offers`. The prototype also lists `Customers`, `Fulfilment` and `Discounts` — **omit any nav item with no route behind it.** Do not ship dead links.
- [x] **3.1.5** Footer card: `mt-auto rounded-tile bg-card border border-line p-3.5` showing the signed-in seller's name and store from `localStorage.sellerProfile`, with a `Logout` ghost Button.
- [x] **3.1.6** Theme toggle sits directly above the footer card: a row with a `Switch` and a `Dark mode` label.
- [x] **3.1.7** Hidden below `lg` (`hidden lg:flex`).

## 3.2 Mobile navigation

The prototype has no mobile admin design. This is the specified behaviour.

- [x] **3.2.1** Create `src/components/layout/MobileTopBar.tsx`: `lg:hidden sticky top-0 z-50 border-b border-line bg-card px-5 py-3.5 flex items-center gap-3` — hamburger tile (`40×40 rounded-[13px] border border-edge`), `BrandMark` compact, and a right-side page-action slot.
- [x] **3.2.2** The hamburger opens the sidebar as a left-anchored `Sheet` (`w-[280px]`, slides in from `-translate-x-full`, backdrop `bg-ink/40 backdrop-blur-sm`). Reuse the **same** `Sidebar` nav item components — do not build a second nav.
- [x] **3.2.3** The drawer closes on route change and on `Esc`; focus returns to the hamburger.
- [x] **3.2.4** Add `src/components/layout/MobileActionBar.tsx` — a fixed bottom bar (`lg:hidden`, `border-t border-line bg-card pb-[env(safe-area-inset-bottom)]`) that pages use for their primary CTA (`Publish`, `Save changes`, `Create offer`). This keeps destructive-adjacent primary actions thumb-reachable instead of stranded at the bottom of a long form.
- [ ] **3.2.5** Pages that render a `MobileActionBar` add `pb-28 lg:pb-0` to their content container.

## 3.3 Layout wrapper

- [x] **3.3.1** Create `src/components/layout/AdminLayout.tsx`: `flex min-h-screen bg-bg text-ink` with `<Sidebar />`, then a `flex-1 flex flex-col min-w-0` column containing `<MobileTopBar />`, `<main className="flex-1">`, and the drawer portal. **`min-w-0` is required** — without it the flex child refuses to shrink and every table forces page-level horizontal scroll.
- [x] **3.3.2** Create `src/components/layout/PageHeader.tsx` from the prototype's content header (lines 727–737): greeting/title block at `font-black text-[26px] leading-[1.1] tracking-[-.03em]`, sub-line `text-[12.5px] text-muted font-semibold`, and a right-aligned action cluster. Props: `title`, `subtitle`, `actions`. Stacks vertically below `sm`.
- [x] **3.3.3** Convert `src/App.tsx` to nested routes: a parent `<Route element={<AdminLayout />}>` with `<Outlet />` for all authenticated routes, so the shell is not re-mounted on navigation.
- [x] **3.3.4** Keep `/login` and `/signup` **outside** `AdminLayout` — they use a brand-only centred layout (4.9).
- [x] **3.3.5** Add a scroll-to-top effect on pathname change.
- [x] **3.3.6** **Delete `src/components/Header.tsx`** and the private `DashboardTopBar` in `DashboardPage.tsx` and both `AuthTopBar` copies in `LoginPage.tsx` / `SignUpPage.tsx` once every page renders inside `AdminLayout`.
- [x] **3.3.7** Extract the auth guard repeated in all ten pages (`localStorage.getItem('sellerToken')` → redirect) into `src/components/layout/RequireSellerAuth.tsx` and wrap the `AdminLayout` route with it. Pages stop doing their own guarding.
- [x] **3.3.8** Add a shared `src/components/layout/Footer.tsx` for the desktop content column (muted, `border-t border-line`), replacing the per-page `DashboardFooter`-style inline footers.

---

# Phase 4 — Page migrations

Each page gets the design reference, a mobile checklist, and a desktop checklist. **Both must be ticked.**

## 4.0 Route → design map

| Route | File | Prototype source |
|---|---|---|
| `/dashboard` | `src/pages/DashboardPage.tsx` | Admin tab, full artboard (706–818) |
| `/products` | `src/pages/ProductListPage.tsx` | Recent-orders table pattern (765–782) + product cards |
| `/products/new` | `src/pages/AddProductPage.tsx` | "Add product" panel (784–800) |
| `/products/:id` | `src/pages/ProductDetailsPage.tsx` | Storefront D2 PDP, admin-framed (585–634) |
| `/products/:id/edit` | `src/pages/EditProductPage.tsx` | "Add product" panel (784–800) |
| `/orders` | `src/pages/OrderListPage.tsx` | Recent-orders table (765–782) |
| `/shipping` | `src/pages/ShippingConfigPage.tsx` | Panel + rate rows (Components tab) |
| `/offers` | `src/pages/OffersPage.tsx` | Panel + badges + modal (Components tab) |
| `/login`, `/signup` | `src/pages/LoginPage.tsx`, `SignUpPage.tsx` | Design-system panel (820–1045) |

## 4.1 `DashboardPage.tsx` — overview

The prototype's admin artboard is essentially this page. Match it closely.

### Desktop

- [x] **4.1.1** Replace the private `DashboardTopBar` with `PageHeader`: title `Good morning, {sellerName}` at `font-black text-[26px] tracking-[-.03em]`, subtitle showing a real derived figure (e.g. `{n} orders waiting to be packed`). If the backend cannot supply that count yet, use a figure it *can* supply — do **not** hardcode the prototype's `18`.
- [x] **4.1.2** Header actions: `outline` `Export CSV` + `primary` `+ New product` (`onClick → /products/new`). Wire Export CSV to a real client-side CSV of the current table, or omit the button — no dead controls.
- [x] **4.1.3** Stat row: `grid grid-cols-4 gap-4` of `StatCard`. Keep the existing computed stats (Products, Active, Stock Units, Categories) and add the delta line where a comparison is available; render the delta slot empty rather than inventing `+12.4%`.
- [x] **4.1.4** Revenue panel: `flex-[1.4] Panel` with header `Revenue · last 7 days` at `font-extrabold text-base` and the period total right-aligned at `text-[11.5px] font-extrabold text-muted`, containing `BarChart` (2.6.2). Source the series from the orders endpoint; if seven-day revenue is not yet exposed, render the panel in a loading/`EmptyState` posture with a note — do not ship the prototype's fake `[34,52,44,72,96,68,58]`.
- [x] **4.1.5** Fulfilment queue: `flex-1 QueueList` (2.6.3) with To pack / In transit / Delivered today / Refund requests, the last row emphasised. Same data-honesty rule.
- [ ] **4.1.6** Recent orders: `DataTable` in a `rounded-panel` shell — header row with `All / Packed / Delivered` filter `Chip`s, mono column labels `ORDER / CUSTOMER / ITEMS / TOTAL / STATUS` on `bg-soft2`, grid `1.1fr 1.6fr 1.2fr .9fr .9fr`, status via `Badge` + `statusTone`. Row click → `/orders`.
- [ ] **4.1.7** Bottom pair: `Add product` quick-form `Panel` (name input, price/stock/category row, `FileDrop`, `Save draft` + `Publish` buttons) beside a `Low stock` `Panel` (rows: `42×42` hatched thumb, name, mono SKU, `{n} left` soft pill; hover `bg-soft2`). Both `flex-1`.
- [x] **4.1.8** Replace the existing `notice` bar styling with `rounded-btn border border-warn-fg/30 bg-warn-bg text-warn-fg px-4 py-3 text-[13px] font-semibold`.
- [x] **4.1.9** Replace the `Loading product data...` text and the `-` stat placeholders with `Skeleton` components.

### Mobile

- [x] **4.1.10** Stat grid `grid-cols-2 gap-3`; values drop to `text-[22px]`.
- [ ] **4.1.11** Revenue chart height halves to `h-[110px]`; show every other day label.
- [x] **4.1.12** Fulfilment queue stacks below the chart, full width.
- [ ] **4.1.13** Recent orders renders as the `DataTable` mobile card list: order id + status `Badge` on the first line, customer and items on the second, total right-aligned and bold.
- [ ] **4.1.14** The quick add-product form collapses to a single `Panel` with a `Open full form →` link to `/products/new` rather than a cramped inline form.
- [ ] **4.1.15** `+ New product` moves into `MobileActionBar`.

## 4.2 `ProductListPage.tsx` — catalog

### Desktop

- [ ] **4.2.1** `PageHeader`: title `Products`, subtitle `{n} products · {m} active`, actions `outline` Export + `primary` `+ New product`.
- [ ] **4.2.2** Toolbar row: search `Input` (`max-w-[340px] rounded-full`), status filter `Chip`s (`All` / `Active` / `Inactive`), and a sort `Select`. Wire to the existing search + status filter state.
- [ ] **4.2.3** Body as `DataTable`: columns `PRODUCT` (hatched `48×48` thumb + name + mono SKU), `CATEGORY`, `VARIANTS`, `STOCK`, `PRICE`, `STATUS` (`Badge`). Row click → `/products/:id`.
- [ ] **4.2.4** Row-hover action cluster on the right: ghost `Edit` and `danger` `Delete` icon buttons, appearing on `group-hover`.
- [ ] **4.2.5** Delete goes through `ConfirmDialog` (2.5.3), never `window.confirm`.
- [ ] **4.2.6** Loading state: five `Skeleton` rows. Empty state: `EmptyState` with a `Create your first product` CTA.
- [ ] **4.2.7** Pagination as `outline` Buttons with `Page {n} of {m}` in `text-muted` between them.

### Mobile

- [ ] **4.2.8** `DataTable` mobile mode: one `Card` per product — hatched `64×64` thumb left, name `font-bold text-[13px]`, category muted, price bold, status `Badge` top-right.
- [ ] **4.2.9** Search moves into a sticky sub-bar under `MobileTopBar`; the status filter becomes a horizontal `Chip` rail (`no-scrollbar`).
- [ ] **4.2.10** Card tap → detail; edit/delete live inside the detail page rather than as hidden hover actions.
- [ ] **4.2.11** `+ New product` in `MobileActionBar`.

## 4.3 `AddProductPage.tsx` — create product

`DESIGN REF` lines 784–800.

### Desktop

- [ ] **4.3.1** `PageHeader`: title `New product`, back link to `/products`, actions `outline` `Save draft` + `primary` `Publish`.
- [ ] **4.3.2** Two-column form: main column `flex-[1.6]` with `Panel`s for **Basics** (name, description, category `Select`), **Pricing & stock** (price / stock / SKU in a three-up row), and **Variants**; side column `w-[340px] sticky top-8` with **Images** and **Status**.
- [ ] **4.3.3** Images `Panel` uses `FileDrop` (2.2.6). Preserve the existing Cloudinary signature flow in `src/api/cloudinaryApi.ts` exactly — this is a styling change, not an upload rewrite.
- [ ] **4.3.4** Staged image thumbnails: `96×96 rounded-tile border border-line`, the first marked `Cover` with a `Badge tone="ink"`, each with a remove `×` on hover. Support drag-to-reorder if the current code already tracks order; otherwise leave order as upload order and note it.
- [ ] **4.3.5** Variant rows: `rounded-tile border border-line p-3.5` with attribute/value/price/stock `Input`s and a `danger` remove button; `+ Add variant` as a dashed row (`border-dashed border-edge`, hover `border-accent text-accent`).
- [ ] **4.3.6** Status `Panel`: an active/inactive `Switch` with a muted explanation line.
- [ ] **4.3.7** Per-field validation errors render inline in the `Input` error slot, not as a toast dump. Keep the existing submit-level toast for request failures.
- [ ] **4.3.8** Upload progress: an accent `ProgressBar` per file while Cloudinary uploads; the `Publish` button is `loading` and disabled until all uploads settle.

### Mobile

- [ ] **4.3.9** Single column; the side `Panel`s move below the main ones in the order Basics → Images → Pricing → Variants → Status.
- [ ] **4.3.10** `FileDrop` becomes a tap-to-browse tile — drag-and-drop text is meaningless on touch; swap the copy to `Add product images`.
- [ ] **4.3.11** Staged thumbnails become a horizontal `no-scrollbar` rail at `72×72`.
- [ ] **4.3.12** Variant rows stack their fields two-up instead of four-across.
- [ ] **4.3.13** `Save draft` / `Publish` move into `MobileActionBar` (`Publish` primary and full-width, `Save draft` as a ghost beside it).

## 4.4 `EditProductPage.tsx` — edit product

- [ ] **4.4.1** Reuse the **exact same form composition** as 4.3 — extract `src/components/products/ProductForm.tsx` and have both pages render it with a `mode` prop. Do not maintain two divergent 300-line forms.
- [ ] **4.4.2** `PageHeader` title `Edit product`, subtitle showing the product name and mono id.
- [ ] **4.4.3** Existing images render in the same thumbnail strip as staged ones, visually distinguished by a muted `Uploaded` label; removal marks them for deletion on save.
- [ ] **4.4.4** Add a `danger` `Delete product` action at the bottom of the Status panel, behind `ConfirmDialog`.
- [ ] **4.4.5** Unsaved-changes guard: warn on navigation away when the form is dirty.
- [ ] **4.4.6** **Mobile:** identical to 4.3.9–4.3.13, with `Save changes` as the `MobileActionBar` primary.

## 4.5 `ProductDetailsPage.tsx` — product view

### Desktop

- [ ] **4.5.1** Compose it like the storefront's D2 PDP so the seller sees what the buyer sees: thumbnail column (`96×96`), main image `rounded-hero bg-soft min-h-[470px]`, info column `w-[340px]`.
- [ ] **4.5.2** Info column: mono category eyebrow, name `font-black text-[34px] leading-[1.05] tracking-[-.03em]`, price row with the offer-discounted price and a `Badge tone="ink"` discount tag when an offer applies.
- [ ] **4.5.3** Below the fold: a `Panel` per section — Variants (table of attribute / price / stock), Offers (active offer cards), and Metadata (mono created/updated timestamps, product id).
- [ ] **4.5.4** Actions in `PageHeader`: `outline` `Preview in store` (opens the storefront URL for this product in a new tab), `primary` `Edit`, `danger` `Delete` behind `ConfirmDialog`.
- [ ] **4.5.5** Stock health strip: a `ProgressBar` per variant, `bg-bad-bg` fill when below the low-stock threshold.

### Mobile

- [ ] **4.5.6** Gallery full-bleed at `h-[280px]` with a dot pager; thumbnails become a horizontal rail beneath it.
- [ ] **4.5.7** Info stacks under the gallery; the variant table becomes a stacked card list.
- [ ] **4.5.8** `Edit` in `MobileActionBar`; `Delete` stays inside the page body so it cannot be hit by accident.

## 4.6 `OrderListPage.tsx` — orders

The current page is 131 lines and thin. This is where the prototype's table design belongs.

### Desktop

- [ ] **4.6.1** `PageHeader`: title `Orders`, subtitle `{n} orders · {m} awaiting fulfilment`.
- [ ] **4.6.2** Status filter `Chip` rail: `All` / `Pending` / `Packed` / `In transit` / `Delivered` / `Refund`, selected = `bg-ink text-card` per the prototype.
- [ ] **4.6.3** `DataTable` with the prototype's exact grid `1.1fr 1.6fr 1.2fr .9fr .9fr` and mono headers `ORDER / CUSTOMER / ITEMS / TOTAL / STATUS`.
- [ ] **4.6.4** Order id in `font-mono font-extrabold`; customer `font-semibold`; items `text-muted font-medium`; total `font-extrabold`; status via `Badge` + `statusTone`.
- [ ] **4.6.5** Row hover `bg-soft2`; row click opens an order detail `Sheet` (right drawer) with line items, address, payment reference and a status-advance control if the backend supports it.
- [ ] **4.6.6** Date-range filter and a search-by-order-id `Input` in the toolbar.
- [ ] **4.6.7** Loading: six `Skeleton` rows. Empty: `EmptyState`.

### Mobile

- [ ] **4.6.8** Card list: order id (mono, bold) + status `Badge` on line one; customer + item count on line two; total right-aligned bold on line three; date muted.
- [ ] **4.6.9** Filter `Chip`s as a `no-scrollbar` rail below the top bar.
- [ ] **4.6.10** Row tap opens the detail as a bottom `Sheet`.
- [ ] **4.6.11** The table must never cause page-level horizontal scroll — this is the highest-risk page for 1.5.5; verify explicitly at 375px.

## 4.7 `ShippingConfigPage.tsx` — shipping

### Desktop

- [ ] **4.7.1** `PageHeader`: title `Shipping`, subtitle showing the configured origin city/state.
- [ ] **4.7.2** Two-column: **Origin address** `Panel` (`Input` grid) left at `flex-[1.2]`, **Rates** `Panel` right.
- [ ] **4.7.3** Rate rows: `rounded-tile border border-line p-3.5 flex items-center justify-between` — name (capitalised from camelCase, as the current code already does), delivery time muted below, cost `font-extrabold text-accent` right. Hover `border-accent`.
- [ ] **4.7.4** Editing a rate switches the row inline into two `Input`s (cost, time) with `Save` / `Cancel` ghost buttons.
- [ ] **4.7.5** `+ Add rate` as a dashed row.
- [ ] **4.7.6** Free-shipping threshold gets its own `Panel` with a `Switch` and an amount `Input`.
- [ ] **4.7.7** Save action in `PageHeader` as `primary`, `loading` while saving.

### Mobile

- [ ] **4.7.8** Single column; rate rows stack cost below the name rather than right-aligned.
- [ ] **4.7.9** Inline rate editing becomes a `Sheet` — inline two-field editing is too cramped at 375px.
- [ ] **4.7.10** `Save` in `MobileActionBar`.

## 4.8 `OffersPage.tsx` — offers

At 458 lines this is the largest page; restructure rather than restyle in place.

### Desktop

- [ ] **4.8.1** `PageHeader`: title `Offers`, subtitle `{n} active · {m} scheduled`, action `primary` `+ Create offer`.
- [ ] **4.8.2** Move the create/edit form out of inline page state into `src/components/offers/OfferForm.tsx`, rendered inside a `Modal`.
- [ ] **4.8.3** Offer list as `Card`s in a `grid grid-cols-2 xl:grid-cols-3 gap-5`: name `font-extrabold text-[15px]`, discount value as a `Badge tone="ink"` (e.g. `−25%`), validity window in mono `text-[11px] text-muted`, target summary (`All variants` / `{n} variants`), and a status `Badge` (`Active` / `Scheduled` / `Expired`) derived from the validity dates.
- [ ] **4.8.4** Card footer: `Edit` ghost + `danger` `Delete` behind `ConfirmDialog`, plus an enable/disable `Switch`.
- [ ] **4.8.5** `OfferForm` layout: name `Input`, discount type `Chip` row (percent / flat), value `Input`, a validity date range (two `Input type="date"`), then the product/variant target picker.
- [ ] **4.8.6** Target picker: a searchable list of products with checkboxes, each expandable to its variants. Selected targets render as removable `Chip`s above the list. This replaces whatever multi-select the page uses today; keep the submitted payload shape identical.
- [ ] **4.8.7** Filter `Chip` rail above the grid: `All` / `Active` / `Scheduled` / `Expired`.
- [ ] **4.8.8** Empty state: `EmptyState` with a `Create your first offer` CTA.

### Mobile

- [ ] **4.8.9** Offer grid becomes `grid-cols-1`.
- [ ] **4.8.10** `OfferForm` renders in a full-height bottom `Sheet` instead of a `Modal`, with its own sticky save bar.
- [ ] **4.8.11** The target picker becomes a nested full-screen `Sheet` — a searchable list inside a modal inside a modal does not work at 375px.
- [ ] **4.8.12** `+ Create offer` in `MobileActionBar`.

## 4.9 `LoginPage.tsx` & `SignUpPage.tsx` — auth

No prototype screen exists; compose from the design-system panel.

- [ ] **4.9.1** Delete both private `AuthTopBar` copies; use a centred `BrandMark` header instead.
- [ ] **4.9.2** Split screen at `lg`: left `flex-[1.1]` brand panel `bg-soft rounded-hero` with the mark, a display heading (`Run your store.`), and three muted feature lines; right the form column at `max-w-[420px]`, centred.
- [ ] **4.9.3** Mobile: brand panel collapses to a compact header; form takes full width.
- [ ] **4.9.4** Rebuild both forms with the `Input` primitive; step 1 (credentials) and step 2 (OTP) as two `animate-up` panels with a crossfade.
- [ ] **4.9.5** OTP entry: six `48×56 rounded-ctl border border-line text-center font-extrabold text-[20px]` boxes with auto-advance, paste support and backspace-to-previous; filled boxes get `border-accent`.
- [ ] **4.9.6** The backend returns the OTP in the response body ("for testing/demo purposes"). Keep surfacing it, but in a clearly-marked dev notice card (`Badge tone="warn"` + mono text).
- [ ] **4.9.7** Resend link with a 60s countdown.
- [ ] **4.9.8** Submit as a full-width `primary` Button with `loading` wired to the existing request flags.
- [ ] **4.9.9** Error surface `rounded-btn border border-danger bg-bad-bg text-bad-fg px-4 py-3 text-[13px] font-semibold`, entering with `animate-up`.
- [ ] **4.9.10** After login, `sellerProfile` in `localStorage` feeds the sidebar footer card (3.1.5) — confirm the fields it needs are actually stored.

---

# Phase 5 — Motion & interaction pass

Do this once every page is structurally converted, so timings stay consistent.

- [ ] **5.1** Page transitions: fade + 14px rise (`animate-up`, 300ms) on route change, applied once in `AdminLayout`, keyed by pathname.
- [ ] **5.2** Stat cards: `t-card`, hover `lift-stat border-accent shadow-lift-stat`.
- [ ] **5.3** Sidebar nav rows: `t-fast`, hover `bg-card text-ink slide-x`.
- [ ] **5.4** Table rows: `t-fast`, hover `bg-soft2`; the hover action cluster fades in on `group-hover`.
- [ ] **5.5** All buttons: `t-base`, hover `lift` + matching shadow, `active:translate-y-0 active:shadow-none`.
- [ ] **5.6** All inputs and chips: `t-fast`, hover/focus `border-accent`.
- [ ] **5.7** `BarChart` bars run `animate-bar` on mount and on data change; hover dims to `opacity-75` and reveals a value tooltip.
- [ ] **5.8** Stat values count up from 0 over 600ms on first load (skip entirely under reduced motion).
- [ ] **5.9** Grid entrance stagger: product and offer grids reveal with `Reveal` at `index * 40ms`, capped at 400ms total.
- [ ] **5.10** Sheets and drawers: 250ms `cubic-bezier(.2,.8,.2,1)` translate; backdrops fade at 200ms. The sidebar drawer slides from `-translate-x-full`.
- [ ] **5.11** Skeletons: `animate-shim` everywhere. Confirm `grep -rn "animate-pulse" src/` returns nothing.
- [ ] **5.12** Save confirmations use the `Toast` (2.5.4) with `animate-up`; the save button briefly shows a check before reverting.
- [ ] **5.13** Verify the reduced-motion guard: with the OS setting on, no bar animation, no count-up, no looping motion; every entrance is instant.

---

# Phase 6 — Responsive QA matrix

Test every route at every width, in **both themes**. Tick a route only when all four widths pass.

| Route | 375px | 768px | 1024px | 1440px |
|---|---|---|---|---|
| `/login` | ☐ | ☐ | ☐ | ☐ |
| `/signup` | ☐ | ☐ | ☐ | ☐ |
| `/dashboard` | ☐ | ☐ | ☐ | ☐ |
| `/products` | ☐ | ☐ | ☐ | ☐ |
| `/products/new` | ☐ | ☐ | ☐ | ☐ |
| `/products/:id` | ☐ | ☐ | ☐ | ☐ |
| `/products/:id/edit` | ☐ | ☐ | ☐ | ☐ |
| `/orders` | ☐ | ☐ | ☐ | ☐ |
| `/shipping` | ☐ | ☐ | ☐ | ☐ |
| `/offers` | ☐ | ☐ | ☐ | ☐ |

Pass criteria applied at every width:

- [ ] **6.1** No page-level horizontal scroll. Verify on every route with `document.documentElement.scrollWidth <= window.innerWidth`. The orders and products tables are the likely offenders — check them first.
- [ ] **6.2** Every table renders as a real table at `lg+` and as a card list below `lg`; no table is ever squeezed into an unreadable 375px grid.
- [ ] **6.3** Sidebar is persistent at `lg+` and a drawer below; the drawer closes on route change.
- [ ] **6.4** `MobileActionBar` visible below `lg` on the pages that declare one, with no content trapped underneath it.
- [ ] **6.5** All modals present as bottom sheets below `lg`.
- [ ] **6.6** Every tap target ≥ 44px on touch widths.
- [ ] **6.7** Long product names, customer names and addresses truncate or wrap — never overflow their cell.
- [ ] **6.8** Forms are single-column below `lg` with no field narrower than its content.
- [ ] **6.9** Run the whole matrix twice — once light, once dark.
- [ ] **6.10** Safe-area insets respected on iOS.
- [ ] **6.11** `AdminLayout`'s content column has `min-w-0` (3.3.1) — verify by loading `/orders` at 375px; without it the whole page scrolls sideways.
- [ ] **6.12** Landscape phone (`812×375`) does not break the drawer or the action bar.

---

# Phase 7 — Cleanup, accessibility & verification

## 7.1 Removal of the old system

- [ ] **7.1.1** Re-run the Phase 0.1.2 grep. Zero matches for the legacy `bg-primary` / `text-text` / `bg-secondary` / `bg-background` / `text-accent` meanings.
- [ ] **7.1.2** Delete `product_selling_app_clinet_admin/tailwind.config.js` — Tailwind v4 does not read it.
- [ ] **7.1.3** Delete `src/components/Header.tsx`, `src/components/Card.tsx`, `src/components/MetricCard.tsx` (superseded by `Sidebar`/`MobileTopBar`, `Panel`, `StatCard`).
- [ ] **7.1.4** Remove the private `DashboardTopBar` and both `AuthTopBar` definitions.
- [ ] **7.1.5** Remove the per-page auth-guard `useEffect`s now that `RequireSellerAuth` handles it (3.3.7).
- [ ] **7.1.6** Remove unused assets: `src/assets/react.svg`, `src/assets/vite.svg`, and any of `src/assets/icons/*.tsx` no longer referenced (the app mostly uses `react-icons` Feather).
- [ ] **7.1.7** Mark `docs/design_language.md` as superseded — add a header line pointing at this file, or delete it. Leaving two conflicting design docs in `docs/` is the failure mode that produced the dead-token situation in the first place.
- [ ] **7.1.8** Delete the stray `vite-dev.log` and `vite-dev.err.log` at the project root and add them to `.gitignore`.

## 7.2 Accessibility

- [ ] **7.2.1** Contrast: verify `--k-muted` on `--k-card` in both themes hits 4.5:1 for body text. Table metadata at `text-[10.5px]` is the tightest case — bump to `#6B7180` in light mode if it fails, and record the decision in `docs/KARTLY_MIGRATION_NOTES.md`.
- [ ] **7.2.2** Every interactive element is a real `<button>` or `<a>`; the prototype's `<div onClick>` pattern is not carried over.
- [ ] **7.2.3** Visible focus ring on every control: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`.
- [ ] **7.2.4** `DataTable` desktop mode uses real `<table>` / `<thead>` / `<th scope="col">` semantics, not a `div` grid — screen readers need the row/column relationships.
- [ ] **7.2.5** Sheets, drawers and modals: `role="dialog"`, `aria-modal`, focus trap, focus restored to the trigger on close.
- [ ] **7.2.6** Sidebar is a `<nav aria-label="Admin">` with `aria-current="page"` on the active item.
- [ ] **7.2.7** `Switch` components are `<button role="switch" aria-checked>`.
- [ ] **7.2.8** `ConfirmDialog` focuses the cancel action by default, not the destructive one.
- [ ] **7.2.9** `BarChart` has an accessible fallback: an `aria-label` summarising the series, or a visually-hidden table of the values.
- [ ] **7.2.10** Keyboard-only pass of the core flow: login → dashboard → products → new product → publish. No trap, no unreachable control.

## 7.3 Verification

- [ ] **7.3.1** `npm run lint` (eslint) clean.
- [ ] **7.3.2** `npm run build` clean — `tsc -b` will surface unused imports the migration leaves behind (`noUnusedLocals` is on).
- [ ] **7.3.3** Manual smoke against a live backend: login (OTP) → dashboard loads → create a product with a real Cloudinary image upload → edit it → create an offer → check the storefront reflects both. Confirm no restyle broke a request payload, especially the Cloudinary signature flow and the offer target payload.
- [ ] **7.3.4** Cross-app consistency check: open the storefront and the admin side by side in both themes. Accent, ink, card, line, radii and badge colours must be indistinguishable. Any drift means the token files diverged — re-copy rather than patch.
- [ ] **7.3.5** Update `product_selling_app_clinet_admin/CLAUDE.md` → **Styling** section: replace the `tailwind.config.js` token list with the `@theme` token table, document the `data-theme` dark-mode contract, and note that `Header`/`Card`/`MetricCard` were replaced by the layout + `ui` primitives.
- [ ] **7.3.6** Update the root `CLAUDE.md` → **Frontend Architecture**, which currently states shared tokens live in each app's `tailwind.config.js`.
- [ ] **7.3.7** Fill in the Progress summary table at the top of this file.

---

# Appendix A — Token quick reference

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--k-bg` | `#ECECEE` | `#0D0F14` | app canvas |
| `--k-card` | `#FFFFFF` | `#181B23` | panels, table body, top bar |
| `--k-ink` | `#171A22` | `#F1F0F4` | primary text, active nav, dark buttons |
| `--k-muted` | `#767C8C` | `#9AA0B0` | secondary text, column headers, icons |
| `--k-edge` | `#1B1F2A` | `#39404F` | strong outlines, dashed drop zones |
| `--k-line` | `#E4E4EA` | `#262B36` | hairlines, table row borders |
| `--k-soft` | `#F6E8FF` | `#2A2138` | queue card, soft chips, thumb hatch |
| `--k-soft2` | `#FAF3FF` | `#201B2B` | sidebar background, table header row, row hover |
| `--k-accent` | `#A87BF5` | `#B999F7` | primary actions, chart max bar, prices |
| `--k-onAcc` | `#FFFFFF` | `#14101C` | text on accent |

Fixed status palette: `--k-ok-bg #E6F6EE` / `--k-ok-fg #1E7A52`; `--k-warn-bg #FFF3DB` / `--k-warn-fg #8A6415`; `--k-bad-bg #FDE9E6` / `--k-bad-fg #A83A2A`; `--k-plum-fg #5B3F86`; `--k-danger #E0614F`.

# Appendix B — Type scale

| Role | Spec |
|---|---|
| Page title | `font-black text-[26px] leading-[1.1] tracking-[-.03em]` |
| Stat value | `font-black text-[27px] leading-none tracking-[-.03em]` |
| Panel title | `font-extrabold text-[16px] leading-none` |
| Row title | `font-bold text-[12.5px]` |
| Body / meta | `font-semibold text-[12.5px] text-muted` |
| Table header | `font-mono font-extrabold text-[10.5px] text-muted` |
| Badge | `font-extrabold text-[10.5px]` |
| Sidebar item | `font-semibold text-[13px]` (active `font-extrabold`) |

# Appendix C — Component replacement map

| Old | New | Notes |
|---|---|---|
| `src/components/Header.tsx` | `layout/Sidebar.tsx` + `layout/MobileTopBar.tsx` | horizontal nav → sidebar shell |
| `DashboardTopBar` (private) | `layout/PageHeader.tsx` | was duplicated logic |
| `AuthTopBar` ×2 (private) | `layout/BrandMark.tsx` | two identical copies removed |
| `src/components/Card.tsx` | `ui/Panel.tsx` | |
| `src/components/MetricCard.tsx` | `ui/StatCard.tsx` | new label/value/delta composition |
| `src/components/Button.tsx` | `ui/Button.tsx` | variant API; `label` prop kept temporarily |
| inline `<table>` / grid markup | `ui/DataTable.tsx` | responsive table ↔ card list |
| `window.confirm` | `ui/ConfirmDialog.tsx` | grep for every call site |
| `animate-pulse` skeletons | `ui/Skeleton.tsx` | `kfShim` shimmer |
| per-page auth `useEffect` | `layout/RequireSellerAuth.tsx` | ten copies removed |

# Appendix D — Animation catalogue

| Keyframe | Duration / easing | Applied to |
|---|---|---|
| `kfBar` | `.9s cubic-bezier(.2,.8,.2,1) both` | revenue chart bars |
| `kfUp` | `.4–.6s both` | page enter, toasts, panels, sheets |
| `kfPop` | `.7s cubic-bezier(.2,1.3,.3,1) both` | save confirmations, count badges |
| `kfDot` | `1.2s infinite` (0 / .2 / .4s) | button loading state |
| `kfShim` | `1.4s linear infinite` | every skeleton |
| `kfDraw`, `kfRing`, `kfConf` | — | storefront-only (success screen); ported for parity, unused here |
| `kfFloat` | `5s ease-in-out infinite` | auth brand illustration |
| `kfRoll` | — | storefront-only (order tracking) |
