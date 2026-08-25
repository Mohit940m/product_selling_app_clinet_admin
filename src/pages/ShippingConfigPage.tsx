import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiMapPin, FiSave, FiTruck } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Panel from '../components/ui/Panel';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import MobileActionBar from '../components/layout/MobileActionBar';
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
    <Container className="max-w-3xl! py-6 pb-28 lg:pb-8 lg:py-8">
      <div className="mb-6">
        <p className="font-mono text-[11px] font-bold text-muted">LOGISTICS</p>
        <h1 className="mt-1.5 font-black text-[26px] leading-[1.1] tracking-[-.03em] text-ink">Shipping</h1>
        <p className="mt-1 text-[12.5px] font-semibold text-muted">
          {hasConfig
            ? 'Update your shipping origin and delivery rates per zone.'
            : 'Set up your shipping origin and delivery rates to start selling.'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <form id="shipping-config-form" onSubmit={saveConfig} className="space-y-5">
          <Panel>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
                <FiMapPin size={20} />
              </span>
              <div>
                <h2 className="text-[16px] font-extrabold text-ink">Shipping Origin</h2>
                <p className="text-[12.5px] font-semibold text-muted">Where your products ship from.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <Input
                label="City"
                value={form.city}
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="e.g. Kolkata"
                required
              />
              <Input
                label="State"
                value={form.state}
                onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                placeholder="e.g. West Bengal"
                required
              />
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
                <FiTruck size={20} />
              </span>
              <div>
                <h2 className="text-[16px] font-extrabold text-ink">Shipping Rates</h2>
                <p className="text-[12.5px] font-semibold text-muted">Set cost (₹) and estimated delivery time for each delivery zone.</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              {RATE_KEYS.map((key) => (
                <div key={key} className="rounded-tile border border-line p-3.5 t-fast hover:border-accent">
                  <p className="text-[12.5px] font-bold text-ink">{RATE_LABELS[key]}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Cost (₹)"
                      type="number"
                      min="0"
                      value={form[key].cost}
                      onChange={(event) => updateRate(key, 'cost', event.target.value)}
                      placeholder="0"
                      required
                    />
                    <Input
                      label="Delivery Time"
                      type="text"
                      value={form[key].time}
                      onChange={(event) => updateRate(key, 'time', event.target.value)}
                      placeholder={DEFAULT_TIMES[key]}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Button type="submit" variant="primary" fullWidth loading={isSaving} icon={<FiSave size={16} />} className="hidden lg:inline-flex">
            {hasConfig ? 'Update configuration' : 'Create configuration'}
          </Button>
        </form>
      )}

      {!isLoading && (
        <MobileActionBar>
          <Button type="submit" form="shipping-config-form" variant="primary" fullWidth loading={isSaving} icon={<FiSave size={16} />}>
            {hasConfig ? 'Update configuration' : 'Create configuration'}
          </Button>
        </MobileActionBar>
      )}
    </Container>
  );
};

export default ShippingConfigPage;
