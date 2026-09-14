import { useEffect, useState } from 'react';
import { FiPackage } from 'react-icons/fi';
import axios from 'axios';
import sellerApi from '../api/sellerApi';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DataTable, { type DataTableColumn } from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import ImageFrame from '../components/ui/ImageFrame';
import Sheet from '../components/ui/Sheet';
import statusTone from '../components/ui/statusTone';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Matches product_selling_app_server/src/models/orderModels/order.model.ts ORDER_STATUS.
type OrderStatus = 'CREATED' | 'CONFIRMED' | 'SHIPPED' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'CANCELLED';

const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Created',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  'OUT FOR DELIVERY': 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

type SellerOrderItem = {
  productId: string;
  variantId: string;
  name: string;
  image: string;
  priceAtPurchase: number;
  quantity: number;
  attributes: Record<string, unknown>;
};

type SellerOrder = {
  _id: string;
  orderId: string;
  createdAt: string;
  paymentStatus: 'PAID' | 'REFUNDED';
  orderStatus: OrderStatus;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  tracking?: { courier?: string; trackingId?: string; trackingUrl?: string };
  items: SellerOrderItem[];
  itemCount: number;
  sellerSubtotal: number;
};

const PAGE_SIZE = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const formatAttributes = (attributes: Record<string, unknown> | undefined) =>
  Object.entries(attributes ?? {})
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');

const OrderStatusBadge = ({ order }: { order: SellerOrder }) =>
  order.paymentStatus === 'REFUNDED' ? (
    <Badge tone={statusTone('REFUNDED')}>Refunded</Badge>
  ) : (
    <Badge tone={statusTone(order.orderStatus)}>{STATUS_LABELS[order.orderStatus] ?? order.orderStatus}</Badge>
  );

/**
 * Backed by `GET /orders` (seller): paid/refunded orders containing this
 * seller's products, with only this seller's line items and subtotal.
 * Read-only — the API has no endpoint to update status or tracking yet.
 */
const OrderListPage = () => {
  useDocumentTitle('Orders');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SellerOrder | null>(null);
  const isLoading = loadedPage !== page;

  useEffect(() => {
    let cancelled = false;
    sellerApi
      .get('/orders', { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (cancelled) return;
        setOrders(data.data ?? []);
        setTotal(data.pagination?.total ?? 0);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setOrders([]);
        setTotal(0);
        setError(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Unable to load orders.' : 'Unable to load orders.');
      })
      .finally(() => {
        if (!cancelled) setLoadedPage(page);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: DataTableColumn<SellerOrder>[] = [
    {
      key: 'order',
      header: 'ORDER',
      width: '1.4fr',
      render: (o) => (
        <div className="min-w-0">
          <p className="truncate font-mono text-[11.5px] font-bold text-ink">{o.orderId}</p>
          <p className="text-[12px] font-medium text-muted">{formatDate(o.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'SHIP TO',
      width: '1.2fr',
      render: (o) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{o.shippingAddress.fullName}</p>
          <p className="truncate text-[12px] font-medium text-muted">
            {o.shippingAddress.city}, {o.shippingAddress.state}
          </p>
        </div>
      ),
    },
    { key: 'items', header: 'ITEMS', width: '.6fr', render: (o) => <span className="font-semibold text-ink">{o.itemCount}</span> },
    { key: 'status', header: 'STATUS', width: '.9fr', render: (o) => <OrderStatusBadge order={o} /> },
    {
      key: 'subtotal',
      header: 'YOUR SUBTOTAL',
      width: '.9fr',
      align: 'right',
      render: (o) => <span className="font-extrabold text-ink">{formatCurrency(o.sellerSubtotal)}</span>,
    },
  ];

  return (
    <Container className="py-6 lg:py-8">
      <PageHeader
        title="Orders"
        subtitle="Paid orders that include your products. Only your own items and subtotal are shown."
      />

      {error && (
        <div className="mb-5 rounded-btn border border-bad-fg/30 bg-bad-bg p-4 text-sm font-semibold text-bad-fg" role="alert">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={orders}
        rowKey={(o) => o._id}
        loading={isLoading}
        onRowClick={setSelected}
        empty={
          <div className="rounded-panel border border-line bg-card p-4 sm:p-8">
            <EmptyState
              icon={<FiPackage size={30} />}
              title="No orders yet"
              description="Paid orders that include your products will appear here."
            />
          </div>
        }
        mobileCard={(o) => (
          <Card padded interactive={false}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-mono text-[11.5px] font-bold text-ink">{o.orderId}</p>
                <p className="mt-0.5 text-[12px] font-medium text-muted">
                  {formatDate(o.createdAt)} · {o.shippingAddress.fullName}
                </p>
              </div>
              <OrderStatusBadge order={o} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-muted">
                {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
              </span>
              <span className="font-extrabold text-ink">{formatCurrency(o.sellerSubtotal)}</span>
            </div>
          </Card>
        )}
      />

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
            Previous
          </Button>
          <span className="text-[12.5px] font-semibold text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? selected.orderId : 'Order'}>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] font-semibold text-muted">Placed {formatDate(selected.createdAt)}</span>
              <OrderStatusBadge order={selected} />
            </div>

            <section>
              <h3 className="mb-2.5 font-mono text-[10.5px] font-extrabold text-muted">YOUR ITEMS</h3>
              <ul className="space-y-2.5">
                {selected.items.map((item) => (
                  <li key={`${item.productId}-${item.variantId}`} className="flex gap-3 rounded-tile border border-line bg-card p-3">
                    <ImageFrame src={item.image} alt={item.name} className="h-12 w-12 shrink-0 rounded-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-bold text-ink">{item.name}</p>
                      {formatAttributes(item.attributes) && (
                        <p className="text-[12px] font-medium text-muted">{formatAttributes(item.attributes)}</p>
                      )}
                      <p className="text-[12px] font-medium text-muted">
                        {formatCurrency(item.priceAtPurchase)} × {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-extrabold text-ink">
                      {formatCurrency(item.priceAtPurchase * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-[13px]">
                <span className="font-bold text-ink">Your subtotal</span>
                <span className="font-black text-ink">{formatCurrency(selected.sellerSubtotal)}</span>
              </div>
            </section>

            <section>
              <h3 className="mb-2.5 font-mono text-[10.5px] font-extrabold text-muted">SHIP TO</h3>
              <address className="rounded-tile border border-line bg-card p-3 text-[12.5px] not-italic leading-relaxed text-muted">
                <span className="block font-bold text-ink">{selected.shippingAddress.fullName}</span>
                {selected.shippingAddress.addressLine1}
                {selected.shippingAddress.addressLine2 && <>, {selected.shippingAddress.addressLine2}</>}
                <br />
                {selected.shippingAddress.city}, {selected.shippingAddress.state} {selected.shippingAddress.pincode}
                <br />
                {selected.shippingAddress.country}
                <span className="mt-1 block font-mono text-[11.5px]">{selected.shippingAddress.phone}</span>
              </address>
            </section>

            {selected.tracking?.trackingId && (
              <section>
                <h3 className="mb-2.5 font-mono text-[10.5px] font-extrabold text-muted">TRACKING</h3>
                <p className="text-[12.5px] font-semibold text-ink">
                  {selected.tracking.courier || 'Courier'} · <span className="font-mono">{selected.tracking.trackingId}</span>
                </p>
              </section>
            )}

            <p className="text-[12px] font-medium text-muted">
              Updating order status or adding tracking isn't available from the seller API yet.
            </p>
          </div>
        )}
      </Sheet>
    </Container>
  );
};

export default OrderListPage;
