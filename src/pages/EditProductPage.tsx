import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import Header from '../components/Header';
import Button from '../components/Button';
import sellerApi from '../api/sellerApi';

type ProductDetails = {
  _id: string;
  name: string;
  description: string;
  category: string;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }

  return err instanceof Error ? err.message : fallback;
};

const EditProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data } = await sellerApi.get<{ data: ProductDetails }>(`/products/get-product/${productId}`);
        setName(data.data.name);
        setDescription(data.data.description);
        setCategory(data.data.category);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Unable to load product.'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);

      await sellerApi.put(`/products/edit-product/${productId}`, formData);
      toast.success('Product updated successfully.');
      navigate(`/products/${productId}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update product.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link to={`/products/${productId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
          <FiArrowLeft size={18} />
          Product details
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-text">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-600">Update core product information.</p>

        <form className="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-md" onSubmit={saveProduct}>
          {isLoading ? (
            <p className="text-sm text-gray-600">Loading product...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text">Name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-text">Category</label>
                <input
                  id="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-text">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1 min-h-36 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <Button
                type="submit"
                label={isSaving ? 'Saving...' : 'Save product'}
                icon={<FiSave size={18} />}
                disabled={isSaving}
                className="w-full py-3"
              />
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default EditProductPage;
