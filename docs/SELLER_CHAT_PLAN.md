# Seller Assistant Chat — Plan (branch `agentic-chat`)

Master plan (architecture, chat protocol, blocks):
`product_selling_app_agent/doc/MCP_AGENT_PLAN.md`.

## Goal
A simple chat inside the admin app where a seller can manage the store by
talking to it:
- **Add a product** — the chat shows a real form (name, description,
  category, variant types, variants with price/stock, **photo upload**).
- **Add a variant / restock** — "add 20 units of the black M hoodie".
- **Ask for status** — products, stock levels, low stock, orders and each
  order item's stage; move an item to the next stage with tracking.

## How it works
- Page `/assistant` (sidebar item "Assistant"), backed by the agent's
  `/api/v1/seller-chat/*` with the seller's own `sellerToken`.
- Blocks rendered as admin UI:
  - `seller_products` → table/cards with stock per variant, low-stock
    highlight, link to the product page.
  - `seller_product` → product with variants (price, stock, active).
  - `seller_orders` / `seller_order` → orders with per-item status badges
    and tracking.
  - `product_form` → the **Add product form** inside the chat. Photos use
    the existing direct-to-Cloudinary upload (`src/api/cloudinaryApi.ts`,
    signed by the server), then the form is sent as
    `action: { type: "submit_form", form: "create_product", values }` and
    the agent creates the product via MCP. Fields the seller already
    mentioned ("add a cotton tee in S/M/L at ₹499") come prefilled.
  - `notice` → success / error.
- Writes typed in chat (restock, price, status, order stage) come back as a
  **pending action** card with Confirm / Cancel.
- Suggestion chips: "Add a product", "Show low stock", "Recent orders",
  "Restock a product".

## Steps — commit after each
1. ✅ **Plan** — this file.
2. ✅ **Agent API client + types** — `src/api/agentApi.ts`
   (`VITE_AGENT_URL`), `src/components/assistant/types.ts`, `.env.example`.
3. ✅ **Blocks** — product/stock tables, orders, notice, pending action card.
4. ✅ **Chat product form** — form with variant rows and photo upload
   (reuses `uploadProductImages` / `partitionBySize`).
5. ✅ **AssistantPage + navigation** — page, sidebar item, route, docs.
