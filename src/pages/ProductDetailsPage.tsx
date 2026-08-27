import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiEdit2, FiPackage, FiPlus, FiSettings, FiTrash2 } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ImageFrame from '../components/ui/ImageFrame';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Switch from '../components/ui/Switch';
import MobileActionBar from '../components/layout/MobileActionBar';
import sellerApi from '../api/sellerApi';

const LOW_STOCK_THRESHOLD = 5;
const STOCK_BAR_CEILING = 20;

type Variant = {
  _id: string;
  sku?: string;
  attributes?: Record<string, string>;
  price?: number;
  stock?: number;
  isActive?: boolean;
};

type ProductDetails = {
  _id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  variantTypes?: string[];
  variants?: Variant[];
  isActive: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const formatCurrency = (value?: number) => (
  value === undefined ? '-' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
);

const formatDate = (iso?: string) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }

  return err instanceof Error ? err.message : fallback;
};

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [manageTarget, setManageTarget] = useState<Variant | null>(null);
  const [managePrice, setManagePrice] = useState('');
  const [manageAddStock, setManageAddStock] = useState('');
  const [manageActive, setManageActive] = useState(true);
  const [isSavingVariant, setIsSavingVariant] = useState(false);

  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newOptionOne, setNewOptionOne] = useState('');
  const [newOptionTwo, setNewOptionTwo] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('');
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  useEffect(() => {
    // Guards against a real race: navigating from one product straight to
    // another before the first fetch resolves could otherwise let a
    // stale response overwrite the newer product's data.
    let isCurrent = true;

    const loadProduct = async () => {
      try {
        const { data } = await sellerApi.get(`/products/get-product/${productId}`);
        if (isCurrent) setProduct(data.data);
      } catch (err) {
        if (isCurrent) toast.error(getErrorMessage(err, 'Unable to load product.'));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadProduct();
    return () => {
      isCurrent = false;
    };
  }, [productId]);

  /** Re-fetches after a variant save — kept separate from the mount effect's
   * loader (react-hooks/set-state-in-effect requires that one to stay
   * effect-local) rather than sharing one component-scoped function. */
  const refetchProduct = async () => {
    try {
      const { data } = await sellerApi.get(`/products/get-product/${productId}`);
      setProduct(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to refresh product.'));
    }
  };

  const openManageVariant = (variant: Variant) => {
    setManageTarget(variant);
    setManagePrice(variant.price !== undefined ? String(variant.price) : '');
    setManageAddStock('');
    setManageActive(variant.isActive ?? true);
  };

  const saveVariant = async () => {
    if (!manageTarget || !product || isSavingVariant) return;
    setIsSavingVariant(true);

    const calls: Promise<unknown>[] = [];
    const nextPrice = Number(managePrice);
    if (managePrice !== '' && Number.isFinite(nextPrice) && nextPrice !== manageTarget.price) {
      calls.push(sellerApi.patch(`/products/edit-variant-price/${product._id}`, { variantId: manageTarget._id, price: nextPrice }));
    }
    if (manageActive !== (manageTarget.isActive ?? true)) {
      calls.push(sellerApi.patch(`/products/edit-variant-status/${product._id}`, { variantId: manageTarget._id, status: manageActive }));
    }
    const addedStock = Number(manageAddStock);
    if (manageAddStock !== '' && Number.isFinite(addedStock) && addedStock > 0) {
      calls.push(sellerApi.patch(`/products/increase-stock/${product._id}`, { variantId: manageTarget._id, addedStock }));
    }

    if (calls.length === 0) {
      setManageTarget(null);
      setIsSavingVariant(false);
      return;
    }

    const results = await Promise.allSettled(calls);
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      toast.error(failed === results.length ? 'Unable to save variant changes.' : 'Some variant changes could not be saved.');
    } else {
      toast.success('Variant updated.');
    }
    await refetchProduct();
    setManageTarget(null);
    setIsSavingVariant(false);
  };

  const resetAddVariantForm = () => {
    setNewOptionOne('');
    setNewOptionTwo('');
    setNewPrice('');
    setNewStock('');
  };

  const submitAddVariant = async () => {
    if (!product || isAddingVariant) return;
    const price = Number(newPrice);
    const stock = Number(newStock);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Enter a valid price.');
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      toast.error('Enter a valid stock quantity.');
      return;
    }

    const [typeOne, typeTwo] = product.variantTypes ?? [];
    const attributes: Record<string, string> = {};
    if (typeOne) attributes[typeOne] = newOptionOne.trim();
    if (typeTwo) attributes[typeTwo] = newOptionTwo.trim();

    setIsAddingVariant(true);
    try {
      await sellerApi.post(`/products/add-variant/${product._id}`, { attributes, price, stock });
      toast.success('Variant added.');
      await refetchProduct();
      setShowAddVariant(false);
      resetAddVariantForm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to add variant.'));
    } finally {
      setIsAddingVariant(false);
    }
  };

  const deleteProduct = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      await sellerApi.delete(`/products/delete-product/${product._id}`);
      toast.success('Product deleted.');
      navigate('/products');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to delete product.'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Container className="py-6 pb-28 lg:pb-8 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/products" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-accent hover:underline">
            <FiArrowLeft size={16} />
            Products
          </Link>
          {product && <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-wide text-muted">{product.category}</p>}
          <h1 className="mt-1 font-black text-[26px] leading-[1.1] tracking-[-.03em] text-ink lg:text-[34px] lg:leading-[1.05] lg:tracking-[-.03em]">
            {product?.name ?? 'Product details'}
          </h1>
        </div>
        {product && (
          <div className="flex gap-2.5">
            <Button variant="primary" icon={<FiEdit2 size={16} />} onClick={() => navigate(`/products/${product._id}/edit`)} className="hidden lg:inline-flex">
              Edit
            </Button>
            <Button variant="danger" icon={<FiTrash2 size={16} />} onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      {product && (
        <MobileActionBar>
          <Button variant="primary" fullWidth icon={<FiEdit2 size={16} />} onClick={() => navigate(`/products/${product._id}/edit`)}>
            Edit
          </Button>
        </MobileActionBar>
      )}

      {isLoading && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
          <Skeleton className="h-72" />
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-40" />
          </div>
        </div>
      )}

      {!isLoading && !product && (
        <EmptyState icon={<FiPackage size={30} />} title="Product not found" />
      )}

      {product && (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.2fr]">
          <Panel>
            {product.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {product.images.map((image) => (
                  <ImageFrame key={image} src={image} alt={product.name} className="aspect-square rounded-tile" />
                ))}
              </div>
            ) : (
              <ImageFrame src={undefined} alt={product.name} className="aspect-square rounded-tile" />
            )}
          </Panel>

          <div className="space-y-5">
            <Panel>
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge tone={product.isActive ? 'success' : 'plum'}>{product.isActive ? 'Active' : 'Inactive'}</Badge>
                {product.isFeatured && <Badge tone="ink">Featured</Badge>}
              </div>
              <h2 className="mt-4 text-[15px] font-extrabold text-ink">Description</h2>
              <p className="mt-2 text-[13px] leading-6 text-muted">{product.description}</p>
            </Panel>

            <Panel>
              <h2 className="text-[15px] font-extrabold text-ink">Metadata</h2>
              <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10.5px] text-muted">
                <span>ID: {product._id}</span>
                {product.createdAt && <span>Created {formatDate(product.createdAt)}</span>}
                {product.updatedAt && <span>Updated {formatDate(product.updatedAt)}</span>}
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-extrabold text-ink">Variants</h2>
                <Button variant="outline" size="sm" icon={<FiPlus size={14} />} onClick={() => setShowAddVariant(true)}>
                  Add variant
                </Button>
              </div>

              <div className="mt-3.5 hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10px] font-extrabold uppercase text-muted">
                      <th scope="col" className="py-2.5 pr-4">SKU</th>
                      <th scope="col" className="px-4 py-2.5">Attributes</th>
                      <th scope="col" className="px-4 py-2.5">Price</th>
                      <th scope="col" className="px-4 py-2.5">Stock</th>
                      <th scope="col" className="px-4 py-2.5">Status</th>
                      <th scope="col" className="py-2.5 pl-4 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants?.map((variant) => {
                      const stock = variant.stock ?? 0;
                      const low = stock <= LOW_STOCK_THRESHOLD;
                      return (
                        <tr key={variant._id} className="border-b border-line text-[12.5px] last:border-0">
                          <td className="py-3 pr-4 font-mono text-muted">{variant.sku ?? '-'}</td>
                          <td className="px-4 py-3 text-ink">
                            {Object.entries(variant.attributes ?? {}).map(([key, value]) => `${key}: ${value}`).join(', ') || '-'}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-ink">{formatCurrency(variant.price)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                percent={Math.min(100, (stock / STOCK_BAR_CEILING) * 100)}
                                className="w-16"
                                fillClassName={low ? 'bg-bad-fg' : 'bg-accent'}
                              />
                              <span className={low ? 'font-extrabold text-bad-fg' : 'text-muted'}>{stock}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone={variant.isActive ? 'success' : 'plum'}>{variant.isActive ? 'Active' : 'Inactive'}</Badge>
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => openManageVariant(variant)}
                              aria-label={`Manage ${variant.sku ?? 'variant'}`}
                              className="relative rounded-full border border-line p-2 text-muted t-fast before:absolute before:-inset-2 before:content-[''] hover:border-accent hover:text-accent"
                            >
                              <FiSettings size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3.5 space-y-2.5 lg:hidden">
                {product.variants?.map((variant) => {
                  const stock = variant.stock ?? 0;
                  const low = stock <= LOW_STOCK_THRESHOLD;
                  return (
                    <div key={variant._id} className="rounded-tile border border-line p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-muted">{variant.sku ?? '-'}</span>
                        <Badge tone={variant.isActive ? 'success' : 'plum'}>{variant.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p className="mt-1.5 text-[12.5px] text-ink">
                        {Object.entries(variant.attributes ?? {}).map(([key, value]) => `${key}: ${value}`).join(', ') || '-'}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-extrabold text-ink">{formatCurrency(variant.price)}</span>
                        <span className={`text-[12px] ${low ? 'font-extrabold text-bad-fg' : 'text-muted'}`}>{stock} in stock</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openManageVariant(variant)}
                        className="relative mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-full border border-line py-2 text-[11px] font-bold text-ink t-fast before:absolute before:-inset-2 before:content-[''] hover:border-accent hover:text-accent"
                      >
                        <FiSettings size={13} />
                        Manage
                      </button>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteProduct}
        title="Delete this product?"
        description="This removes it from your catalog. This action can't be undone from here."
        confirmLabel="Delete product"
        loading={isDeleting}
      />

      <Modal open={!!manageTarget} onClose={() => setManageTarget(null)} title="Manage variant">
        {manageTarget && (
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-bold text-ink">{manageTarget.sku ?? 'Variant'}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">
                {Object.entries(manageTarget.attributes ?? {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'No attributes'}
              </p>
            </div>
            <Input label="Price (₹)" type="number" min="0" value={managePrice} onChange={(e) => setManagePrice(e.target.value)} />
            <Input
              label="Add stock (units)"
              type="number"
              min="0"
              value={manageAddStock}
              onChange={(e) => setManageAddStock(e.target.value)}
              placeholder="0"
            />
            <div className="flex items-center justify-between rounded-tile border border-line px-4 py-3.5">
              <div>
                <p className="text-[13px] font-bold text-ink">Active</p>
                <p className="text-[11.5px] font-medium text-muted">Inactive variants can't be added to cart.</p>
              </div>
              <Switch checked={manageActive} onChange={() => setManageActive((v) => !v)} label="Variant active" />
            </div>
            <Button variant="primary" fullWidth loading={isSavingVariant} onClick={saveVariant}>
              Save changes
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={showAddVariant} onClose={() => setShowAddVariant(false)} title="Add variant">
        {product && (
          <div className="space-y-4">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Input
                label={product.variantTypes?.[0] ?? 'Option 1'}
                value={newOptionOne}
                onChange={(e) => setNewOptionOne(e.target.value)}
                placeholder="e.g. XL"
                required
              />
              <Input
                label={product.variantTypes?.[1] ?? 'Option 2'}
                value={newOptionTwo}
                onChange={(e) => setNewOptionTwo(e.target.value)}
                placeholder="e.g. Black"
                required
              />
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Input label="Price (₹)" type="number" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required />
              <Input label="Stock" type="number" min="0" value={newStock} onChange={(e) => setNewStock(e.target.value)} required />
            </div>
            <Button variant="primary" fullWidth loading={isAddingVariant} onClick={submitAddVariant}>
              Add variant
            </Button>
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default ProductDetailsPage;
