import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiGift, FiPlus, FiTag, FiTrash2 } from 'react-icons/fi';
import Button from '../components/Button';
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

  const [bundleItems, setBundleItems] = useState<BundleItem[]>([{ id: Date.now(), productId: '', quantity: '1' }]);
  const [bundlePrice, setBundlePrice] = useState('');

  const [productIds, setProductIds] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addBundleItem = () => {
    setBundleItems((current) => [...current, { id: Date.now(), productId: '', quantity: '1' }]);
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
    setBundleItems([{ id: Date.now(), productId: '', quantity: '1' }]);
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
    <div className="min-h-screen bg-background text-text">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Promotions</p>
          <h1 className="mt-2 text-2xl font-bold text-text">Create Offer</h1>
          <p className="mt-1 text-sm text-gray-600">
            Build discounts, cashback, buy-get deals, and product bundles for your catalog.
          </p>
        </div>

        <form onSubmit={submitOffer} className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <FiGift size={22} />
              </span>
              <h2 className="text-lg font-bold text-text">Offer Type</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(OFFER_TYPE_LABELS) as OfferType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOfferType(type)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    offerType === type
                      ? 'border-primary bg-secondary text-accent'
                      : 'border-gray-200 hover:border-primary hover:text-accent'
                  }`}
                >
                  <p className="text-sm font-bold">{OFFER_TYPE_LABELS[type]}</p>
                  <p className="mt-1 text-xs text-gray-600">{OFFER_TYPE_DESCRIPTIONS[type]}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <FiTag size={22} />
              </span>
              <h2 className="text-lg font-bold text-text">Offer Details</h2>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="offer-name" className="block text-sm font-medium text-text">Offer Name</label>
                <input
                  id="offer-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Summer Sale 10% Off"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="valid-from" className="block text-sm font-medium text-text">Valid From</label>
                  <input
                    id="valid-from"
                    type="datetime-local"
                    value={validFrom}
                    onChange={(event) => setValidFrom(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="valid-till" className="block text-sm font-medium text-text">Valid Till</label>
                  <input
                    id="valid-till"
                    type="datetime-local"
                    value={validTill}
                    onChange={(event) => setValidTill(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <div>
                  <p className="text-sm font-medium text-text">Active immediately</p>
                  <p className="text-xs text-gray-600">Offer goes live as soon as it is created.</p>
                </div>
              </label>
            </div>
          </section>

          {offerType !== 'PRODUCT_BUNDLE' && (
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <h2 className="text-lg font-bold text-text">Applies To</h2>
              <p className="mt-1 text-sm text-gray-600">Enter the product IDs this offer applies to, separated by commas.</p>
              <textarea
                value={productIds}
                onChange={(event) => setProductIds(event.target.value)}
                className="mt-3 min-h-20 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="697bcc089b9dbee534801d65, 697bcc089b9dbee534801d66"
                required
              />
            </section>
          )}

          <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
            <h2 className="text-lg font-bold text-text">
              {OFFER_TYPE_LABELS[offerType]} Configuration
            </h2>

            {offerType === 'DISCOUNT' && (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 block text-sm font-medium text-text">Discount Type</p>
                  <div className="flex gap-3">
                    {(['PERCENTAGE', 'FLAT'] as DiscountType[]).map((type) => (
                      <label key={type} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium hover:border-primary">
                        <input
                          type="radio"
                          name="discount-type"
                          value={type}
                          checked={discountType === type}
                          onChange={() => setDiscountType(type)}
                          className="accent-primary"
                        />
                        {type === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="discount-value" className="block text-sm font-medium text-text">
                      {discountType === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                    </label>
                    <input
                      id="discount-value"
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(event) => setDiscountValue(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder={discountType === 'PERCENTAGE' ? '10' : '500'}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="max-discount" className="block text-sm font-medium text-text">Max Discount (₹)</label>
                    <input
                      id="max-discount"
                      type="number"
                      min="0"
                      value={maxDiscountAmount}
                      onChange={(event) => setMaxDiscountAmount(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label htmlFor="min-cart" className="block text-sm font-medium text-text">Min Cart Value (₹)</label>
                    <input
                      id="min-cart"
                      type="number"
                      min="0"
                      value={minCartValue}
                      onChange={(event) => setMinCartValue(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            )}

            {offerType === 'CASHBACK' && (
              <div className="mt-4">
                <label htmlFor="cashback-amount" className="block text-sm font-medium text-text">Cashback Amount (₹)</label>
                <input
                  id="cashback-amount"
                  type="number"
                  min="0"
                  value={cashbackAmount}
                  onChange={(event) => setCashbackAmount(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="50"
                  required
                />
              </div>
            )}

            {offerType === 'BUY_GET' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="buy-qty" className="block text-sm font-medium text-text">Buy Quantity</label>
                  <input
                    id="buy-qty"
                    type="number"
                    min="1"
                    value={buyQty}
                    onChange={(event) => setBuyQty(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="get-qty" className="block text-sm font-medium text-text">Get Quantity (Free)</label>
                  <input
                    id="get-qty"
                    type="number"
                    min="1"
                    value={getQty}
                    onChange={(event) => setGetQty(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="1"
                    required
                  />
                </div>
              </div>
            )}

            {offerType === 'PRODUCT_BUNDLE' && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Add the products that make up this bundle.</p>
                  <Button type="button" label="Add item" icon={<FiPlus size={16} />} onClick={addBundleItem} />
                </div>
                <div className="space-y-3">
                  {bundleItems.map((item, index) => (
                    <div key={item.id} className="grid items-center gap-3 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_120px_44px]">
                      <div>
                        <label className="block text-xs text-gray-600">Product ID</label>
                        <input
                          type="text"
                          value={item.productId}
                          onChange={(event) => updateBundleItem(item.id, 'productId', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="697bcc089b9dbee534801d65"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) => updateBundleItem(item.id, 'quantity', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBundleItem(item.id)}
                        aria-label={`Remove bundle item ${index + 1}`}
                        className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div>
                  <label htmlFor="bundle-price" className="block text-sm font-medium text-text">Bundle Price (₹)</label>
                  <input
                    id="bundle-price"
                    type="number"
                    min="0"
                    value={bundlePrice}
                    onChange={(event) => setBundlePrice(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="999"
                    required
                  />
                </div>
              </div>
            )}
          </section>

          <Button
            type="submit"
            label={isSubmitting ? 'Creating offer...' : 'Create offer'}
            icon={<FiGift size={18} />}
            disabled={isSubmitting}
            className="w-full py-3"
          />
        </form>
      </main>
    </div>
  );
};

export default OffersPage;
