import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import Button from '../components/Button';
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
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(true);
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
  }, [search]);

  const visibleProducts = useMemo(() => products.filter((product) => {
    if (product.isActive && !showActive) return false;
    if (!product.isActive && !showInactive) return false;
    return true;
  }), [products, showActive, showInactive]);

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

  return (
    <div className="min-h-screen bg-background text-text">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Catalog</p>
            <h1 className="mt-2 text-2xl font-bold text-text">Products</h1>
            <p className="mt-1 text-sm text-gray-600">Review product info, open details, edit products, and control catalog status.</p>
          </div>
          <Button
            type="button"
            label="Add product"
            icon={<FiPlus size={18} />}
            onClick={() => navigate('/products/new')}
            className="py-3"
          />
        </div>

        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-gray-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary">
              <FiSearch className="text-primary" size={20} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full px-3 py-3 text-sm outline-none"
                placeholder="Search by product name"
              />
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-text">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <input type="checkbox" checked={showActive} onChange={(event) => setShowActive(event.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
                <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
                Deactive
              </label>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="py-3 pl-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-600">Loading products...</td>
                  </tr>
                )}

                {!isLoading && visibleProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center">
                      <FiPackage className="mx-auto text-primary" size={30} />
                      <p className="mt-2 font-semibold text-text">No products found</p>
                      <p className="mt-1 text-sm text-gray-600">Try changing filters or add a new product.</p>
                    </td>
                  </tr>
                )}

                {!isLoading && visibleProducts.map((product) => (
                  <tr key={product._id} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-primary">
                          {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" /> : <FiPackage size={22} />}
                        </div>
                        <div className="min-w-0">
                          <Link to={`/products/${product._id}`} className="block truncate font-bold text-text hover:text-accent hover:underline">
                            {product.name}
                          </Link>
                          <p className="mt-1 text-xs text-gray-500">{product.isFeatured ? 'Featured' : 'Standard listing'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{product.category ?? '-'}</td>
                    <td className="px-4 py-4 text-gray-700">{product.sku ?? '-'}</td>
                    <td className="px-4 py-4 font-semibold text-text">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-lg px-3 py-1 text-xs font-bold ${product.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.isActive ? 'Active' : 'Deactive'}
                      </span>
                    </td>
                    <td className="py-4 pl-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleStatus(product)}
                          disabled={busyProductId === product._id}
                          className={`rounded-lg px-3 py-2 text-xs font-bold shadow-sm disabled:opacity-60 ${product.isActive ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                        >
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/products/${product._id}/edit`)}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-text hover:border-primary hover:text-accent"
                        >
                          <FiEdit2 size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: product._id, name: product.name })}
                          className="flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          <FiTrash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-md">
            <h2 className="text-lg font-bold text-text">Soft delete product?</h2>
            <p className="mt-2 text-sm text-gray-600">
              This will deactivate and hide <span className="font-semibold text-text">{deleteTarget.name}</span> from the seller catalog.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-text hover:border-primary hover:text-accent"
              >
                No
              </button>
              <Button
                type="button"
                label={busyProductId === deleteTarget.id ? 'Deleting...' : 'Yes, delete'}
                onClick={softDeleteProduct}
                disabled={busyProductId === deleteTarget.id}
                className="bg-red-600 hover:bg-red-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
