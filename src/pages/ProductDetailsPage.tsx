import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiEdit2, FiPackage } from 'react-icons/fi';
import Button from '../components/Button';
import sellerApi from '../api/sellerApi';

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
};

const formatCurrency = (value?: number) => (
  value === undefined ? '-' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
);

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

  return (
    <div className="min-h-screen bg-background text-text">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              <FiArrowLeft size={18} />
              Products
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-text">{product?.name ?? 'Product details'}</h1>
            {product && <p className="mt-1 text-sm text-gray-600">{product.category}</p>}
          </div>
          {product && (
            <Button
              type="button"
              label="Edit product"
              icon={<FiEdit2 size={18} />}
              onClick={() => navigate(`/products/${product._id}/edit`)}
              className="py-3"
            />
          )}
        </div>

        {isLoading && <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-md">Loading product...</div>}

        {!isLoading && !product && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md">
            <FiPackage className="mx-auto text-primary" size={30} />
            <p className="mt-2 font-semibold text-text">Product not found</p>
          </div>
        )}

        {product && (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <div className="grid grid-cols-2 gap-3">
                {product.images.map((image) => (
                  <img key={image} src={image} alt={product.name} className="aspect-square rounded-lg border border-gray-200 object-cover" />
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`rounded-lg px-3 py-1 text-xs font-bold ${product.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {product.isActive ? 'Active' : 'Deactive'}
                  </span>
                  {product.isFeatured && <span className="rounded-lg bg-secondary px-3 py-1 text-xs font-bold text-accent">Featured</span>}
                </div>
                <h2 className="mt-4 text-lg font-bold text-text">Description</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{product.description}</p>
              </article>

              <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                <h2 className="text-lg font-bold text-text">Variants</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                        <th className="py-3 pr-4">SKU</th>
                        <th className="px-4 py-3">Attributes</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="py-3 pl-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants?.map((variant) => (
                        <tr key={variant._id} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 pr-4">{variant.sku ?? '-'}</td>
                          <td className="px-4 py-3">
                            {Object.entries(variant.attributes ?? {}).map(([key, value]) => `${key}: ${value}`).join(', ') || '-'}
                          </td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(variant.price)}</td>
                          <td className="px-4 py-3">{variant.stock ?? 0}</td>
                          <td className="py-3 pl-4">{variant.isActive ? 'Active' : 'Deactive'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetailsPage;
