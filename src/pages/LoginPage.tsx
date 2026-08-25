import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiShield } from 'react-icons/fi';
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

type LoginStep = 'credentials' | 'otp';

const LoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resendCountdown = useCountdown(RESEND_COOLDOWN_SECONDS);

  const requestOtp = async () => {
    const { data } = await sellerApi.post('/auth/login', { email, password });

    if (data.success === false) {
      throw new Error(data.message ?? 'Unable to send OTP.');
    }

    setDevOtp(data.otp ?? '');
    toast.success(data.otp ? `Your login OTP is ${data.otp}` : data.message ?? 'OTP sent to your email.', {
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

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (step === 'credentials') {
        await requestOtp();
        await new Promise((resolve) => setTimeout(resolve, OTP_SCREEN_DELAY_MS));
        setStep('otp');
        setMessage('Enter the OTP to finish login.');
        return;
      }

      const { data } = await sellerApi.post('/auth/verify-login', { email, otp });

      if (data.success === false) {
        throw new Error(data.message ?? 'Unable to complete login.');
      }

      if (data.token) {
        localStorage.setItem('sellerToken', data.token);
      }
      toast.success('Login verified successfully.', {
        icon: <FiShield color="var(--k-accent)" />,
      });
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Unable to complete login.'
        : err instanceof Error ? err.message : 'Unable to complete login.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="SELLER WORKSPACE"
      heading="Manage listings, stock, offers, and shipping without losing the thread."
      features={['OTP protected access', 'Product controls', 'Shipping setup', 'Offer planning']}
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
          <FiLock size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Login</h1>
          <p className="text-sm text-muted">{step === 'credentials' ? 'Enter your seller credentials.' : 'Verify the OTP sent to your email.'}</p>
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

      <form className="space-y-4" onSubmit={submitLogin}>
        <Input
          label="Email"
          type="email"
          id="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={step === 'otp'}
          placeholder="seller@example.com"
          required
        />

        {step === 'credentials' ? (
          <div key="password" className="animate-up">
            <Input
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
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
          {step === 'credentials' ? 'Send OTP' : 'Verify and login'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New seller? <Link to="/signup" className="font-bold text-accent hover:underline">Create an account</Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
