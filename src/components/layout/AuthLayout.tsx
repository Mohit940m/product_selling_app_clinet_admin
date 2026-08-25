import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BrandMark from './BrandMark';

interface AuthLayoutProps {
  eyebrow: string;
  heading: string;
  features: string[];
  children: ReactNode;
}

/** Shared auth shell for /login and /signup — outside AdminLayout. */
const AuthLayout = ({ eyebrow, heading, features, children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="border-b border-line bg-card lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <BrandMark size={28} />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_420px] lg:items-center">
          <section className="hidden rounded-hero bg-soft p-11 lg:block">
            <BrandMark size={30} className="mb-8" />
            <p className="font-mono text-[11px] font-bold text-[var(--k-on-soft-muted)]">{eyebrow}</p>
            <h1 className="mt-3 max-w-lg font-black text-[38px] leading-[1.1] tracking-[-.03em] text-[var(--k-on-soft)]">
              {heading}
            </h1>
            <div className="mt-10 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-[180px] w-[180px] rounded-full bg-white/45" />
                <div className="bg-hatch2 relative flex h-[190px] w-[230px] animate-float items-center justify-center rounded-hero border border-line">
                  <span className="font-mono text-[10px] font-medium text-muted">hero illustration</span>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {features.map((item) => (
                <div key={item} className="rounded-tile border border-line bg-card p-3.5">
                  <p className="text-[12.5px] font-bold text-ink">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-[420px] rounded-hero border border-line bg-card p-6 shadow-kartly sm:p-8">
            {children}
          </section>
        </div>
      </main>

      <footer className="border-t border-line bg-card px-5 py-4 text-center text-[11px] font-medium text-muted lg:hidden">
        <Link to="/dashboard">Seller Admin</Link>
      </footer>
    </div>
  );
};

export default AuthLayout;
