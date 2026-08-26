import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiBarChart2, FiBox, FiPackage, FiPlus, FiShoppingBag, FiTag, FiTruck } from 'react-icons/fi';
import axios from 'axios';
import sellerApi from '../api/sellerApi';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import MobileActionBar from '../components/layout/MobileActionBar';
import Button from '../components/ui/Button';
import Panel from '../components/ui/Panel';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import ImageFrame from '../components/ui/ImageFrame';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';

const LOW_STOCK_THRESHOLD = 5;

type Product = {
  _id: string;
  name: string;
  category?: string;
  isActive?: boolean;
  images?: string[];
  variants?: Array<{ sku?: string; attributes?: Record<string, string>; stock?: number; price?: number }>;
};

type ShippingConfig = {
  origin?: {
    city?: string;
    state?: string;
    region?: string;
  };
  shippingRates?: Record<string, { cost?: number; time?: string }>;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState('');

  // RequireSellerAuth already guarantees a sellerToken exists for every
  // route inside AdminLayout, so this effect no longer needs to guard for
  // one — that removes the setState-in-effect branch the earlier fix
  // worked around.
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [productsResponse, shippingResponse] = await Promise.all([
          sellerApi.get('/products/get-all-products', { params: { limit: 6 } }),
          sellerApi.get('/shipping/get-shipping-config'),
        ]);

        setProducts(productsResponse.data.data?.products ?? []);
        setShippingConfig(shippingResponse.data.data ?? null);
      } catch (err) {
        const fallbackNotice = axios.isAxiosError(err) && err.response?.status
          ? 'Some dashboard data is not available yet.'
          : 'Unable to reach the server right now. Showing the dashboard shell.';
        setNotice(fallbackNotice);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.isActive).length;
    const stock = products.reduce((total, product) => {
      const variantStock = product.variants?.reduce((sum, variant) => sum + (variant.stock ?? 0), 0) ?? 0;
      return total + variantStock;
    }, 0);
    const categories = new Set(products.map((product) => product.category).filter(Boolean)).size;

    return [
      { label: 'PRODUCTS', value: products.length, icon: <FiPackage size={20} /> },
      { label: 'ACTIVE', value: activeProducts, icon: <FiBox size={20} /> },
      { label: 'STOCK UNITS', value: stock, icon: <FiShoppingBag size={20} /> },
      { label: 'CATEGORIES', value: categories, icon: <FiTag size={20} /> },
    ];
  }, [products]);

  const shippingRates = shippingConfig?.shippingRates ? Object.entries(shippingConfig.shippingRates) : [];
  const hasProducts = products.length > 0;

  const lowStockVariants = useMemo(() => {
    return products.flatMap((product) =>
      (product.variants ?? [])
        .filter((variant) => (variant.stock ?? 0) <= LOW_STOCK_THRESHOLD)
        .map((variant) => ({
          key: `${product._id}-${variant.sku ?? Object.values(variant.attributes ?? {}).join('-')}`,
          productName: product.name,
          image: product.images?.[0],
          sku: variant.sku,
          left: variant.stock ?? 0,
        })),
    );
  }, [products]);

  return (
    <Container className="py-6 pb-28 lg:pb-8 lg:py-8">
      <PageHeader
        title="Dashboard"
        subtitle="Track your seller catalog, stock health, shipping setup, and the next actions from one calm workspace."
        actions={
          <>
            <Link
              to="/products"
              className="hidden items-center gap-2 rounded-btn border border-line bg-card px-4.5 py-3 text-[12.5px] font-bold text-ink t-fast hover:border-accent hover:text-accent lg:flex"
            >
              <FiPackage size={16} />
              Products
            </Link>
            <Button variant="primary" icon={<FiPlus size={16} />} onClick={() => navigate('/products/new')} className="hidden lg:inline-flex">
              New product
            </Button>
          </>
        }
      />

      <MobileActionBar>
        <Button variant="outline" fullWidth onClick={() => navigate('/products')} icon={<FiPackage size={16} />}>
          Products
        </Button>
        <Button variant="primary" fullWidth icon={<FiPlus size={16} />} onClick={() => navigate('/products/new')}>
          New product
        </Button>
      </MobileActionBar>

      {notice && (
        <div className="mb-6 rounded-btn border border-warn-fg/30 bg-warn-bg p-4 text-sm font-semibold text-warn-fg">{notice}</div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={isLoading ? '—' : stat.value} />
        ))}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[16px] font-extrabold text-ink">Revenue · last 7 days</span>
          </div>
          <EmptyState
            icon={<FiBarChart2 size={28} />}
            title="No revenue data yet"
            description="Revenue reporting needs order history, which the seller API doesn't expose yet."
          />
        </Panel>
        <div className="rounded-panel bg-soft p-6 text-[var(--k-on-soft)]">
          <p className="mb-4.5 text-[15px] font-extrabold">Fulfilment queue</p>
          <p className="text-[12.5px] font-semibold opacity-70">
            Needs an orders endpoint on the seller API — not available yet.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-extrabold text-ink">Recent Products</h2>
              <p className="text-[12.5px] font-semibold text-muted">Latest items returned by the seller products endpoint.</p>
            </div>
            <Link to="/products" className="text-[12.5px] font-bold text-accent hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} preset="row" />)}
            {!isLoading && !hasProducts && (
              <EmptyState
                icon={<FiPackage size={28} />}
                title="No products yet"
                description="Create your first product listing to populate dashboard metrics."
              />
            )}
            {!isLoading && products.map((product) => (
              <article key={product._id} className="flex items-center justify-between gap-4 rounded-tile border border-line p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ImageFrame src={product.images?.[0]} alt={product.name} className="h-12 w-12 shrink-0 rounded-[12px]" />
                  <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-bold text-ink">{product.name}</h3>
                    <p className="truncate text-[12px] font-medium text-muted">{product.category ?? 'Uncategorized'}</p>
                  </div>
                </div>
                <Badge tone={product.isActive ? 'success' : 'plum'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
              </article>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
                <FiTruck size={20} />
              </span>
              <div>
                <h2 className="text-[16px] font-extrabold text-ink">Shipping</h2>
                <p className="text-[12.5px] font-semibold text-muted">
                  {shippingConfig?.origin?.city ? `${shippingConfig.origin.city}, ${shippingConfig.origin.state ?? ''}` : 'Origin not configured'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {shippingRates.length === 0 && <p className="rounded-tile bg-soft2 p-4 text-[12.5px] font-medium text-muted">No shipping rates found.</p>}
              {shippingRates.slice(0, 4).map(([name, rate]) => (
                <div key={name} className="flex items-center justify-between rounded-tile border border-line p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold capitalize text-ink">{name.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-[11px] font-medium text-muted">{rate.time ?? 'Time not set'}</p>
                  </div>
                  <p className="text-[12.5px] font-extrabold text-accent">{formatCurrency(rate.cost ?? 0)}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
                <FiAlertTriangle size={20} />
              </span>
              <div>
                <h2 className="text-[16px] font-extrabold text-ink">Low stock</h2>
                <p className="text-[12.5px] font-semibold text-muted">
                  Among your {products.length} most recent product{products.length === 1 ? '' : 's'} — not the full catalog.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {!isLoading && lowStockVariants.length === 0 && (
                <p className="rounded-tile bg-soft2 p-4 text-[12.5px] font-medium text-muted">
                  Nothing low on stock among your recent products.
                </p>
              )}
              {isLoading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} preset="row" />)}
              {!isLoading && lowStockVariants.slice(0, 4).map((item) => (
                <div key={item.key} className="flex items-center gap-3 rounded-tile p-3 t-fast hover:bg-soft2">
                  <ImageFrame src={item.image} alt={item.productName} className="h-10.5 w-10.5 shrink-0 rounded-[12px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold text-ink">{item.productName}</p>
                    {item.sku && <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted">{item.sku}</p>}
                  </div>
                  <Badge tone="plum">{item.left} left</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Container>
  );
};

export default DashboardPage;
