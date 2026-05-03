import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBox, FiLogOut, FiMapPin, FiPackage, FiPlus, FiShoppingBag, FiTag, FiTruck } from 'react-icons/fi';
import axios from 'axios';
import sellerApi from '../api/sellerApi';
import Button from '../components/Button';

type Product = {
  _id: string;
  name: string;
  category?: string;
  isActive?: boolean;
  images?: string[];
  variants?: Array<{ stock?: number; price?: number }>;
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

const DashboardTopBar = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerProfile');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-text">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <FiShoppingBag size={22} />
          </span>
          <span className="text-lg font-bold">Seller Admin</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-600">
          <Link className="rounded-lg px-3 py-2 text-accent hover:bg-secondary" to="/dashboard">Dashboard</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/products">Products</Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/orders">Orders</Link>
          <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-text hover:border-primary hover:text-accent">
            <FiLogOut size={18} />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

const DashboardFooter = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>Seller Admin</p>
      <p>Built around seller routes for products, shipping, and offers.</p>
    </div>
  </footer>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sellerToken');

    if (!token) {
      setNotice('Login to connect this dashboard to your seller account.');
      setIsLoading(false);
      return;
    }

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
      { label: 'Products', value: products.length, icon: <FiPackage size={24} /> },
      { label: 'Active', value: activeProducts, icon: <FiBox size={24} /> },
      { label: 'Stock Units', value: stock, icon: <FiShoppingBag size={24} /> },
      { label: 'Categories', value: categories, icon: <FiTag size={24} /> },
    ];
  }, [products]);

  const shippingRates = shippingConfig?.shippingRates ? Object.entries(shippingConfig.shippingRates) : [];
  const hasProducts = products.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <DashboardTopBar />
      <main className="flex-1">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Overview</p>
              <h1 className="mt-2 text-2xl font-bold text-text">Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Track your seller catalog, stock health, shipping setup, and the next actions from one calm workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/products" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-text shadow-md hover:border-primary hover:text-accent">
                <FiPackage size={18} />
                Products
              </Link>
              <Button
                type="button"
                label="New product"
                icon={<FiPlus size={18} />}
                onClick={() => navigate('/products/new')}
                className="px-4 py-3"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
          {notice && <div className="rounded-lg border border-primary bg-white p-4 text-sm text-accent shadow-md">{notice}</div>}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">{stat.icon}</span>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-text">{isLoading ? '-' : stat.value}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-text">Recent Products</h2>
                  <p className="text-sm text-gray-600">Latest items returned by the seller products endpoint.</p>
                </div>
                <Link to="/products" className="text-sm font-semibold text-accent hover:underline">View all</Link>
              </div>

              <div className="mt-4 space-y-3">
                {isLoading && <p className="rounded-lg bg-secondary p-4 text-sm text-gray-600">Loading product data...</p>}
                {!isLoading && !hasProducts && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                    <FiPackage className="mx-auto text-primary" size={28} />
                    <h3 className="mt-3 text-lg font-bold text-text">No products yet</h3>
                    <p className="mt-1 text-sm text-gray-600">Create your first product listing to populate dashboard metrics.</p>
                  </div>
                )}
                {!isLoading && products.map((product) => (
                  <article key={product._id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-primary">
                        {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" /> : <FiPackage size={22} />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-text">{product.name}</h3>
                        <p className="truncate text-sm text-gray-600">{product.category ?? 'Uncategorized'}</p>
                      </div>
                    </div>
                    <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${product.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <FiTruck size={22} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text">Shipping</h2>
                    <p className="text-sm text-gray-600">
                      {shippingConfig?.origin?.city ? `${shippingConfig.origin.city}, ${shippingConfig.origin.state ?? ''}` : 'Origin not configured'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {shippingRates.length === 0 && <p className="rounded-lg bg-secondary p-4 text-sm text-gray-600">No shipping rates found.</p>}
                  {shippingRates.slice(0, 4).map(([name, rate]) => (
                    <div key={name} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold capitalize text-text">{name.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-xs text-gray-600">{rate.time ?? 'Time not set'}</p>
                      </div>
                      <p className="text-sm font-bold text-accent">{formatCurrency(rate.cost ?? 0)}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <FiMapPin size={22} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text">Next Actions</h2>
                    <p className="text-sm text-gray-600">Keep the seller setup moving.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {['Add product images and variants', 'Review inactive products', 'Configure shipping rates', 'Create product offers'].map((action, index) => (
                    <div key={action} className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-bold text-accent">{index + 1}</span>
                      <p className="text-sm font-semibold text-text">{action}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>
        </section>
      </main>
      <DashboardFooter />
    </div>
  );
};

export default DashboardPage;
