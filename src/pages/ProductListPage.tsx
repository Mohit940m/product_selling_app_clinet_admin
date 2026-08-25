import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import MobileActionBar from '../components/layout/MobileActionBar';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Badge from '../components/ui/Badge';
import ImageFrame from '../components/ui/ImageFrame';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DataTable, { type DataTableColumn } from '../components/ui/DataTable';
import sellerApi from '../api/sellerApi';

type ProductListItem = {
  _id: string;
  name: string;
  category?: string;
  isActive: boolean;
  isFeatured?: boolean;
  images?: string[];
  sku?: string | null;
  price?: number | null;
};

type DeleteTarget = {
  id: string;
  name: string;
} | null;

type StatusFilter = 'all' | 'active' | 'inactive';

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }

  return err instanceof Error ? err.message : fallback;
};

const ProductListPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [busyProductId, setBusyProductId] = useState('');

  const loadProducts = async () => {
    setIsLoading(true);

    try {
      const { data } = await sellerApi.get('/products/get-all-products', {
        params: { limit: 50, search: search || undefined },
      });
      setProducts(data.data?.products ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to load products.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(loadProducts, 250);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const visibleProducts = useMemo(() => products.filter((product) => {
    if (statusFilter === 'active') return product.isActive;
    if (statusFilter === 'inactive') return !product.isActive;
    return true;
  }), [products, statusFilter]);

  const toggleStatus = async (product: ProductListItem) => {
    setBusyProductId(product._id);

    try {
      const nextStatus = !product.isActive;
      await sellerApi.patch(`/products/edit-product-status/${product._id}`, { status: nextStatus });
      setProducts((current) => current.map((item) => (
        item._id === product._id ? { ...item, isActive: nextStatus } : item
      )));
      toast.success(`${product.name} ${nextStatus ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update product status.'));
    } finally {
      setBusyProductId('');
    }
  };

  const softDeleteProduct = async () => {
    if (!deleteTarget) return;
    setBusyProductId(deleteTarget.id);

    try {
      await sellerApi.delete(`/products/delete-product/${deleteTarget.id}`);
      setProducts((current) => current.filter((product) => product._id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} moved out of active catalog.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to delete product.'));
    } finally {
      setBusyProductId('');
    }
  };

  const rowActions = (product: ProductListItem) => (
    <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => toggleStatus(product)}
        disabled={busyProductId === product._id}
        className={`rounded-full px-3 py-1.5 text-[11px] font-bold t-fast disabled:opacity-60 ${
          product.isActive ? 'bg-line text-muted hover:bg-edge/10' : 'bg-ok-bg text-ok-fg'
        }`}
      >
        {product.isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button
        type="button"
        onClick={() => navigate(`/products/${product._id}/edit`)}
        className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[11px] font-bold text-ink t-fast hover:border-accent hover:text-accent"
      >
        <FiEdit2 size={13} />
        Edit
      </button>
      <button
        type="button"
        onClick={() => setDeleteTarget({ id: product._id, name: product.name })}
        className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[11px] font-bold text-muted t-fast hover:border-danger hover:text-danger"
      >
        <FiTrash2 size={13} />
        Delete
      </button>
    </div>
  );

  const columns: DataTableColumn<ProductListItem>[] = [
    {
      key: 'product',
      header: 'PRODUCT',
      width: '1.6fr',
      render: (product) => (
        <div className="flex items-center gap-3">
          <ImageFrame src={product.images?.[0]} alt={product.name} className="h-12 w-12 shrink-0 rounded-[12px]" />
          <div className="min-w-0">
            <Link
              to={`/products/${product._id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-[13px] font-bold text-ink hover:text-accent hover:underline"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 font-mono text-[10.5px] text-muted">{product.sku ?? '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'CATEGORY', width: '.9fr', render: (p) => <span className="text-muted">{p.category ?? '-'}</span> },
    { key: 'price', header: 'PRICE', width: '.8fr', render: (p) => <span className="font-extrabold text-ink">{formatCurrency(p.price)}</span> },
    {
      key: 'status',
      header: 'STATUS',
      width: '.8fr',
      render: (p) => <Badge tone={p.isActive ? 'success' : 'plum'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    { key: 'actions', header: 'ACTIONS', width: '1.4fr', align: 'right', render: rowActions },
  ];

  return (
    <Container className="py-6 pb-28 lg:pb-8 lg:py-8">
      <PageHeader
        title="Products"
        subtitle={`${products.length} products · ${products.filter((p) => p.isActive).length} active`}
        actions={
          <Button variant="primary" icon={<FiPlus size={16} />} onClick={() => navigate('/products/new')} className="hidden lg:inline-flex">
            New product
          </Button>
        }
      />

      <MobileActionBar>
        <Button variant="primary" fullWidth icon={<FiPlus size={16} />} onClick={() => navigate('/products/new')}>
          New product
        </Button>
      </MobileActionBar>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-line px-4 py-2.5 t-fast focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent lg:max-w-[340px]">
          <FiSearch className="shrink-0 text-muted" size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-base outline-none placeholder:text-muted sm:text-[12.5px]"
            placeholder="Search by product name"
          />
        </div>
        <div className="flex gap-2">
          <Chip selected={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</Chip>
          <Chip selected={statusFilter === 'active'} onClick={() => setStatusFilter('active')}>Active</Chip>
          <Chip selected={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')}>Inactive</Chip>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={visibleProducts}
        rowKey={(p) => p._id}
        onRowClick={(p) => navigate(`/products/${p._id}`)}
        loading={isLoading}
        empty={
          <EmptyState
            icon={<FiPackage size={30} />}
            title="No products found"
            description="Try changing filters or add a new product."
          />
        }
        mobileCard={(product) => (
          <div className="rounded-card border border-line bg-card p-3.5">
            <div className="flex items-center gap-3">
              <ImageFrame src={product.images?.[0]} alt={product.name} className="h-14 w-14 shrink-0 rounded-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink">{product.name}</p>
                <p className="truncate text-[11.5px] font-medium text-muted">{product.category ?? 'Uncategorized'}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[13px] font-extrabold text-ink">{formatCurrency(product.price)}</span>
                  <Badge tone={product.isActive ? 'success' : 'plum'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-3 border-t border-line pt-3">{rowActions(product)}</div>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={softDeleteProduct}
        title="Soft delete product?"
        description={deleteTarget ? `This will deactivate and hide "${deleteTarget.name}" from the seller catalog.` : undefined}
        confirmLabel="Yes, delete"
        loading={busyProductId === deleteTarget?.id}
      />
    </Container>
  );
};

export default ProductListPage;
