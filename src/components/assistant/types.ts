// Mirrors product_selling_app_agent/src/agent/blocks.ts (seller blocks) and its chat API.

export type OrderStatus = 'CREATED' | 'CONFIRMED' | 'SHIPPED' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'CANCELLED';

export type Tracking = { courier?: string; trackingId?: string; trackingUrl?: string } | null;

export type SellerProductRow = {
  id: string;
  name: string;
  category?: string;
  image: string | null;
  isActive: boolean;
  price: number | null;
  variantCount: number;
  totalStock: number;
  minVariantStock: number;
};

export type SellerProductDetail = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  images: string[];
  isActive: boolean;
  variantTypes: string[];
  variants: { id: string; sku?: string; attributes: Record<string, string>; price: number; stock: number; isActive: boolean }[];
};

export type OrderItemView = {
  subOrderId: string;
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  priceAtPurchase: number;
  attributes: Record<string, string>;
  status: OrderStatus;
  tracking: Tracking;
};

export type SellerOrderView = {
  id: string;
  orderId: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentStatus: string;
  shipTo: { fullName?: string; city?: string; state?: string; pincode?: string };
  sellerSubtotal: number;
  canUpdateStatus: boolean;
  items: OrderItemView[];
};

export type ProductFormPrefill = {
  name?: string;
  description?: string;
  category?: string;
  variantTypes?: string[];
  variants?: { attributes?: Record<string, string>; price?: number; stock?: number }[];
};

export type Block =
  | { type: 'seller_products'; data: { items: SellerProductRow[]; total: number } }
  | { type: 'seller_product'; data: SellerProductDetail }
  | { type: 'seller_orders'; data: { items: SellerOrderView[]; total: number } }
  | { type: 'seller_order'; data: SellerOrderView }
  | { type: 'product_form'; data: { prefill: ProductFormPrefill } }
  | { type: 'notice'; data: { tone: 'success' | 'error'; message: string } };

export type PendingAction = { id: string; tool: string; summary: string };

export type ChatAction =
  | { type: 'confirm' | 'cancel'; actionId: string }
  | { type: 'submit_form'; form: 'create_product'; values: Record<string, unknown> };

export type ChatResponse = {
  success: boolean;
  conversationId: string;
  reply: string;
  blocks: Block[];
  pendingAction: PendingAction | null;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  kind?: 'text' | 'action';
  text: string;
  blocks?: Block[];
  pendingAction?: (PendingAction & { status: 'pending' | 'confirmed' | 'cancelled' }) | null;
  createdAt?: string;
};

export type ConversationSummary = { _id: string; title: string; updatedAt: string };

export type ConversationDetail = {
  _id: string;
  title: string;
  updatedAt: string;
  messages: Omit<ChatMessage, 'id'>[];
  pendingAction: PendingAction | null;
};

export const LOW_STOCK_THRESHOLD = 5;

export const formatCurrency = (value: number | null | undefined) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export const formatAttributes = (attributes: Record<string, string> | undefined) =>
  Object.entries(attributes ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');

export const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Created',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  'OUT FOR DELIVERY': 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};
