import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiShield, FiShoppingBag, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import sellerApi from '../api/sellerApi';
import Button from '../components/Button';

const OTP_SCREEN_DELAY_MS = 1000;

type SignUpStep = 'details' | 'otp';

const AuthTopBar = () => (
  <header className="border-b border-gray-200 bg-white">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-text">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
          <FiShoppingBag size={22} />
        </span>
        <span className="text-lg font-bold">Seller Admin</span>
      </Link>
      <Link to="/login" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-text hover:border-primary hover:text-accent">
        Login
      </Link>
    </div>
  </header>
);

const AuthFooter = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>Seller Admin</p>
      <p>Start with auth, then manage catalog, stock, shipping, and offers.</p>
    </div>
  </footer>
);

const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<SignUpStep>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const endpoint = step === 'details' ? '/auth/register' : '/auth/verify-registration';
      const payload = step === 'details' ? { name, email, password, phone: phone || undefined } : { email, otp };
      const { data } = await sellerApi.post(endpoint, payload);

      if (data.success === false) {
        throw new Error(data.message ?? 'Unable to create seller account.');
      }

      if (step === 'details') {
        toast.success(data.otp ? `Your registration OTP is ${data.otp}` : data.message ?? 'OTP sent to your email.', {
          icon: <FiShield color="#A78BFA" />,
        });
        setMessage('OTP sent. Opening verification...');
        await new Promise((resolve) => setTimeout(resolve, OTP_SCREEN_DELAY_MS));
        setStep('otp');
        setMessage('Enter the OTP to verify your seller account.');
        return;
      }

      if (data.token) {
        localStorage.setItem('sellerToken', data.token);
      }
      if (data.seller) {
        localStorage.setItem('sellerProfile', JSON.stringify(data.seller));
      }
      toast.success('Seller account verified successfully.', {
        icon: <FiShield color="#A78BFA" />,
      });
      navigate('/dashboard');
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
    <div className="flex min-h-screen flex-col bg-background text-text">
      <AuthTopBar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[440px_1fr] lg:items-center">
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-md sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
                <FiUser size={24} />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-text">Sign Up</h2>
                <p className="text-sm text-gray-600">{step === 'details' ? 'Create your seller account.' : 'Verify your registration OTP.'}</p>
              </div>
            </div>

            {message && <div className="mb-4 rounded-lg border border-primary bg-secondary p-3 text-sm text-accent">{message}</div>}
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <form className="space-y-4" onSubmit={submitSignUp}>
              {step === 'details' ? (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text">Email</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary">
                      <FiMail className="text-primary" size={20} />
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full px-3 py-3 text-sm outline-none"
                        placeholder="seller@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text">Phone</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary">
                      <FiPhone className="text-primary" size={20} />
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        className="w-full px-3 py-3 text-sm outline-none"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-text">Password</label>
                    <input
                      type="password"
                      id="password"
                      minLength={6}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>
                </>
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
                label={isSubmitting ? 'Please wait...' : step === 'details' ? 'Create account' : 'Verify account'}
                className="w-full py-3"
              />
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already registered? <Link to="/login" className="font-semibold text-accent hover:underline">Login</Link>
            </p>
          </section>

          <section className="hidden lg:block">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Seller onboarding</p>
            <h1 className="mt-3 max-w-xl text-4xl font-bold leading-tight text-text">
              Create a verified account and move straight into your operating dashboard.
            </h1>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-4">
              {['Email verification', 'Secure seller token', 'Catalog ready', 'Shipping controls'].map((item) => (
                <div key={item} className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                  <FiShield className="text-primary" size={24} />
                  <p className="mt-3 text-sm font-semibold text-text">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <AuthFooter />
    </div>
  );
};

export default SignUpPage;
