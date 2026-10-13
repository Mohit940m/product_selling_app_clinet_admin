import { useEffect, useState } from 'react';
import { FiMail, FiPhone, FiShoppingCart } from 'react-icons/fi';
import axios from 'axios';
import sellerApi from '../api/sellerApi';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import DataTable, { type DataTableColumn } from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import ImageFrame from '../components/ui/ImageFrame';
import Sheet from '../components/ui/Sheet';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Matches GET /api/v1/seller/checkouts in product_selling_app_server
// (controllers/seller.controllers/checkout.controller.ts).
type CheckoutStatus = 'NOT_PLACED' | 'COMPLETED';
type StatusFilter = 'not_placed' | 'completed' | 'all';

type CheckoutItem = {
  productId: string;
  variantId: string;
  name: string;
  image?: string;
  attributes?: Record<string, unknown>;
  quantity: number;
  price: number;
};

type SellerCheckout = {
  _id: string;
  status: CheckoutStatus;
  customer: { name: string | null; email: string | null; phone: string | null };
  items: CheckoutItem[];
  itemCount: number;
  sellerSubtotal: number;
  sources: ('app' | 'assistant')[];
  reachedPayment: boolean;
  checkoutCount: number;
  lastCheckoutAt: string;
  completedAt: string | null;
  orderId: string | null;
};

const PAGE_SIZE = 10;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'not_placed', label: 'Not placed' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

const formatAttributes = (attributes: Record<string, unknown> | undefined) =>
  Object.entries(attributes ?? {})
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');

const sourceLabel = (sources: SellerCheckout['sources']) =>
  sources.length > 1 ? 'App + AI assistant' : sources[0] === 'assistant' ? 'AI assistant' : 'Store app';

const CheckoutStatusBadge = ({ checkout }: { checkout: SellerCheckout }) =>
  checkout.status === 'COMPLETED' ? (
    <Badge tone="success">Order placed</Badge>
  ) : (
    <Badge tone="warn">{checkout.reachedPayment ? 'Payment not done' : 'Not placed'}</Badge>
  );

const CustomerCell = ({ customer }: { customer: SellerCheckout['customer'] }) => (
  <div className="min-w-0">
    <p className="truncate font-bold text-ink">{customer.name ?? 'Unnamed customer'}</p>
    {customer.email && <p className="truncate text-[12px] font-medium text-muted">{customer.email}</p>}
    {customer.phone && <p className="truncate font-mono text-[11.5px] text-muted">{customer.phone}</p>}
  </div>
);

const ItemsSummary = ({ items }: { items: CheckoutItem[] }) => (
  <div className="flex min-w-0 items-center gap-2">
    <div className="flex shrink-0 -space-x-2">
      {items.slice(0, 3).map((item) => (
        <ImageFrame key={item.variantId} src={item.image} alt={item.name} className="h-8 w-8 rounded-[9px] ring-2 ring-card" />
      ))}
    </div>
    <p className="truncate text-[12.5px] font-semibold text-ink">
      {items[0]?.name}
      {items.length > 1 && <span className="font-medium text-muted"> +{items.length - 1} more</span>}
    </p>
  </div>
);

/**
 * Logged-in buyers who reached checkout with this seller's products, from the
 * storefront or the AI shopping assistant. "Not placed" is the default view:
 * checkouts that never turned into a paid order. Guests can't check out, so
 * every row is a real account.
 */
