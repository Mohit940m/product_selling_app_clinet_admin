import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiMapPin, FiSave, FiTruck } from 'react-icons/fi';
import Button from '../components/Button';
import sellerApi from '../api/sellerApi';

type ShippingRate = {
  cost: string;
  time: string;
};

type ShippingFormState = {
  city: string;
  state: string;
  sameCity: ShippingRate;
  sameState: ShippingRate;
  sameRegion: ShippingRate;
  restOfIndia: ShippingRate;
  remote: ShippingRate;
};

const RATE_KEYS = ['sameCity', 'sameState', 'sameRegion', 'restOfIndia', 'remote'] as const;
type RateKey = (typeof RATE_KEYS)[number];

const RATE_LABELS: Record<RateKey, string> = {
  sameCity: 'Same City',
  sameState: 'Same State',
  sameRegion: 'Same Region',
  restOfIndia: 'Rest of India',
  remote: 'Remote Areas',
};

const DEFAULT_TIMES: Record<RateKey, string> = {
  sameCity: '1-2 Days',
  sameState: '2-3 Days',
  sameRegion: '3-5 Days',
  restOfIndia: '5-7 Days',
  remote: '7-10 Days',
};

const defaultForm = (): ShippingFormState => ({
  city: '',
  state: '',
  sameCity: { cost: '', time: '1-2 Days' },
  sameState: { cost: '', time: '2-3 Days' },
  sameRegion: { cost: '', time: '3-5 Days' },
  restOfIndia: { cost: '', time: '5-7 Days' },
  remote: { cost: '', time: '7-10 Days' },
});

const getErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? err.message ?? fallback;
  return err instanceof Error ? err.message : fallback;
};

const ShippingConfigPage = () => {
  const [form, setForm] = useState<ShippingFormState>(defaultForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await sellerApi.get('/shipping/get-shipping-config');
        const config = data.data;

        if (config) {
          setHasConfig(true);
          const rates = config.shippingRates ?? {};
          setForm({
            city: config.origin?.city ?? '',
            state: config.origin?.state ?? '',
            ...Object.fromEntries(
              RATE_KEYS.map((key) => [
                key,
                {
                  cost: String(rates[key]?.cost ?? ''),
                  time: rates[key]?.time ?? DEFAULT_TIMES[key],
                },
              ]),
            ) as Record<RateKey, ShippingRate>,
          });
        }
      } catch (err) {
        if (!axios.isAxiosError(err) || err.response?.status !== 404) {
          toast.error(getErrorMessage(err, 'Unable to load shipping configuration.'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const updateRate = (key: RateKey, field: keyof ShippingRate, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
  };

  const saveConfig = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        origin: { city: form.city.trim(), state: form.state.trim() },
        shippingRates: Object.fromEntries(
          RATE_KEYS.map((key) => [
            key,
            { cost: Number(form[key].cost), time: form[key].time.trim() },
          ]),
        ),
      };

      if (hasConfig) {
        await sellerApi.put('/shipping/update-shipping-config', payload);
      } else {
        await sellerApi.post('/shipping/create-shipping-config', payload);
        setHasConfig(true);
      }

      toast.success('Shipping configuration saved successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to save shipping configuration.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Logistics</p>
          <h1 className="mt-2 text-2xl font-bold text-text">Shipping Configuration</h1>
          <p className="mt-1 text-sm text-gray-600">
            {hasConfig
              ? 'Update your shipping origin and delivery rates per zone.'
              : 'Set up your shipping origin and delivery rates to start selling.'}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-md">
            Loading configuration...
          </div>
        ) : (
          <form onSubmit={saveConfig} className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <FiMapPin size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-text">Shipping Origin</h2>
                  <p className="text-sm text-gray-600">Where your products ship from.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-text">City</label>
                  <input
                    id="city"
                    value={form.city}
                    onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Kolkata"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-text">State</label>
                  <input
                    id="state"
                    value={form.state}
                    onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. West Bengal"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                  <FiTruck size={22} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-text">Shipping Rates</h2>
                  <p className="text-sm text-gray-600">Set cost (₹) and estimated delivery time for each delivery zone.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {RATE_KEYS.map((key) => (
                  <div key={key} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-text">{RATE_LABELS[key]}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Cost (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={form[key].cost}
                          onChange={(event) => updateRate(key, 'cost', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600">Delivery Time</label>
                        <input
                          type="text"
                          value={form[key].time}
                          onChange={(event) => updateRate(key, 'time', event.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder={DEFAULT_TIMES[key]}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Button
              type="submit"
              label={isSaving ? 'Saving...' : hasConfig ? 'Update configuration' : 'Create configuration'}
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

export default ShippingConfigPage;
