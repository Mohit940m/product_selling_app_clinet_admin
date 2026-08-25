import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShield, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import sellerApi from '../api/sellerApi';
import AuthLayout from '../components/layout/AuthLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import OtpInput from '../components/auth/OtpInput';
import { useCountdown } from '../hooks/useCountdown';

const OTP_SCREEN_DELAY_MS = 1000;
const RESEND_COOLDOWN_SECONDS = 60;

type SignUpStep = 'details' | 'otp';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<SignUpStep>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resendCountdown = useCountdown(RESEND_COOLDOWN_SECONDS);

  const requestOtp = async () => {
    const { data } = await sellerApi.post('/auth/register', { name, email, password, phone: phone || undefined });

    if (data.success === false) {
      throw new Error(data.message ?? 'Unable to create seller account.');
    }

    setDevOtp(data.otp ?? '');
    toast.success(data.otp ? `Your registration OTP is ${data.otp}` : data.message ?? 'OTP sent to your email.', {
      icon: <FiShield color="var(--k-accent)" />,
    });
    setMessage('OTP sent to your email.');
    resendCountdown.start();
  };

  const resendOtp = async () => {
    setError('');
    try {
      await requestOtp();
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Unable to resend OTP.'
        : 'Unable to resend OTP.';
      toast.error(errorMessage);
    }
  };

  const submitSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (step === 'details') {
        await requestOtp();
        await new Promise((resolve) => setTimeout(resolve, OTP_SCREEN_DELAY_MS));
        setStep('otp');
        setMessage('Enter the OTP to verify your seller account.');
      } else {
        const { data } = await sellerApi.post('/auth/verify-registration', { email, otp });

        if (data.success === false) {
          throw new Error(data.message ?? 'Unable to create seller account.');
        }

        if (data.token) {
          localStorage.setItem('sellerToken', data.token);
        }
        if (data.seller) {
          localStorage.setItem('sellerProfile', JSON.stringify(data.seller));
        }
        toast.success('Seller account verified successfully.', {
          icon: <FiShield color="var(--k-accent)" />,
        });
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Unable to create seller account.'
        : err instanceof Error ? err.message : 'Unable to create seller account.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="SELLER ONBOARDING"
      heading="Create a verified account and move straight into your operating dashboard."
      features={['Email verification', 'Secure seller token', 'Catalog ready', 'Shipping controls']}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
          <FiUser size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Sign up</h1>
          <p className="text-sm text-muted">{step === 'details' ? 'Create your seller account.' : 'Verify your registration OTP.'}</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-btn border border-accent bg-soft2 p-3 text-sm font-semibold text-accent">{message}</div>
      )}
      {step === 'otp' && devOtp && (
        <div className="mb-4 flex items-center gap-2 rounded-btn border border-warn-fg/30 bg-warn-bg p-3">
          <Badge tone="warn">DEV</Badge>
          <p className="font-mono text-xs font-bold text-warn-fg">OTP: {devOtp} (shown for testing — no email is sent)</p>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-btn border border-danger bg-bad-bg p-3 text-sm font-semibold text-bad-fg">{error}</div>
      )}

      <form className="space-y-4" onSubmit={submitSignUp}>
        {step === 'details' ? (
          <div key="details" className="animate-up space-y-4">
            <Input label="Name" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
            <Input label="Email" type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seller@example.com" required />
            <Input label="Phone" type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            <Input
              label="Password"
              type="password"
              id="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </div>
        ) : (
          <div key="otp" className="animate-up">
            <p className="mb-2.5 text-[12px] font-extrabold text-ink">OTP</p>
            <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />
            <button
              type="button"
              onClick={resendOtp}
              disabled={!resendCountdown.isReady}
              className="mt-3 text-xs font-bold text-muted disabled:cursor-not-allowed enabled:text-accent enabled:hover:underline"
            >
              {resendCountdown.isReady ? 'Resend OTP' : `Resend OTP in ${resendCountdown.remaining}s`}
            </button>
          </div>
        )}

        <Button type="submit" variant="primary" loading={isSubmitting} fullWidth>
          {step === 'details' ? 'Create account' : 'Verify account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already registered? <Link to="/login" className="font-bold text-accent hover:underline">Login</Link>
      </p>
    </AuthLayout>
  );
};

export default SignUpPage;