const CheckoutsPage = () => {
  useDocumentTitle('Checkouts');
  const [filter, setFilter] = useState<StatusFilter>('not_placed');
  const [page, setPage] = useState(1);
  const [checkouts, setCheckouts] = useState<SellerCheckout[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<{ notPlaced: number; completed: number } | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SellerCheckout | null>(null);
  const requestKey = `${filter}:${page}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    sellerApi
      .get('/checkouts', { params: { status: filter, page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (cancelled) return;
        setCheckouts(data.data ?? []);
        setTotal(data.pagination?.total ?? 0);
        setSummary(data.summary ?? null);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setCheckouts([]);
        setTotal(0);
        setError(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Unable to load checkouts.' : 'Unable to load checkouts.');
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(`${filter}:${page}`);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const changeFilter = (next: StatusFilter) => {
    setFilter(next);
    setPage(1);
  };

  const countFor = (value: StatusFilter) =>
    !summary ? null : value === 'not_placed' ? summary.notPlaced : value === 'completed' ? summary.completed : summary.notPlaced + summary.completed;

  const columns: DataTableColumn<SellerCheckout>[] = [
    { key: 'customer', header: 'CUSTOMER', width: '1.4fr', render: (c) => <CustomerCell customer={c.customer} /> },
    { key: 'items', header: 'YOUR ITEMS', width: '1.4fr', render: (c) => <ItemsSummary items={c.items} /> },
    {
      key: 'when',
      header: 'LAST CHECKOUT',
      width: '1fr',
      render: (c) => (
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-ink">{formatDateTime(c.lastCheckoutAt)}</p>
          <p className="text-[12px] font-medium text-muted">via {sourceLabel(c.sources)}</p>
        </div>
      ),
    },
    { key: 'status', header: 'STATUS', width: '.9fr', render: (c) => <CheckoutStatusBadge checkout={c} /> },
    {
      key: 'value',
      header: 'VALUE',
      width: '.7fr',
      align: 'right',
      render: (c) => <span className="font-extrabold text-ink">{formatCurrency(c.sellerSubtotal)}</span>,
    },
  ];

  return (
    <Container className="py-6 lg:py-8">
      <PageHeader
        title="Checkouts"
        subtitle="Signed-in customers who went to checkout with your products, in the store or through the AI assistant, and whether they placed the order."
      />

      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((option) => {
          const count = countFor(option.value);
          return (
            <Chip key={option.value} selected={filter === option.value} onClick={() => changeFilter(option.value)}>
              {option.label}
              {count !== null && ` · ${count}`}
            </Chip>
          );
        })}
      </div>

      {error && (
        <div className="mb-5 rounded-btn border border-bad-fg/30 bg-bad-bg p-4 text-sm font-semibold text-bad-fg" role="alert">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={checkouts}
        rowKey={(c) => c._id}
        loading={isLoading}
        onRowClick={setSelected}
        empty={
          <div className="rounded-panel border border-line bg-card p-4 sm:p-8">
            <EmptyState
              icon={<FiShoppingCart size={30} />}
              title={filter === 'completed' ? 'No completed checkouts yet' : 'No unplaced checkouts'}
              description={
                filter === 'completed'
                  ? 'Customers who check out and pay for your products will appear here.'
                  : 'When a signed-in customer reaches checkout with your products and doesn’t pay, they’ll appear here.'
              }
            />
          </div>
        }
        mobileCard={(c) => (
          <Card padded interactive={false}>
            <div className="flex items-start justify-between gap-3">
              <CustomerCell customer={c.customer} />
              <CheckoutStatusBadge checkout={c} />
            </div>
            <div className="mt-3">
              <ItemsSummary items={c.items} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[12.5px]">
              <span className="font-semibold text-muted">
                {formatDateTime(c.lastCheckoutAt)} · {sourceLabel(c.sources)}
              </span>
              <span className="font-extrabold text-ink">{formatCurrency(c.sellerSubtotal)}</span>
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

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.customer.name ?? 'Checkout'}>
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12.5px] font-semibold text-muted">
                Last checkout {formatDateTime(selected.lastCheckoutAt)} via {sourceLabel(selected.sources)}
              </span>
              <CheckoutStatusBadge checkout={selected} />
            </div>

            {selected.status === 'COMPLETED' ? (
              <p className="rounded-tile bg-ok-bg p-3 text-[12px] font-semibold text-ok-fg">
                Paid
                {selected.completedAt && ` on ${formatDateTime(selected.completedAt)}`}
                {selected.orderId && (
                  <>
                    {' '}
                    as <span className="font-mono">{selected.orderId}</span>
                  </>
                )}
                .
              </p>
            ) : (
              <p className="rounded-tile bg-soft2 p-3 text-[12px] font-medium text-muted">
                {selected.reachedPayment
                  ? 'Opened the payment window but didn’t finish paying.'
                  : 'Viewed the checkout summary but didn’t go on to pay.'}
                {selected.checkoutCount > 1 && ` Came back to checkout ${selected.checkoutCount} times.`}
              </p>
            )}

            <section>
              <h3 className="mb-2.5 font-mono text-[10.5px] font-extrabold text-muted">CUSTOMER</h3>
              <div className="space-y-2 rounded-tile border border-line bg-card p-3 text-[12.5px]">
                <p className="font-bold text-ink">{selected.customer.name ?? 'Unnamed customer'}</p>
                {selected.customer.email && (
                  <a href={`mailto:${selected.customer.email}`} className="flex items-center gap-2 font-semibold text-accent hover:underline">
                    <FiMail size={14} /> {selected.customer.email}
                  </a>
                )}
                {selected.customer.phone && (
                  <a href={`tel:${selected.customer.phone}`} className="flex items-center gap-2 font-mono font-semibold text-accent hover:underline">
                    <FiPhone size={14} /> {selected.customer.phone}
                  </a>
                )}
                {!selected.customer.email && !selected.customer.phone && (
                  <p className="font-medium text-muted">No email or phone on this account.</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-2.5 font-mono text-[10.5px] font-extrabold text-muted">YOUR ITEMS IN THIS CHECKOUT</h3>
              <ul className="space-y-2.5">
                {selected.items.map((item) => (
                  <li key={item.variantId} className="flex gap-3 rounded-tile border border-line bg-card p-3">
                    <ImageFrame src={item.image} alt={item.name} className="h-12 w-12 shrink-0 rounded-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[13px] font-bold text-ink">{item.name}</p>
                      {formatAttributes(item.attributes) && (
                        <p className="text-[12px] font-medium text-muted">{formatAttributes(item.attributes)}</p>
                      )}
                      <p className="text-[12px] font-medium text-muted">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-extrabold text-ink">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-[13px]">
                <span className="font-bold text-ink">Value of your items</span>
                <span className="font-black text-ink">{formatCurrency(selected.sellerSubtotal)}</span>
              </div>
            </section>
          </div>
        )}
      </Sheet>
    </Container>
  );
};

export default CheckoutsPage;
