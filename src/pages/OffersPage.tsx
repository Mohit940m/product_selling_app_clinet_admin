import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiClock, FiGift, FiPlus, FiSearch, FiTag, FiTrash2, FiX } from 'react-icons/fi';
import Container from '../components/layout/Container';
import MobileActionBar from '../components/layout/MobileActionBar';
import Panel from '../components/ui/Panel';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Chip from '../components/ui/Chip';
import Switch from '../components/ui/Switch';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import sellerApi from '../api/sellerApi';

type OfferType = 'DISCOUNT' | 'CASHBACK' | 'BUY_GET' | 'PRODUCT_BUNDLE';
type DiscountType = 'PERCENTAGE' | 'FLAT';
type TargetProduct = { _id: string; name: string };
type TargetVariant = { _id: string; sku?: string; attributes?: Record<string, string> };

type BundleItem = {
  id: number;
  productId: string;
  quantity: string;
};

const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  DISCOUNT: 'Discount',
  CASHBACK: 'Cashback',
  BUY_GET: 'Buy X Get Y',
  PRODUCT_BUNDLE: 'Product Bundle',
};

const OFFER_TYPE_DESCRIPTIONS: Record<OfferType, string> = {
  DISCOUNT: 'Percentage or flat amount off the product price.',
  CASHBACK: 'Fixed cashback amount returned to the buyer.',
  BUY_GET: 'Buy a quantity and get extra units free.',
  PRODUCT_BUNDLE: 'Group products at a special bundle price.',
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? err.message ?? fallback;
  return err instanceof Error ? err.message : fallback;
};

type CreatedOffer = {
  id: number;
  name: string;
  type: OfferType;
  discountLabel: string;
  targetSummary: string;
  validFrom: string;
  validTill: string;
};

const today = () => new Date().toISOString().slice(0, 16);
const makeBundleItem = (): BundleItem => ({ id: Date.now() + Math.floor(Math.random() * 1000), productId: '', quantity: '1' });

const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Derived purely from validity dates, per the plan's Active/Scheduled/Expired spec. */
const getOfferStatus = (validFrom: string, validTill: string): { label: string; tone: 'success' | 'warn' | 'plum' } => {
  const now = Date.now();
  const from = new Date(validFrom).getTime();
  const till = new Date(validTill).getTime();
  if (now < from) return { label: 'Scheduled', tone: 'warn' };
  if (now > till) return { label: 'Expired', tone: 'plum' };
  return { label: 'Active', tone: 'success' };
};

