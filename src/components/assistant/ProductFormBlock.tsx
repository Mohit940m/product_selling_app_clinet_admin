import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import Button from '../ui/Button';
import FileDrop from '../ui/FileDrop';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { MAX_IMAGE_SIZE_MB, partitionBySize, uploadProductImages } from '../../api/cloudinaryApi';
import type { ProductFormPrefill } from './types';

const MAX_PHOTOS = 5;

type Row = { key: number; values: Record<string, string>; price: string; stock: string };
type Photo = { key: number; file: File; preview: string };

let nextKey = 1;
const newKey = () => nextKey++;

type Props = {
  prefill: ProductFormPrefill;
  /** Sends the form to the agent; resolves true when the product was submitted. */
  onSubmit: (values: Record<string, unknown>) => Promise<boolean>;
  disabled: boolean;
};

/**
 * Add-product form shown inside the seller chat. Photos go straight to
 * Cloudinary with the server-signed upload (same as AddProductPage), then the
 * URLs and fields are sent to the agent, which creates the product via MCP.
 */
const ProductFormBlock = ({ prefill, onSubmit, disabled }: Props) => {
  const [name, setName] = useState(prefill.name ?? '');
  const [description, setDescription] = useState(prefill.description ?? '');
  const [category, setCategory] = useState(prefill.category ?? '');
  const [typeOne, setTypeOne] = useState(prefill.variantTypes?.[0] ?? 'size');
  const [typeTwo, setTypeTwo] = useState(prefill.variantTypes?.[1] ?? '');
  const [rows, setRows] = useState<Row[]>(() => {
    const seeded = (prefill.variants ?? []).map((v) => ({
      key: newKey(),
      values: Object.fromEntries(Object.entries(v.attributes ?? {}).map(([k, val]) => [k, String(val)])),
      price: v.price != null ? String(v.price) : '',
      stock: v.stock != null ? String(v.stock) : '',
    }));
    return seeded.length ? seeded : [{ key: newKey(), values: {}, price: '', stock: '' }];
  });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'sending' | 'done'>('idle');

  const types = useMemo(() => [typeOne.trim(), typeTwo.trim()].filter(Boolean), [typeOne, typeTwo]);
  const locked = disabled || status !== 'idle';

  // Revoke previews only on unmount; removePhoto revokes individual ones.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const addPhotos = (files: File[]) => {
    const { accepted, oversized } = partitionBySize(files.filter((f) => f.type.startsWith('image/')));
    const room = MAX_PHOTOS - photos.length;
    const taken = accepted.slice(0, room);
    const problems = [];
    if (oversized.length) problems.push(`${oversized.length} photo(s) over ${MAX_IMAGE_SIZE_MB} MB skipped`);
    if (accepted.length > room) problems.push(`only ${MAX_PHOTOS} photos allowed`);
    setError(problems.join('; '));
    setPhotos((current) => [...current, ...taken.map((file) => ({ key: newKey(), file, preview: URL.createObjectURL(file) }))]);
  };

  const removePhoto = (key: number) =>
    setPhotos((current) => {
      const photo = current.find((p) => p.key === key);
      if (photo) URL.revokeObjectURL(photo.preview);
      return current.filter((p) => p.key !== key);
    });

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!name.trim() || !description.trim() || !category.trim()) return setError('Name, description and category are required.');
    if (types.length === 0) return setError('Add at least one variant type, e.g. size.');
    if (types.length === 2 && types[0].toLowerCase() === types[1].toLowerCase()) return setError('Variant types must be different.');
    for (const [i, row] of rows.entries()) {
      for (const t of types) if (!row.values[t]?.trim()) return setError(`Variant ${i + 1}: enter a ${t}.`);
      if (!(Number(row.price) > 0)) return setError(`Variant ${i + 1}: price must be greater than 0.`);
      if (row.stock !== '' && !(Number.isInteger(Number(row.stock)) && Number(row.stock) >= 0)) {
        return setError(`Variant ${i + 1}: stock must be a whole number.`);
      }
    }
    if (photos.length === 0) return setError('Add at least one product photo.');

    setError('');
    setStatus('uploading');
    let imageUrls: string[];
    try {
      imageUrls = (await uploadProductImages(photos.map((p) => p.file))).map((img) => img.url);
    } catch {
      setStatus('idle');
      return setError('Photo upload failed. Check your connection and try again.');
    }

    setStatus('sending');
    const ok = await onSubmit({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      variantTypes: types,
      variants: rows.map((row) => ({
        attributes: Object.fromEntries(types.map((t) => [t, row.values[t].trim()])),
        price: Number(row.price),
        stock: row.stock === '' ? 0 : Number(row.stock),
      })),
      imageUrls,
    });
    setStatus(ok ? 'done' : 'idle');
  };

  if (status === 'done') {
    return (
      <p className="rounded-tile border border-line bg-soft2 p-3.5 text-[12.5px] font-semibold text-muted">
        Product form submitted for “{name}”.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-tile border border-line bg-card p-4" aria-label="Add product">
      <p className="font-mono text-[10.5px] font-extrabold text-muted">ADD PRODUCT</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={locked} maxLength={120} />
        <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={locked} placeholder="T-Shirts" />
      </div>
      <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={locked} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Variant type 1" value={typeOne} onChange={(e) => setTypeOne(e.target.value)} disabled={locked} placeholder="size" />
        <Input label="Variant type 2 (optional)" value={typeTwo} onChange={(e) => setTypeTwo(e.target.value)} disabled={locked} placeholder="color" />
      </div>

      <fieldset className="space-y-2.5">
        <legend className="mb-2 text-[12px] font-extrabold text-ink">Variants</legend>
        {rows.map((row, i) => (
          <div key={row.key} className="grid grid-cols-2 items-end gap-2.5 rounded-tile bg-soft2 p-3 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            {types.map((t) => (
              <Input
                key={t}
                label={`${t} · #${i + 1}`}
                value={row.values[t] ?? ''}
                onChange={(e) => updateRow(row.key, { values: { ...row.values, [t]: e.target.value } })}
                disabled={locked}
              />
            ))}
            <Input label="Price (₹)" type="number" min="0.01" step="0.01" value={row.price} onChange={(e) => updateRow(row.key, { price: e.target.value })} disabled={locked} />
            <Input label="Stock" type="number" min="0" step="1" value={row.stock} onChange={(e) => updateRow(row.key, { stock: e.target.value })} disabled={locked} placeholder="0" />
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove variant ${i + 1}`}
              disabled={locked || rows.length === 1}
              onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
            >
              <FiTrash2 size={15} />
            </Button>
          </div>
        ))}
        <Button
          variant="soft"
          size="sm"
          icon={<FiPlus size={14} />}
          disabled={locked}
          onClick={() => setRows((current) => [...current, { key: newKey(), values: {}, price: current.at(-1)?.price ?? '', stock: '' }])}
        >
          Add variant
        </Button>
      </fieldset>

      <div className="space-y-2.5">
        <p className="text-[12px] font-extrabold text-ink">Photos ({photos.length}/{MAX_PHOTOS})</p>
        {photos.length < MAX_PHOTOS && (
          <FileDrop onFiles={addPhotos} disabled={locked} label={`Drop photos here or click to upload (max ${MAX_IMAGE_SIZE_MB} MB each)`} />
        )}
        {photos.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <li key={p.key} className="relative">
                <img src={p.preview} alt={p.file.name} className="h-16 w-16 rounded-[10px] object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(p.key)}
                  disabled={locked}
                  aria-label={`Remove ${p.file.name}`}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-card disabled:opacity-50"
                >
                  <FiX size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="text-[12px] font-bold text-danger">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" fullWidth loading={status === 'uploading' || status === 'sending'} disabled={locked}>
        {status === 'uploading' ? 'Uploading photos…' : status === 'sending' ? 'Creating product…' : 'Create product'}
      </Button>
    </form>
  );
};

export default ProductFormBlock;
