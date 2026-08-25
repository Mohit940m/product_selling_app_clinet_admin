import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiClock, FiGift, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Panel from '../components/ui/Panel';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Chip from '../components/ui/Chip';
import Switch from '../components/ui/Switch';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import sellerApi from '../api/sellerApi';

type OfferType = 'DISCOUNT' | 'CASHBACK' | 'BUY_GET' | 'PRODUCT_BUNDLE';
type DiscountType = 'PERCENTAGE' | 'FLAT';

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

const today = () => new Date().toISOString().slice(0, 16);
const makeBundleItem = (): BundleItem => ({ id: Date.now() + Math.floor(Math.random() * 1000), productId: '', quantity: '1' });

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

  const [productIds, setProductIds] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addBundleItem = () => {
    setBundleItems((current) => [...current, makeBundleItem()]);
  };

  const removeBundleItem = (id: number) => {
    setBundleItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  };

  const updateBundleItem = (id: number, field: 'productId' | 'quantity', value: string) => {
    setBundleItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
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
    setProductIds('');
  };

  const buildPayload = () => {
    const parsedProductIds = productIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

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
        appliesTo: { productIds: parsedProductIds },
        config: { discountType, value: Number(discountValue) },
        ...(maxDiscountAmount ? { maxDiscountAmount: Number(maxDiscountAmount) } : {}),
        ...(minCartValue ? { minCartValue: Number(minCartValue) } : {}),
      };
    }

    if (offerType === 'CASHBACK') {
      return {
        ...base,
        appliesTo: { productIds: parsedProductIds },
        config: { amount: Number(cashbackAmount) },
      };
    }

    if (offerType === 'BUY_GET') {
      return {
        ...base,
        appliesTo: { productIds: parsedProductIds },
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

  const submitOffer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await sellerApi.post('/offer/create-offer', buildPayload());
      toast.success('Offer created successfully.');
      resetForm();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to create offer.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="max-w-3xl! py-6 lg:py-8">
      <div className="mb-6">
        <p className="font-mono text-[11px] font-bold text-muted">PROMOTIONS</p>
        <h1 className="mt-1.5 font-black text-[26px] leading-[1.1] tracking-[-.03em] text-ink">Offers</h1>
        <p className="mt-1 text-[12.5px] font-semibold text-muted">
          Build discounts, cashback, buy-get deals, and product bundles for your catalog.
        </p>
      </div>

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

      <form onSubmit={submitOffer} className="space-y-5">
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
              <Input label="Valid From" type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
              <Input label="Valid Till" type="datetime-local" value={validTill} onChange={(e) => setValidTill(e.target.value)} required />
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
            <p className="mt-1 text-[12.5px] font-semibold text-muted">Enter the product IDs this offer applies to, separated by commas.</p>
            <Textarea
              wrapperClassName="mt-3"
              value={productIds}
              onChange={(e) => setProductIds(e.target.value)}
              className="min-h-20"
              placeholder="697bcc089b9dbee534801d65, 697bcc089b9dbee534801d66"
              required
            />
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

        <Button type="submit" variant="primary" fullWidth loading={isSubmitting} icon={<FiGift size={16} />}>
          Create offer
        </Button>
      </form>
    </Container>
  );
};

export default OffersPage;
