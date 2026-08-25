import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiImage, FiPlus, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import Button from '../components/Button';
import sellerApi from '../api/sellerApi';
import { uploadProductImages, type UploadedProductImage } from '../api/cloudinaryApi';

type VariantRow = {
  id: number;
  optionOne: string;
  optionTwo: string;
  price: string;
  stock: string;
};

type SelectedProductImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const defaultVariant: VariantRow = {
  id: Date.now(),
  optionOne: '',
  optionTwo: '',
  price: '',
  stock: '',
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback;
  }

  return err instanceof Error ? err.message : fallback;
};

const AddProductPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [variantTypeOne, setVariantTypeOne] = useState('Size');
  const [variantTypeTwo, setVariantTypeTwo] = useState('Color');
  const [variants, setVariants] = useState<VariantRow[]>([defaultVariant]);
  const [images, setImages] = useState<SelectedProductImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedProductImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const variantTypes = useMemo(
    () => [variantTypeOne.trim(), variantTypeTwo.trim()].filter(Boolean),
    [variantTypeOne, variantTypeTwo],
  );

  const updateVariant = (id: number, field: keyof VariantRow, value: string) => {
    setVariants((current) => current.map((variant) => (
      variant.id === id ? { ...variant, [field]: value } : variant
    )));
  };

  const addVariant = () => {
    setVariants((current) => [...current, { ...defaultVariant, id: Date.now() }]);
  };

  const removeVariant = (id: number) => {
    setVariants((current) => current.length === 1 ? current : current.filter((variant) => variant.id !== id));
  };

  const handleImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selectedFiles.length === 0) {
      return;
    }

    setUploadedImages([]);
    setImages((current) => {
      const availableSlots = 5 - current.length;

      if (availableSlots <= 0) {
        toast.error('You can upload a maximum of 5 product images.');
        return current;
      }

      if (selectedFiles.length > availableSlots) {
        toast.info(`Only ${availableSlots} more image${availableSlots === 1 ? '' : 's'} can be added.`);
      }

      const nextImages = selectedFiles.slice(0, availableSlots).map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      return [...current, ...nextImages];
    });
  };

  const removeImage = (id: string) => {
    setUploadedImages([]);
    setImages((current) => {
      const imageToRemove = current.find((image) => image.id === id);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return current.filter((image) => image.id !== id);
    });
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!localStorage.getItem('sellerToken')) {
      toast.error('Login before creating a product.');
      navigate('/login');
      return;
    }

    if (images.length === 0) {
      toast.error('Add at least one product image.');
      return;
    }

    if (variantTypes.length === 0) {
      toast.error('Add at least one variant type.');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('Uploading product images to Cloudinary...');

    try {
      const cloudinaryImages = await uploadProductImages(images.map((image) => image.file));
      setUploadedImages(cloudinaryImages);
      setUploadStatus('Saving product details...');

      const productVariants = variants.map((variant) => {
        const attributes: Record<string, string> = {};

        if (variantTypes[0]) {
          attributes[variantTypes[0]] = variant.optionOne;
        }

        if (variantTypes[1]) {
          attributes[variantTypes[1]] = variant.optionTwo;
        }

        return {
          attributes,
          price: Number(variant.price),
          stock: Number(variant.stock || 0),
        };
      });

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('variantTypes', JSON.stringify(variantTypes));
      formData.append('variants', JSON.stringify(productVariants));
      formData.append('productImagesURL', JSON.stringify(cloudinaryImages.map((image) => image.url)));

      await sellerApi.post('/products/create-product', formData);

      toast.success('Product created successfully.');
      navigate('/products');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to create product.'));
      setUploadStatus('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
              <FiArrowLeft size={18} />
              Products
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-text">Add Product</h1>
            <p className="mt-1 text-sm text-gray-600">
              Upload images to Cloudinary first, then save product metadata to the seller API.
            </p>
          </div>
        </div>

        <form className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]" onSubmit={submitProduct}>
          <section className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <h2 className="text-lg font-bold text-text">Product Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="product-name" className="block text-sm font-medium text-text">Name</label>
                  <input
                    id="product-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Classic T-Shirt"
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
                    placeholder="Men's Clothing"
                    required
                  />
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-text">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1 min-h-32 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe material, fit, use case, and seller notes."
                  required
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text">Variants</h2>
                  <p className="text-sm text-gray-600">The backend supports up to two variant types.</p>
                </div>
                <Button type="button" label="Add variant" icon={<FiPlus size={18} />} onClick={addVariant} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="variant-type-one" className="block text-sm font-medium text-text">Variant Type 1</label>
                  <input
                    id="variant-type-one"
                    value={variantTypeOne}
                    onChange={(event) => setVariantTypeOne(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="variant-type-two" className="block text-sm font-medium text-text">Variant Type 2</label>
                  <input
                    id="variant-type-two"
                    value={variantTypeTwo}
                    onChange={(event) => setVariantTypeTwo(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {variants.map((variant, index) => (
                  <div key={variant.id} className="grid gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_1fr_120px_120px_44px]">
                    <input
                      value={variant.optionOne}
                      onChange={(event) => updateVariant(variant.id, 'optionOne', event.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder={`${variantTypeOne || 'Option'} value`}
                      required
                    />
                    <input
                      value={variant.optionTwo}
                      onChange={(event) => updateVariant(variant.id, 'optionTwo', event.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder={`${variantTypeTwo || 'Option'} value`}
                      required={Boolean(variantTypeTwo.trim())}
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.price}
                      onChange={(event) => updateVariant(variant.id, 'price', event.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Price"
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(event) => updateVariant(variant.id, 'stock', event.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Stock"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      aria-label={`Remove variant ${index + 1}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <h2 className="text-lg font-bold text-text">Images</h2>
              <label htmlFor="product-images" className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-secondary p-6 text-center hover:border-primary">
                <FiUploadCloud className="text-primary" size={30} />
                <span className="mt-3 text-sm font-semibold text-text">Upload product images</span>
                <span className="mt-1 text-xs text-gray-600">{images.length}/5 selected. You can add more later.</span>
                <input
                  id="product-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImages}
                  className="sr-only"
                  required={images.length === 0}
                />
              </label>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {images.map((image) => (
                  <div key={image.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="relative">
                      <img src={image.previewUrl} alt={image.file.name} className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        aria-label={`Remove ${image.file.name}`}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md hover:text-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                    <p className="truncate px-2 py-2 text-xs text-gray-600">{image.file.name}</p>
                  </div>
                ))}
                {images.length === 0 && (
                  <div className="col-span-2 rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-600">
                    <FiImage className="mx-auto text-primary" size={24} />
                    <p className="mt-2">No images selected.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <h2 className="text-lg font-bold text-text">Publish</h2>
              {uploadStatus && <p className="mt-3 rounded-lg bg-secondary p-3 text-sm text-accent">{uploadStatus}</p>}
              {uploadedImages.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">{uploadedImages.length} image URLs ready for metadata save.</p>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                label={isSubmitting ? 'Creating product...' : 'Create product'}
                icon={<FiPlus size={18} />}
                className="mt-4 w-full py-3"
              />
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
};

export default AddProductPage;
