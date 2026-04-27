import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiShield, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import sellerApi from '../api/sellerApi';
import Button from '../components/Button';

const OTP_SCREEN_DELAY_MS = 1000;

type LoginStep = 'credentials' | 'otp';

const AuthTopBar = () => (
  <header className="border-b border-gray-200 bg-white">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-text">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
          <FiShoppingBag size={22} />
        </span>
        <span className="text-lg font-bold">Seller Admin</span>
      </Link>
      <Link to="/signup" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-text hover:border-primary hover:text-accent">
        Create account
      </Link>
    </div>
  </header>
);

const AuthFooter = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>Seller Admin</p>
      <p>Products, shipping, stock, and offers in one workspace.</p>
    </div>
  </footer>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const endpoint = step === 'credentials' ? '/auth/login' : '/auth/verify-login';
      const payload = step === 'credentials' ? { email, password } : { email, otp };
      const { data } = await sellerApi.post(endpoint, payload);

      if (data.success === false) {
        throw new Error(data.message ?? 'Unable to complete login.');
      }

      if (step === 'credentials') {
        toast.success(data.otp ? `Your login OTP is ${data.otp}` : data.message ?? 'OTP sent to your email.', {
          icon: <FiShield color="#A78BFA" />,
        });
        setMessage('OTP sent. Opening verification...');
        await new Promise((resolve) => setTimeout(resolve, OTP_SCREEN_DELAY_MS));
        setStep('otp');
        setMessage('Enter the OTP to finish login.');
        return;
      }

      if (data.token) {
        localStorage.setItem('sellerToken', data.token);
      }
      toast.success('Login verified successfully.', {
        icon: <FiShield color="#A78BFA" />,
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
    <div className="flex min-h-screen flex-col bg-background text-text">
      <AuthTopBar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Seller workspace</p>
            <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight text-text">
              Manage listings, stock, offers, and shipping without losing the thread.
            </h1>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-4">
              {['OTP protected access', 'Product controls', 'Shipping setup', 'Offer planning'].map((item) => (
                <div key={item} className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                  <FiShield className="text-primary" size={24} />
                  <p className="mt-3 text-sm font-semibold text-text">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-md sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
                <FiLock size={24} />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-text">Login</h2>
                <p className="text-sm text-gray-600">{step === 'credentials' ? 'Enter your seller credentials.' : 'Verify the OTP sent to your email.'}</p>
              </div>
            </div>

            {message && <div className="mb-4 rounded-lg border border-primary bg-secondary p-3 text-sm text-accent">{message}</div>}
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form className="space-y-4" onSubmit={submitLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text">Email</label>
                <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary">
                  <FiMail className="text-primary" size={20} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={step === 'otp'}
                    className="w-full px-3 py-3 text-sm outline-none disabled:bg-white disabled:text-gray-500"
                    placeholder="seller@example.com"
                    required
                  />
                </div>
              </div>

              {step === 'credentials' ? (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-text">OTP</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="6 digit OTP"
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                label={isSubmitting ? 'Please wait...' : step === 'credentials' ? 'Send OTP' : 'Verify and login'}
                className="w-full py-3"
              />
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              New seller? <Link to="/signup" className="font-semibold text-accent hover:underline">Create an account</Link>
            </p>
          </section>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
};

export default LoginPage;
