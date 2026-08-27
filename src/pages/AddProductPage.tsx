import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiArrowLeft, FiImage, FiPlus, FiTrash2 } from 'react-icons/fi';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Panel from '../components/ui/Panel';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import Switch from '../components/ui/Switch';
import FileDrop from '../components/ui/FileDrop';
import ProgressBar from '../components/ui/ProgressBar';
import { showKartlyToast } from '../components/ui/showKartlyToast';
import MobileActionBar from '../components/layout/MobileActionBar';
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

const makeVariant = (): VariantRow => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  optionOne: '',
  optionTwo: '',
  price: '',
  stock: '',
});

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
  // Lazy initializer avoids calling the impure Date.now() during render
  // (react-hooks/purity flagged the previous `useState([{ id: Date.now() ... }])`).
  const [variants, setVariants] = useState<VariantRow[]>(() => [makeVariant()]);
  const [images, setImages] = useState<SelectedProductImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedProductImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Inline validation (4.3.7) for the one pre-submit check with no native
  // HTML equivalent — a file dropzone can't carry a `required` attribute
  // the way a text Input can.
  const [imagesError, setImagesError] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  // create-product has no isActive field at all (confirmed by reading the
  // controller) — a new product is always created active. When this is
  // off, a real follow-up PATCH /edit-product-status call deactivates it
  // right after creation, so "create inactive" is two real requests, not
  // a fabricated draft state.
  const [isActive, setIsActive] = useState(true);

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
    setVariants((current) => [...current, makeVariant()]);
  };

  const removeVariant = (id: number) => {
    setVariants((current) => current.length === 1 ? current : current.filter((variant) => variant.id !== id));
  };

  const handleImages = (files: File[]) => {
    setImagesError(false);
    setUploadedImages([]);
    setImages((current) => {
      const availableSlots = 5 - current.length;

      if (availableSlots <= 0) {
        toast.error('You can upload a maximum of 5 product images.');
        return current;
      }

      if (files.length > availableSlots) {
        toast.info(`Only ${availableSlots} more image${availableSlots === 1 ? '' : 's'} can be added.`);
      }

      const nextImages = files.slice(0, availableSlots).map((file) => ({
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
    // The disabled attribute on the submit button only takes effect after
    // the next render — a fast double-click (or double Enter) can still
    // both fire before then. Guard explicitly rather than rely on timing.
    if (isSubmitting) return;

    // RequireSellerAuth already guarantees a sellerToken exists for every
    // route inside AdminLayout, so this page-local check is no longer needed.
    if (images.length === 0) {
      setImagesError(true);
      return;
    }
    setImagesError(false);

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

      const { data } = await sellerApi.post('/products/create-product', formData);
      const newProductId = data.data?._id;

      if (!isActive && newProductId) {
        setUploadStatus('Setting status...');
        try {
          await sellerApi.patch(`/products/edit-product-status/${newProductId}`, { status: false });
        } catch {
          // The product itself was created successfully — a failed status
          // flip afterward shouldn't block navigation, just note it.
          toast.error('Product created, but could not be set inactive. Change it from the product list.');
        }
      }

      showKartlyToast({ title: 'Product created', sub: name });
      navigate('/products');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to create product.'));
      setUploadStatus('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-6 pb-28 lg:pb-8 lg:py-8">
      <Link to="/products" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-accent hover:underline">
        <FiArrowLeft size={16} />
        Products
      </Link>
      <PageHeader
        title="New product"
        subtitle="Upload images to Cloudinary first, then save product metadata to the seller API."
        actions={
          <Button
            type="submit"
            form="add-product-form"
            variant="primary"
            loading={isSubmitting}
            icon={<FiPlus size={16} />}
            className="hidden lg:inline-flex"
          >
            Publish
          </Button>
        }
      />

      <form id="add-product-form" className="grid gap-5 lg:grid-cols-[1.6fr_1fr]" onSubmit={submitProduct}>
        <section className="space-y-5">
          <Panel>
            <h2 className="text-[16px] font-extrabold text-ink">Basics</h2>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Classic T-Shirt" required />
              <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Men's Clothing" required />
            </div>
            <Textarea
              label="Description"
              wrapperClassName="mt-3.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32"
              placeholder="Describe material, fit, use case, and seller notes."
              required
            />
          </Panel>

          <Panel>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[16px] font-extrabold text-ink">Variants</h2>
                <p className="text-[12.5px] font-semibold text-muted">The backend supports up to two variant types.</p>
              </div>
              <Button type="button" variant="outline" icon={<FiPlus size={16} />} onClick={addVariant}>
                Add variant
              </Button>
            </div>

            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <Input label="Variant Type 1" value={variantTypeOne} onChange={(e) => setVariantTypeOne(e.target.value)} required />
              <Input label="Variant Type 2" value={variantTypeTwo} onChange={(e) => setVariantTypeTwo(e.target.value)} placeholder="Optional" />
            </div>

            <div className="mt-4 space-y-2.5">
              {variants.map((variant, index) => (
                <div key={variant.id} className="grid grid-cols-2 gap-2.5 rounded-tile border border-line p-3.5 md:grid-cols-[1fr_1fr_110px_110px_40px]">
                  <input
                    value={variant.optionOne}
                    onChange={(event) => updateVariant(variant.id, 'optionOne', event.target.value)}
                    className="rounded-btn border border-line px-3 py-2.5 text-[12.5px] text-ink t-fast focus:border-accent"
                    placeholder={`${variantTypeOne || 'Option'} value`}
                    required
                  />
                  <input
                    value={variant.optionTwo}
                    onChange={(event) => updateVariant(variant.id, 'optionTwo', event.target.value)}
                    className="rounded-btn border border-line px-3 py-2.5 text-[12.5px] text-ink t-fast focus:border-accent"
                    placeholder={`${variantTypeTwo || 'Option'} value`}
                    required={Boolean(variantTypeTwo.trim())}
                  />
                  <input
                    type="number"
                    min="0"
                    value={variant.price}
                    onChange={(event) => updateVariant(variant.id, 'price', event.target.value)}
                    className="rounded-btn border border-line px-3 py-2.5 text-[12.5px] text-ink t-fast focus:border-accent"
                    placeholder="Price"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(event) => updateVariant(variant.id, 'stock', event.target.value)}
                    className="rounded-btn border border-line px-3 py-2.5 text-[12.5px] text-ink t-fast focus:border-accent"
                    placeholder="Stock"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    aria-label={`Remove variant ${index + 1}`}
                    className="col-span-2 flex h-10 items-center justify-center gap-1.5 rounded-btn border border-line text-[12.5px] font-bold text-muted t-fast hover:border-danger hover:text-danger md:col-span-1 md:w-10"
                  >
                    <FiTrash2 size={16} />
                    <span className="md:hidden">Remove variant</span>
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <aside className="space-y-5">
          <Panel>
            <h2 className="text-[16px] font-extrabold text-ink">Images</h2>
            <FileDrop
              onFiles={handleImages}
              label={`Add product images here — ${images.length}/5 selected`}
              disabled={images.length >= 5}
              error={imagesError}
            />
            {imagesError && <p className="mt-1.5 text-[11px] font-bold text-danger">Add at least one product image.</p>}

            {/* Mobile: horizontal 72x72 no-scrollbar rail (4.3.11) — the
                filename caption is dropped at that size, too cramped to be
                useful. Desktop: the existing 2-col 96x96 grid (4.3.4). */}
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:overflow-visible lg:pb-0">
              {images.map((image, idx) => (
                <div key={image.id} className="w-[72px] shrink-0 overflow-hidden rounded-tile border border-line bg-card lg:w-auto lg:shrink">
                  <div className="relative">
                    <img src={image.previewUrl} alt={image.file.name} className="aspect-square w-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[9px] font-extrabold text-card">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      aria-label={`Remove ${image.file.name}`}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-card text-muted shadow-kartly before:absolute before:-inset-2 before:content-[''] hover:text-danger"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  <p className="hidden truncate px-2 py-1.5 text-[10.5px] text-muted lg:block">{image.file.name}</p>
                </div>
              ))}
              {images.length === 0 && (
                <div className="w-full shrink-0 rounded-tile border border-line p-4 text-center text-[12.5px] text-muted lg:col-span-2">
                  <FiImage className="mx-auto text-accent" size={22} />
                  <p className="mt-2">No images selected.</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel className="flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-extrabold text-ink">Status</h2>
              <p className="mt-1 text-[12.5px] font-semibold text-muted">
                {isActive ? 'Visible to buyers as soon as it is published.' : 'Created but hidden from buyers until you activate it.'}
              </p>
            </div>
            <Switch checked={isActive} onChange={() => setIsActive((v) => !v)} label="Active" />
          </Panel>

          <Panel>
            <h2 className="text-[16px] font-extrabold text-ink">Publish</h2>
            {uploadStatus && (
              <>
                <p className="mt-3 rounded-btn bg-soft2 p-3 text-[12.5px] font-semibold text-accent">{uploadStatus}</p>
                <ProgressBar percent={isSubmitting ? 60 : 0} className="mt-2.5" />
              </>
            )}
            {uploadedImages.length > 0 && (
              <p className="mt-3 text-[12.5px] font-semibold text-muted">{uploadedImages.length} image URLs ready for metadata save.</p>
            )}
          </Panel>
        </aside>
      </form>

      <MobileActionBar>
        <Button type="submit" form="add-product-form" variant="primary" fullWidth loading={isSubmitting} icon={<FiPlus size={16} />}>
          Publish
        </Button>
      </MobileActionBar>
    </Container>
  );
};

export default AddProductPage;
