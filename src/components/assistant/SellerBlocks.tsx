import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiCheckCircle, FiExternalLink, FiXCircle } from 'react-icons/fi';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ImageFrame from '../ui/ImageFrame';
import statusTone from '../ui/statusTone';
import {
  LOW_STOCK_THRESHOLD,
  STATUS_LABELS,
  formatAttributes,
  formatCurrency,
  type ChatMessage,
  type SellerCheckoutsData,
  type SellerOrderView,
  type SellerProductDetail,
  type SellerProductRow,
} from './types';

type Send = (message: string) => void;

const blockShell = 'rounded-tile border border-line bg-card';

const StockBadge = ({ stock }: { stock: number }) =>
  stock === 0 ? (
    <Badge tone="danger">Out of stock</Badge>
  ) : stock <= LOW_STOCK_THRESHOLD ? (
    <Badge tone="warn">Low · {stock}</Badge>
  ) : (
    <Badge tone="success">{stock} in stock</Badge>
  );

export const SellerProductsBlock = ({ data, onSend, disabled }: { data: { items: SellerProductRow[]; total: number }; onSend: Send; disabled: boolean }) => {
  if (data.items.length === 0) {
    return <p className={`${blockShell} p-3.5 text-[12.5px] font-medium text-muted`}>No products found.</p>;
  }
  return (
    <div className={blockShell}>
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="font-mono text-[10.5px] font-extrabold text-muted">PRODUCTS · {data.items.length} OF {data.total}</span>
        <Link to="/products" className="text-[11.5px] font-bold text-accent hover:underline">
          Open products
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {data.items.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
            <ImageFrame src={p.image} alt={p.name} className="h-10 w-10 shrink-0 rounded-[10px]" />
            <div className="min-w-0 flex-1">
              <Link to={`/products/${p.id}`} className="block truncate text-[13px] font-bold text-ink hover:text-accent">
                {p.name}
              </Link>
              <p className="truncate text-[11.5px] font-medium text-muted">
                {p.category ?? 'Uncategorized'} · {p.variantCount} variant{p.variantCount === 1 ? '' : 's'} · from {formatCurrency(p.price)}
                {!p.isActive && ' · inactive'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StockBadge stock={p.minVariantStock} />
              <Button variant="soft" size="sm" className="py-2!" disabled={disabled} onClick={() => onSend(`Show variants and stock for "${p.name}"`)}>
                Stock
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-3.5 py-2 text-[11px] font-medium text-muted">
        Badge shows the lowest-stock variant. Total units: {data.items.reduce((s, p) => s + p.totalStock, 0)}.
      </p>
    </div>
  );
};

export const SellerProductBlock = ({ data, onSend, disabled }: { data: SellerProductDetail; onSend: Send; disabled: boolean }) => (
  <div className={blockShell}>
    <div className="flex items-center gap-3 border-b border-line p-3.5">
      <ImageFrame src={data.images[0]} alt={data.name} className="h-12 w-12 shrink-0 rounded-[12px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-extrabold text-ink">{data.name}</p>
        <p className="truncate text-[11.5px] font-medium text-muted">
          {data.category ?? 'Uncategorized'} · {data.isActive ? 'Active' : 'Inactive'}
        </p>
      </div>
      <Link
        to={`/products/${data.id}`}
        className="inline-flex items-center gap-1 text-[11.5px] font-bold text-accent hover:underline"
      >
        Manage <FiExternalLink size={12} />
      </Link>
    </div>
    <ul className="divide-y divide-line">
      {data.variants.map((v) => (
        <li key={v.id} className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-ink">{formatAttributes(v.attributes) || 'Default'}</p>
            <p className="text-[11px] font-medium text-muted">
              {v.sku ?? '—'} · {formatCurrency(v.price)}
              {!v.isActive && ' · inactive'}
            </p>
          </div>
          <StockBadge stock={v.stock} />
          <Button
            variant="soft"
            size="sm"
            className="py-2!"
            disabled={disabled}
            onClick={() => onSend(`Restock ${data.name} (${formatAttributes(v.attributes) || 'default variant'}) by 10 units`)}
          >
            +10
          </Button>
        </li>
      ))}
    </ul>
  </div>
);

const OrderItems = ({ order }: { order: SellerOrderView }) => (
  <ul className="space-y-2">
    {order.items.map((item) => (
      <li key={item.subOrderId} className="flex items-center gap-2.5">
        <ImageFrame src={item.image} alt={item.name} className="h-9 w-9 shrink-0 rounded-[9px]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold text-ink">
            {item.name} <span className="font-medium text-muted">× {item.quantity}</span>
          </p>
          <p className="truncate font-mono text-[10.5px] text-muted">
            {item.subOrderId}
            {item.tracking?.trackingId && ` · ${item.tracking.courier ?? 'Courier'} ${item.tracking.trackingId}`}
          </p>
        </div>
        <Badge tone={statusTone(item.status)}>{STATUS_LABELS[item.status] ?? item.status}</Badge>
      </li>
    ))}
  </ul>
);

export const SellerOrdersBlock = ({ data }: { data: { items: SellerOrderView[]; total: number } }) => {
  if (data.items.length === 0) {
    return <p className={`${blockShell} p-3.5 text-[12.5px] font-medium text-muted`}>No paid orders yet.</p>;
  }
  return (
    <div className={blockShell}>
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="font-mono text-[10.5px] font-extrabold text-muted">ORDERS · {data.items.length} OF {data.total}</span>
        <Link to="/orders" className="text-[11.5px] font-bold text-accent hover:underline">
          Open orders
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {data.items.map((order) => (
          <li key={order.id} className="space-y-2.5 px-3.5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11.5px] font-bold text-ink">{order.orderId}</span>
              <span className="text-[12px] font-extrabold text-ink">{formatCurrency(order.sellerSubtotal)}</span>
            </div>
            <p className="text-[11.5px] font-medium text-muted">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {order.shipTo.fullName}, {order.shipTo.city}
            </p>
            <OrderItems order={order} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export const SellerOrderBlock = ({ data }: { data: SellerOrderView }) => (
  <div className={`${blockShell} space-y-2.5 p-3.5`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="font-mono text-[11.5px] font-bold text-ink">{data.orderId}</span>
      <Link to="/orders" className="text-[11.5px] font-bold text-accent hover:underline">
        Open orders
      </Link>
    </div>
    <p className="text-[11.5px] font-medium text-muted">
      Ship to {data.shipTo.fullName}, {data.shipTo.city} {data.shipTo.pincode} · your subtotal {formatCurrency(data.sellerSubtotal)}
    </p>
    <OrderItems order={data} />
  </div>
);

const CHECKOUT_FILTER_LABELS: Record<SellerCheckoutsData['status'], string> = {
  not_placed: 'NOT PLACED',
  completed: 'COMPLETED',
  all: 'ALL CHECKOUTS',
};

export const SellerCheckoutsBlock = ({ data }: { data: SellerCheckoutsData }) => (
  <div className={blockShell}>
    <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
      <span className="font-mono text-[10.5px] font-extrabold text-muted">
        {CHECKOUT_FILTER_LABELS[data.status] ?? 'CHECKOUTS'} · {data.items.length} OF {data.total}
      </span>
      <Link to="/checkouts" className="text-[11.5px] font-bold text-accent hover:underline">
        Open checkouts
      </Link>
    </div>
    <p className="border-b border-line px-3.5 py-2 text-[11.5px] font-semibold text-muted">
      {data.summary.notPlaced} not placed · {data.summary.completed} completed
    </p>
    {data.items.length === 0 ? (
      <p className="p-3.5 text-[12.5px] font-medium text-muted">No customers in this list.</p>
    ) : (
      <ul className="divide-y divide-line">
        {data.items.map((c) => (
          <li key={c.id} className="space-y-2 px-3.5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-ink">{c.customer.name ?? 'Unnamed customer'}</p>
                <p className="truncate text-[11.5px] font-medium text-muted">
                  {[c.customer.email, c.customer.phone].filter(Boolean).join(' · ') || 'No email or phone'}
                </p>
              </div>
              {c.status === 'COMPLETED' ? (
                <Badge tone="success">Order placed</Badge>
              ) : (
                <Badge tone="warn">{c.reachedPayment ? 'Payment not done' : 'Not placed'}</Badge>
              )}
            </div>
            <ul className="space-y-1.5">
              {c.items.map((item) => (
                <li key={`${item.productId}-${formatAttributes(item.attributes)}`} className="flex items-center gap-2.5">
                  <ImageFrame src={item.image} alt={item.name} className="h-8 w-8 shrink-0 rounded-[8px]" />
                  <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink">
                    {item.name} <span className="font-medium text-muted">× {item.quantity}</span>
                  </p>
                  <span className="text-[12px] font-bold text-ink">{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] font-medium text-muted">
              {new Date(c.lastCheckoutAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} · via{' '}
              {c.sources.length > 1 ? 'app + AI assistant' : c.sources[0] === 'assistant' ? 'AI assistant' : 'store app'}
              {c.orderId && ` · ${c.orderId}`}
            </p>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export const NoticeBlock = ({ data }: { data: { tone: 'success' | 'error'; message: string } }) => (
  <p
    role={data.tone === 'error' ? 'alert' : 'status'}
    className={`flex items-center gap-2 rounded-tile px-3.5 py-2.5 text-[12.5px] font-bold ${
      data.tone === 'success' ? 'bg-ok-bg text-ok-fg' : 'bg-bad-bg text-bad-fg'
    }`}
  >
    {data.tone === 'success' ? <FiCheckCircle size={15} /> : <FiXCircle size={15} />}
    {data.message}
  </p>
);

type PendingProps = {
  pending: NonNullable<ChatMessage['pendingAction']>;
  isLatest: boolean;
  busy: boolean;
  onDecide: (actionId: string, confirmed: boolean) => void;
};

export const PendingActionCard = ({ pending, isLatest, busy, onDecide }: PendingProps) => {
  const open = pending.status === 'pending' && isLatest;
  return (
    <div className="rounded-tile border border-warn-fg/30 bg-warn-bg p-3.5 text-warn-fg">
      <p className="flex items-start gap-2 text-[13px] font-bold">
        <FiAlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>{pending.summary}</span>
      </p>
      {open ? (
        <div className="mt-3 flex gap-2.5">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onDecide(pending.id, false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={busy} onClick={() => onDecide(pending.id, true)}>
            Confirm
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-[11.5px] font-semibold opacity-80">
          {pending.status === 'confirmed' ? 'Confirmed' : pending.status === 'cancelled' ? 'Cancelled' : 'Expired'}
        </p>
      )}
    </div>
  );
};
