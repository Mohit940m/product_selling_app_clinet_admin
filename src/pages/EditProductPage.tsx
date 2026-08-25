import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiImage, FiSave, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import Button from '../components/Button';
import sellerApi from '../api/sellerApi';
import { uploadProductImages } from '../api/cloudinaryApi';

type ProductDetails = {
  _id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
};

type NewImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? err.message ?? fallback;
  return err instanceof Error ? err.message : fallback;
};

const EditProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const { data } = await sellerApi.get<{ data: ProductDetails }>(`/products/get-product/${productId}`);
        setName(data.data.name);
        setDescription(data.data.description);
        setCategory(data.data.category);
        setExistingImages(data.data.images ?? []);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Unable to load product.'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  const toggleDeleteExisting = (url: string) => {
    setImagesToDelete((current) =>
      current.includes(url) ? current.filter((u) => u !== url) : [...current, url],
    );
  };

  const handleNewImages = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (selectedFiles.length === 0) return;

    setNewImages((current) => {
      const retained = existingImages.length - imagesToDelete.length;
      const availableSlots = 5 - retained - current.length;

      if (availableSlots <= 0) {
        toast.error('Maximum 5 product images allowed.');
        return current;
      }

      if (selectedFiles.length > availableSlots) {
        toast.info(`Only ${availableSlots} more image${availableSlots === 1 ? '' : 's'} can be added.`);
      }

      return [
        ...current,
        ...selectedFiles.slice(0, availableSlots).map((file) => ({
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ];
    });
  };

  const removeNewImage = (id: string) => {
    setNewImages((current) => {
      const target = current.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((img) => img.id !== id);
    });
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setUploadStatus('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('category', category);

      if (imagesToDelete.length > 0) {
        formData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      if (newImages.length > 0) {
        setUploadStatus('Uploading new images to Cloudinary...');
        const uploaded = await uploadProductImages(newImages.map((img) => img.file));
        formData.append('productImagesURL', JSON.stringify(uploaded.map((img) => img.url)));
      }

      setUploadStatus('Saving product...');
      await sellerApi.put(`/products/edit-product/${productId}`, formData);
      toast.success('Product updated successfully.');
      navigate(`/products/${productId}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update product.'));
      setUploadStatus('');
    } finally {
      setIsSaving(false);
    }
  };

  const totalImageCount = existingImages.length - imagesToDelete.length + newImages.length;

  return (
    <div className="min-h-screen bg-background text-text">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link to={`/products/${productId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">
          <FiArrowLeft size={18} />
          Product details
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-text">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-600">Update product information and images.</p>

        {isLoading ? (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-md">
            Loading product...
          </div>
        ) : (
          <form className="mt-6 space-y-6" onSubmit={saveProduct}>
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <h2 className="text-lg font-bold text-text">Product Details</h2>
              <div className="mt-4 space-y-4">
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
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-text">Images</h2>
                  <p className="text-sm text-gray-600">{totalImageCount}/5 images. Mark existing ones for removal or upload new ones.</p>
                </div>
                <label htmlFor="new-images" className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-text hover:border-primary hover:text-accent">
                  <FiUploadCloud size={18} />
                  Add images
                  <input
                    id="new-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewImages}
                    className="sr-only"
                  />
                </label>
              </div>

              {existingImages.length === 0 && newImages.length === 0 && (
                <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <FiImage className="mx-auto text-primary" size={28} />
                  <p className="mt-2 text-sm text-gray-600">No images on this product.</p>
                </div>
              )}

              {existingImages.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Current Images</p>
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages.map((url) => {
                      const markedForDelete = imagesToDelete.includes(url);
                      return (
                        <div key={url} className={`relative overflow-hidden rounded-lg border ${markedForDelete ? 'border-red-300 opacity-50' : 'border-gray-200'}`}>
                          <img src={url} alt="" className="aspect-square w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => toggleDeleteExisting(url)}
                            aria-label={markedForDelete ? 'Undo remove' : 'Mark for removal'}
                            className={`absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg shadow-md ${markedForDelete ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:text-red-600'}`}
                          >
                            <FiTrash2 size={14} />
                          </button>
                          {markedForDelete && (
                            <div className="absolute inset-x-0 bottom-0 bg-red-600 py-1 text-center text-xs font-bold text-white">
                              Will be removed
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {newImages.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">New Images to Upload</p>
                  <div className="grid grid-cols-3 gap-3">
                    {newImages.map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-lg border border-primary">
                        <div className="relative">
                          <img src={image.previewUrl} alt={image.file.name} className="aspect-square w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNewImage(image.id)}
                            aria-label={`Remove ${image.file.name}`}
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-700 shadow-md hover:text-red-600"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                        <p className="truncate px-2 py-1 text-xs text-gray-600">{image.file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {uploadStatus && (
              <div className="rounded-lg border border-primary bg-secondary p-3 text-sm text-accent">{uploadStatus}</div>
            )}

            <Button
              type="submit"
              label={isSaving ? 'Saving...' : 'Save product'}
              icon={<FiSave size={18} />}
              disabled={isSaving}
              className="w-full py-3"
            />
          </form>
        )}
      </main>
    </div>
  );
};

export default EditProductPage;