const OffersPage = () => {
  const [offerType, setOfferType] = useState<OfferType>('DISCOUNT');
  const [name, setName] = useState('');
  const [validFrom, setValidFrom] = useState(today());
  const [validTill, setValidTill] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [minCartValue, setMinCartValue] = useState('');

  const [cashbackAmount, setCashbackAmount] = useState('');

  const [buyQty, setBuyQty] = useState('');
  const [getQty, setGetQty] = useState('');

  // Lazy initializer avoids calling the impure Date.now() during render
  // (react-hooks/purity flagged the previous `useState([{ id: Date.now() ... }])`).
  const [bundleItems, setBundleItems] = useState<BundleItem[]>(() => [makeBundleItem()]);
  const [bundlePrice, setBundlePrice] = useState('');

  const [selectedProducts, setSelectedProducts] = useState<TargetProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<TargetProduct[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optional per-product variant narrowing (4.8.6's "expandable to
  // variants"). appliesTo.variantIds is real and confirmed supported by
  // createOffer — omitting it defaults to all variants of the selected
  // products, so this stays purely additive.
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, TargetVariant[]>>({});
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);

  // The seller API has no offer-listing endpoint, so this only tracks
  // offers created in this browser session (not a persisted list) — see
  // the "created this session" note rendered above the grid.
  const [createdOffers, setCreatedOffers] = useState<CreatedOffer[]>([]);
  // Real filter over the session-scoped grid above — status is a genuine
  // derived value (getOfferStatus), just scoped to what's been created
  // this session rather than a true full-catalog offer list (4.8.7).
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Scheduled' | 'Expired'>('ALL');

  const addBundleItem = () => {
    setBundleItems((current) => [...current, makeBundleItem()]);
  };

  const removeBundleItem = (id: number) => {
    setBundleItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  };

  const updateBundleItem = (id: number, field: 'productId' | 'quantity', value: string) => {
    setBundleItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // Debounced product search for the target picker (4.8.6) — reuses the
  // same seller endpoint ProductListPage already searches against. The
  // debounce cancels a still-*pending* timer on every keystroke, but two
  // requests can still end up in flight together if a search actually
  // fires, then the seller types again before it resolves — isCurrent
  // guards against the earlier one's response landing after the later
  // one's and overwriting it with stale results.
  useEffect(() => {
    let isCurrent = true;
    const timeout = window.setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const { data } = await sellerApi.get('/products/get-all-products', {
          params: { limit: 20, search: productSearch || undefined },
        });
        if (isCurrent) setSearchResults(data.data?.products ?? []);
      } catch {
        // Non-critical — the picker just shows no results this pass.
      } finally {
        if (isCurrent) setIsSearchingProducts(false);
      }
    }, 250);
    return () => {
      isCurrent = false;
      window.clearTimeout(timeout);
    };
  }, [productSearch]);

  const toggleProductTarget = (product: TargetProduct) => {
    const isSelected = selectedProducts.some((p) => p._id === product._id);
    setSelectedProducts((current) =>
      isSelected ? current.filter((p) => p._id !== product._id) : [...current, product],
    );
    // Deselecting a product also drops any variant-level narrowing on it —
    // an unselected product's variants shouldn't stay in the payload.
    if (isSelected) {
      const productVariantIds = new Set((variantsByProduct[product._id] ?? []).map((v) => v._id));
      setSelectedVariantIds((current) => current.filter((id) => !productVariantIds.has(id)));
    }
  };

  const toggleExpandProduct = async (productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      return;
    }
    setExpandedProductId(productId);
    if (variantsByProduct[productId]) return;

    setIsLoadingVariants(true);
    try {
      const { data } = await sellerApi.get(`/products/get-product/${productId}`);
      setVariantsByProduct((current) => ({ ...current, [productId]: data.data?.variants ?? [] }));
    } catch {
      // Non-critical — the expand panel just shows "no variants" this pass.
    } finally {
      setIsLoadingVariants(false);
    }
  };

  const toggleVariantTarget = (variantId: string) => {
    setSelectedVariantIds((current) =>
      current.includes(variantId) ? current.filter((id) => id !== variantId) : [...current, variantId],
    );
  };

  const resetForm = () => {
    setName('');
    setValidFrom(today());
    setValidTill('');
    setIsActive(true);
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setMaxDiscountAmount('');
    setMinCartValue('');
    setCashbackAmount('');
    setBuyQty('');
    setGetQty('');
    setBundleItems([makeBundleItem()]);
    setBundlePrice('');
    setSelectedProducts([]);
    setProductSearch('');
    setSelectedVariantIds([]);
    setExpandedProductId(null);
  };

  const buildPayload = () => {
    const parsedProductIds = selectedProducts.map((p) => p._id);
    // Omitting variantIds defaults to all variants of the selected
    // products (confirmed in createOffer's controller) — only include it
    // when the seller actually narrowed down to specific variants.
    const appliesTo = selectedVariantIds.length > 0
      ? { productIds: parsedProductIds, variantIds: selectedVariantIds }
      : { productIds: parsedProductIds };

    const base = {
      name: name.trim(),
      type: offerType,
      validFrom: new Date(validFrom).toISOString(),
      validTill: new Date(validTill).toISOString(),
      isActive,
    };

    if (offerType === 'DISCOUNT') {
      return {
        ...base,
        appliesTo,
        config: { discountType, value: Number(discountValue) },
        ...(maxDiscountAmount ? { maxDiscountAmount: Number(maxDiscountAmount) } : {}),
        ...(minCartValue ? { minCartValue: Number(minCartValue) } : {}),
      };
    }

    if (offerType === 'CASHBACK') {
      return {
        ...base,
        appliesTo,
        config: { amount: Number(cashbackAmount) },
      };
    }

    if (offerType === 'BUY_GET') {
      return {
        ...base,
        appliesTo,
        config: { buyQty: Number(buyQty), getQty: Number(getQty) },
      };
    }

    return {
      ...base,
      config: {
        bundleItems: bundleItems.map((item) => ({
          productId: item.productId.trim(),
          quantity: Number(item.quantity),
        })),
        bundlePrice: Number(bundlePrice),
      },
    };
  };

  const buildCreatedOfferSummary = (): CreatedOffer => {
    const parsedProductIds = selectedProducts.map((p) => p._id);

    const discountLabel = (() => {
      if (offerType === 'DISCOUNT') {
        return discountType === 'PERCENTAGE' ? `−${discountValue}%` : `₹${discountValue} off`;
      }
      if (offerType === 'CASHBACK') return `₹${cashbackAmount} cashback`;
      if (offerType === 'BUY_GET') return `Buy ${buyQty} Get ${getQty}`;
      return `Bundle @ ₹${bundlePrice}`;
    })();

    const targetSummary = offerType === 'PRODUCT_BUNDLE'
      ? `${bundleItems.length} bundle item${bundleItems.length === 1 ? '' : 's'}`
      : selectedVariantIds.length > 0
        ? `${selectedVariantIds.length} variant${selectedVariantIds.length === 1 ? '' : 's'}`
        : `${parsedProductIds.length} product${parsedProductIds.length === 1 ? '' : 's'} (all variants)`;

    return {
      id: Date.now(),
      name: name.trim(),
      type: offerType,
      discountLabel,
      targetSummary,
      validFrom: new Date(validFrom).toISOString(),
      validTill: new Date(validTill).toISOString(),
    };
  };

  const submitOffer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The disabled attribute on the submit button only takes effect after
    // the next render — a fast double-click (or double Enter) can still
    // both fire before then. Guard explicitly rather than rely on timing.
    if (isSubmitting) return;

    if (offerType !== 'PRODUCT_BUNDLE' && selectedProducts.length === 0) {
      toast.error('Select at least one product for this offer to apply to.');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdSummary = buildCreatedOfferSummary();
      await sellerApi.post('/offer/create-offer', buildPayload());
      toast.success('Offer created successfully.');
      setCreatedOffers((current) => [createdSummary, ...current]);
      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to create offer.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="max-w-3xl! py-6 pb-28 lg:pb-8 lg:py-8">
      <div className="mb-6">
        <p className="font-mono text-[11px] font-bold text-muted">PROMOTIONS</p>
        <h1 className="mt-1.5 font-black text-[26px] leading-[1.1] tracking-[-.03em] text-ink">Offers</h1>
        <p className="mt-1 text-[12.5px] font-semibold text-muted">
          Build discounts, cashback, buy-get deals, and product bundles for your catalog.
        </p>
      </div>

      {createdOffers.length === 0 ? (
        <Panel className="mb-5">
          <EmptyState
            icon={<FiGift size={28} />}
            title="Your active offers will appear here"
            description="The seller API only exposes offer creation right now — listing, editing, and disabling existing offers needs endpoints that don't exist yet."
            action={
              <span className="flex items-center gap-2 rounded-full border border-line bg-soft2 px-4 py-2 text-xs font-semibold text-muted">
                <FiClock size={14} className="text-accent" />
                Offer listing coming soon
              </span>
            }
          />
        </Panel>
      ) : (
        <div className="mb-5">
          <p className="mb-3 flex items-center gap-1.5 text-[11.5px] font-semibold text-muted">
            <FiClock size={13} />
            Created this session — there's no listing endpoint yet, so this isn't a persisted offer list.
          </p>
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {(['ALL', 'Active', 'Scheduled', 'Expired'] as const).map((option) => (
              <Chip key={option} selected={statusFilter === option} onClick={() => setStatusFilter(option)}>
                {option === 'ALL' ? 'All' : option}
              </Chip>
            ))}
          </div>
          {(() => {
            const filteredOffers = createdOffers.filter(
              (offer) => statusFilter === 'ALL' || getOfferStatus(offer.validFrom, offer.validTill).label === statusFilter,
            );
            if (filteredOffers.length === 0) {
              return (
                <p className="rounded-tile bg-soft2 p-4 text-[12.5px] font-medium text-muted">
                  No {statusFilter.toLowerCase()} offers created this session.
                </p>
              );
            }
            return (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredOffers.map((offer) => {
                  const status = getOfferStatus(offer.validFrom, offer.validTill);
                  return (
                    <Card key={offer.id} interactive={false} padded className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[15px] font-extrabold text-ink">{offer.name || OFFER_TYPE_LABELS[offer.type]}</p>
                        <Badge tone="ink">{offer.discountLabel}</Badge>
                      </div>
                      <p className="font-mono text-[11px] text-muted">
                        {formatDateShort(offer.validFrom)} – {formatDateShort(offer.validTill)}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-semibold text-muted">{offer.targetSummary}</span>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      <form id="offer-form" onSubmit={submitOffer} className="space-y-5 pb-2">
        <Panel>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
              <FiGift size={20} />
            </span>
            <h2 className="text-[16px] font-extrabold text-ink">Offer Type</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(OFFER_TYPE_LABELS) as OfferType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOfferType(type)}
                className={`rounded-tile border p-3.5 text-left t-fast ${
                  offerType === type
                    ? 'border-accent bg-soft2 text-accent'
                    : 'border-line hover:border-accent hover:text-accent'
                }`}
              >
                <p className="text-[13px] font-bold">{OFFER_TYPE_LABELS[type]}</p>
                <p className="mt-1 text-[11.5px] font-medium text-muted">{OFFER_TYPE_DESCRIPTIONS[type]}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
              <FiTag size={20} />
            </span>
            <h2 className="text-[16px] font-extrabold text-ink">Offer Details</h2>
          </div>
          <div className="mt-4 space-y-3.5">
            <Input label="Offer Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Sale 10% Off" required />
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Input label="Valid From" type="datetime-local" min={today()} value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
              <Input label="Valid Till" type="datetime-local" min={validFrom || today()} value={validTill} onChange={(e) => setValidTill(e.target.value)} required />
            </div>
            <div className="flex items-center justify-between rounded-tile border border-line px-4 py-3.5">
              <div>
                <p className="text-[13px] font-bold text-ink">Active immediately</p>
                <p className="text-[11.5px] font-medium text-muted">Offer goes live as soon as it is created.</p>
              </div>
              <Switch checked={isActive} onChange={() => setIsActive((v) => !v)} label="Active immediately" />
            </div>
          </div>
        </Panel>

        {offerType !== 'PRODUCT_BUNDLE' && (
          <Panel>
            <h2 className="text-[16px] font-extrabold text-ink">Applies To</h2>
            <p className="mt-1 text-[12.5px] font-semibold text-muted">Search and select the products this offer applies to.</p>

            {selectedProducts.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedProducts.map((product) => (
                  <Chip key={product._id} selected onClick={() => toggleProductTarget(product)}>
                    {product.name}
                    <FiX size={12} />
                  </Chip>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2.5 rounded-full border border-line px-4 py-2.5 t-fast focus-within:border-accent">
              <FiSearch className="shrink-0 text-muted" size={15} />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by name"
                aria-label="Search products to target with this offer"
                className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted"
              />
            </div>

            <div className="mt-2.5 max-h-56 space-y-1.5 overflow-y-auto rounded-tile border border-line p-2">
              {isSearchingProducts && <p className="p-2 text-[12px] text-muted">Searching…</p>}
              {!isSearchingProducts && searchResults.length === 0 && (
                <p className="p-2 text-[12px] text-muted">No products found.</p>
              )}
              {!isSearchingProducts && searchResults.map((product) => {
                const checked = selectedProducts.some((p) => p._id === product._id);
                const isExpanded = expandedProductId === product._id;
                const variants = variantsByProduct[product._id];
                return (
                  <div key={product._id}>
                    <div className="flex items-center gap-2.5 rounded-[10px] px-2 py-2 t-fast hover:bg-soft2">
                      <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-[12.5px] font-semibold text-ink">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProductTarget(product)}
                          className="h-4 w-4 accent-(--k-accent)"
                        />
                        {product.name}
                      </label>
                      {checked && (
                        <button
                          type="button"
                          onClick={() => toggleExpandProduct(product._id)}
                          className="shrink-0 text-[11px] font-bold text-accent hover:underline"
                        >
                          {isExpanded ? 'Hide variants' : 'Variants'}
                        </button>
                      )}
                    </div>
                    {checked && isExpanded && (
                      <div className="ml-6 mb-1 space-y-1 border-l border-line pl-3">
                        {isLoadingVariants && !variants && <p className="py-1 text-[11px] text-muted">Loading variants…</p>}
                        {variants?.length === 0 && <p className="py-1 text-[11px] text-muted">No variants.</p>}
                        {variants?.map((variant) => (
                          <label key={variant._id} className="flex cursor-pointer items-center gap-2 py-1 text-[11.5px] font-medium text-ink">
                            <input
                              type="checkbox"
                              checked={selectedVariantIds.includes(variant._id)}
                              onChange={() => toggleVariantTarget(variant._id)}
                              className="h-3.5 w-3.5 accent-(--k-accent)"
                            />
                            {Object.entries(variant.attributes ?? {}).map(([k, v]) => `${k}: ${v}`).join(', ') || variant.sku || variant._id}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedProducts.length === 0 && (
              <p className="mt-2 text-[11px] font-medium text-danger">Select at least one product.</p>
            )}
          </Panel>
        )}

        <Panel>
          <h2 className="text-[16px] font-extrabold text-ink">{OFFER_TYPE_LABELS[offerType]} Configuration</h2>

          {offerType === 'DISCOUNT' && (
            <div className="mt-4 space-y-3.5">
              <div>
                <p className="mb-2 text-[12px] font-extrabold text-ink">Discount Type</p>
                <div className="flex gap-2">
                  {(['PERCENTAGE', 'FLAT'] as DiscountType[]).map((type) => (
                    <Chip key={type} selected={discountType === type} onClick={() => setDiscountType(type)}>
                      {type === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-3">
                <Input
                  label={discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENTAGE' ? '10' : '500'}
                  required
                />
                <Input label="Max Discount (₹)" type="number" min="0" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} placeholder="Optional" />
                <Input label="Min Cart Value (₹)" type="number" min="0" value={minCartValue} onChange={(e) => setMinCartValue(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          )}

          {offerType === 'CASHBACK' && (
            <div className="mt-4">
              <Input label="Cashback Amount (₹)" type="number" min="0" value={cashbackAmount} onChange={(e) => setCashbackAmount(e.target.value)} placeholder="50" required />
            </div>
          )}

          {offerType === 'BUY_GET' && (
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <Input label="Buy Quantity" type="number" min="1" value={buyQty} onChange={(e) => setBuyQty(e.target.value)} placeholder="2" required />
              <Input label="Get Quantity (Free)" type="number" min="1" value={getQty} onChange={(e) => setGetQty(e.target.value)} placeholder="1" required />
            </div>
          )}

          {offerType === 'PRODUCT_BUNDLE' && (
            <div className="mt-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-muted">Add the products that make up this bundle.</p>
                <Button type="button" variant="outline" size="sm" icon={<FiPlus size={16} />} onClick={addBundleItem}>
                  Add item
                </Button>
              </div>
              <div className="space-y-2.5">
                {bundleItems.map((item, index) => (
                  <div key={item.id} className="grid items-end gap-2.5 rounded-tile border border-line p-3 sm:grid-cols-[1fr_110px_40px]">
                    <Input
                      label="Product ID"
                      value={item.productId}
                      onChange={(e) => updateBundleItem(item.id, 'productId', e.target.value)}
                      placeholder="697bcc089b9dbee534801d65"
                      required
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateBundleItem(item.id, 'quantity', e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeBundleItem(item.id)}
                      aria-label={`Remove bundle item ${index + 1}`}
                      className="flex h-11 w-10 items-center justify-center rounded-btn border border-line text-muted t-fast hover:border-danger hover:text-danger"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <Input label="Bundle Price (₹)" type="number" min="0" value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} placeholder="999" required />
            </div>
          )}
        </Panel>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          icon={<FiGift size={16} />}
          className="hidden lg:inline-flex"
        >
          Create offer
        </Button>
      </form>

      <MobileActionBar>
        <Button type="submit" form="offer-form" variant="primary" fullWidth loading={isSubmitting} icon={<FiGift size={16} />}>
          Create offer
        </Button>
      </MobileActionBar>
    </Container>
  );
};

export default OffersPage;
