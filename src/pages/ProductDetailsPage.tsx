import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiEdit2, FiPackage, FiTrash2 } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Panel from '../components/ui/Panel';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ImageFrame from '../components/ui/ImageFrame';
import ProgressBar from '../components/ui/ProgressBar';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
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

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data } = await sellerApi.get(`/products/get-product/${productId}`);
        setProduct(data.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Unable to load product.'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

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
    <Container className="py-6 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/products" className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-accent hover:underline">
            <FiArrowLeft size={16} />
            Products
          </Link>
          <h1 className="mt-2 font-black text-[26px] leading-[1.1] tracking-[-.03em] text-ink">{product?.name ?? 'Product details'}</h1>
          {product && <p className="mt-1 text-[12.5px] font-semibold text-muted">{product.category}</p>}
        </div>
        {product && (
          <div className="flex gap-2.5">
            <Button variant="primary" icon={<FiEdit2 size={16} />} onClick={() => navigate(`/products/${product._id}/edit`)}>
              Edit
            </Button>
            <Button variant="danger" icon={<FiTrash2 size={16} />} onClick={() => setShowDeleteConfirm(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

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

              {(product.createdAt || product.updatedAt) && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3.5 font-mono text-[10.5px] text-muted">
                  <span>ID: {product._id}</span>
                  {product.createdAt && <span>Created {formatDate(product.createdAt)}</span>}
                  {product.updatedAt && <span>Updated {formatDate(product.updatedAt)}</span>}
                </div>
              )}
            </Panel>

            <Panel>
              <h2 className="text-[15px] font-extrabold text-ink">Variants</h2>

              <div className="mt-3.5 hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10px] font-extrabold uppercase text-muted">
                      <th scope="col" className="py-2.5 pr-4">SKU</th>
                      <th scope="col" className="px-4 py-2.5">Attributes</th>
                      <th scope="col" className="px-4 py-2.5">Price</th>
                      <th scope="col" className="px-4 py-2.5">Stock</th>
                      <th scope="col" className="py-2.5 pl-4">Status</th>
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
                          <td className="py-3 pl-4">
                            <Badge tone={variant.isActive ? 'success' : 'plum'}>{variant.isActive ? 'Active' : 'Inactive'}</Badge>
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
    </Container>
  );
};

export default ProductDetailsPage;
