import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiImage, FiSave, FiTrash2 } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Panel from '../components/ui/Panel';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import FileDrop from '../components/ui/FileDrop';
import Skeleton from '../components/ui/Skeleton';
import ConfirmDialog from '../components/ui/ConfirmDialog';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleNewImages = (files: File[]) => {
    setNewImages((current) => {
      const retained = existingImages.length - imagesToDelete.length;
      const availableSlots = 5 - retained - current.length;

      if (availableSlots <= 0) {
        toast.error('Maximum 5 product images allowed.');
        return current;
      }

      if (files.length > availableSlots) {
        toast.info(`Only ${availableSlots} more image${availableSlots === 1 ? '' : 's'} can be added.`);
      }

      return [
        ...current,
        ...files.slice(0, availableSlots).map((file) => ({
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

  const deleteProduct = async () => {
    setIsDeleting(true);
    try {
      await sellerApi.delete(`/products/delete-product/${productId}`);
      toast.success('Product deleted.');
      navigate('/products');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to delete product.'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const totalImageCount = existingImages.length - imagesToDelete.length + newImages.length;

  return (
    <Container className="max-w-3xl! py-6 lg:py-8">
      <Link to={`/products/${productId}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-accent hover:underline">
        <FiArrowLeft size={16} />
        Product details
      </Link>
      <h1 className="mt-2 font-black text-[26px] leading-[1.1] tracking-[-.03em] text-ink">Edit product</h1>
      <p className="mt-1 text-[12.5px] font-semibold text-muted">Update product information and images.</p>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <form className="mt-6 space-y-5" onSubmit={saveProduct}>
          <Panel>
            <h2 className="text-[16px] font-extrabold text-ink">Basics</h2>
            <div className="mt-4 space-y-3.5">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-36"
                required
              />
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-extrabold text-ink">Images</h2>
                <p className="text-[12.5px] font-semibold text-muted">{totalImageCount}/5 images. Mark existing ones for removal or upload new ones.</p>
              </div>
            </div>

            <FileDrop onFiles={handleNewImages} label="Add images" disabled={totalImageCount >= 5} />

            {existingImages.length === 0 && newImages.length === 0 && (
              <div className="mt-4 rounded-tile border border-dashed border-edge p-6 text-center">
                <FiImage className="mx-auto text-accent" size={26} />
                <p className="mt-2 text-[12.5px] font-medium text-muted">No images on this product.</p>
              </div>
            )}

            {existingImages.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 font-mono text-[10px] font-extrabold uppercase tracking-wide text-muted">Current Images</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {existingImages.map((url) => {
                    const markedForDelete = imagesToDelete.includes(url);
                    return (
                      <div key={url} className={`relative overflow-hidden rounded-tile border t-fast ${markedForDelete ? 'border-danger opacity-50' : 'border-line'}`}>
                        <img src={url} alt="" className="aspect-square w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => toggleDeleteExisting(url)}
                          aria-label={markedForDelete ? 'Undo remove' : 'Mark for removal'}
                          className={`absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full shadow-kartly t-fast ${markedForDelete ? 'bg-danger text-card' : 'bg-card text-muted hover:text-danger'}`}
                        >
                          <FiTrash2 size={14} />
                        </button>
                        {markedForDelete && (
                          <div className="absolute inset-x-0 bottom-0 bg-danger py-1 text-center text-[10px] font-extrabold text-card">
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
                <p className="mb-2 font-mono text-[10px] font-extrabold uppercase tracking-wide text-muted">New Images to Upload</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {newImages.map((image) => (
                    <div key={image.id} className="overflow-hidden rounded-tile border border-accent">
                      <div className="relative">
                        <img src={image.previewUrl} alt={image.file.name} className="aspect-square w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(image.id)}
                          aria-label={`Remove ${image.file.name}`}
                          className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-card text-muted shadow-kartly t-fast hover:text-danger"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      <p className="truncate px-2 py-1.5 text-[10.5px] text-muted">{image.file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {uploadStatus && (
            <div className="rounded-btn border border-accent bg-soft2 p-3 text-[12.5px] font-semibold text-accent">{uploadStatus}</div>
          )}

          <Button type="submit" variant="primary" fullWidth loading={isSaving} icon={<FiSave size={16} />}>
            Save changes
          </Button>

          <Button type="button" variant="danger" fullWidth icon={<FiTrash2 size={16} />} onClick={() => setShowDeleteConfirm(true)}>
            Delete product
          </Button>
        </form>
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

export default EditProductPage;
