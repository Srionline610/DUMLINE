'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import ApiClient from '../../../lib/api';
import { DEMO_CREDENTIALS } from '../../../lib/constants';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  User,
  ChefHat,
  SlidersHorizontal,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { setAuth } = useAuthStore();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoleDefaultDestination = (role: string): string => {
    switch (role) {
      case 'KITCHEN_STAFF':
        return '/kds';
      case 'OUTLET_MANAGER':
        return '/manager';
      case 'ADMIN':
        return '/admin';
      case 'CUSTOMER':
      default:
        return '/';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.login({
        emailOrPhone: emailOrPhone.trim(),
        password,
      });
      setAuth(res.token, res.user);
      const destination = redirectUrl && redirectUrl !== '/' ? redirectUrl : getRoleDefaultDestination(res.user.role);
      router.push(destination);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPersona = async (email: string, pass: string, targetRedirect?: string) => {
    setEmailOrPhone(email);
    setPassword(pass);
    setIsLoading(true);
    setError(null);
    try {
      const res = await ApiClient.login({
        emailOrPhone: email,
        password: pass,
      });
      setAuth(res.token, res.user);
      const destination = targetRedirect || (redirectUrl && redirectUrl !== '/' ? redirectUrl : getRoleDefaultDestination(res.user.role));
      router.push(destination);
    } catch (err: any) {
      setError(err.message || 'Persona login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-dumline-sand-dark bg-white p-8 shadow-xl">
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1.5">
            Email or Mobile Number
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dumline-charcoal/40" />
            <input
              type="text"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="e.g. customer@dumline.com or 9876543210"
              className="w-full rounded-xl border border-dumline-sand-dark bg-dumline-sand/10 pl-10 pr-4 py-2.5 text-sm text-dumline-charcoal focus:border-dumline-crimson focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-dumline-charcoal">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dumline-charcoal/40" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-dumline-sand-dark bg-dumline-sand/10 pl-10 pr-4 py-2.5 text-sm text-dumline-charcoal focus:border-dumline-crimson focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-dumline-crimson py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-dumline-crimson-dark disabled:opacity-50 transition-all"
        >
          <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-dumline-charcoal/70">
        Don't have an account yet?{' '}
        <Link
          href="/auth/register"
          className="font-bold text-dumline-crimson hover:underline"
        >
          Register here
        </Link>
      </div>

      {/* Quick Demo Personas For IsoCode Labs Evaluators */}
      <div className="mt-8 pt-6 border-t border-dumline-sand">
        <div className="flex items-center gap-1.5 mb-3 text-[11px] font-bold uppercase tracking-wider text-dumline-saffron-dark">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Assessment Demo Personas (1-Click Switch)</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              handleQuickPersona(DEMO_CREDENTIALS.customer.email, DEMO_CREDENTIALS.customer.password, '/menu')
            }
            className="flex items-center gap-2 rounded-xl border border-dumline-sand-dark bg-dumline-sand/20 p-2.5 text-left hover:bg-dumline-sand transition-colors"
          >
            <User className="h-4 w-4 text-dumline-crimson shrink-0" />
            <div>
              <div className="font-bold text-dumline-charcoal text-[11px]">Customer</div>
              <div className="text-[9px] text-dumline-charcoal/60 truncate">Browse & Order</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickPersona(DEMO_CREDENTIALS.kitchenStaff.email, DEMO_CREDENTIALS.kitchenStaff.password, '/kds')
            }
            className="flex items-center gap-2 rounded-xl border border-dumline-sand-dark bg-dumline-sand/20 p-2.5 text-left hover:bg-dumline-sand transition-colors"
          >
            <ChefHat className="h-4 w-4 text-dumline-crimson shrink-0" />
            <div>
              <div className="font-bold text-dumline-charcoal text-[11px]">Kitchen Staff</div>
              <div className="text-[9px] text-dumline-charcoal/60 truncate">KDS Operations</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickPersona(DEMO_CREDENTIALS.outletManager.email, DEMO_CREDENTIALS.outletManager.password, '/manager')
            }
            className="flex items-center gap-2 rounded-xl border border-dumline-sand-dark bg-dumline-sand/20 p-2.5 text-left hover:bg-dumline-sand transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4 text-dumline-crimson shrink-0" />
            <div>
              <div className="font-bold text-dumline-charcoal text-[11px]">Outlet Manager</div>
              <div className="text-[9px] text-dumline-charcoal/60 truncate">Prep-Time Override</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickPersona(DEMO_CREDENTIALS.admin.email, DEMO_CREDENTIALS.admin.password, '/admin')
            }
            className="flex items-center gap-2 rounded-xl border border-dumline-sand-dark bg-dumline-sand/20 p-2.5 text-left hover:bg-dumline-sand transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-dumline-crimson shrink-0" />
            <div>
              <div className="font-bold text-dumline-charcoal text-[11px]">Central Admin</div>
              <div className="text-[9px] text-dumline-charcoal/60 truncate">Catalog & 86ing</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-dumline-sand/20 py-12 flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-block group">
          <span className="font-serif text-3xl font-bold tracking-tight text-dumline-charcoal group-hover:text-dumline-crimson transition-colors">
            DUMLINE
          </span>
          <div className="text-[10px] uppercase tracking-[0.25em] text-dumline-saffron-dark font-semibold">
            The Modern Royal Kitchen
          </div>
        </Link>
        <h2 className="font-serif text-2xl font-bold text-dumline-charcoal">
          Sign In to Your Royal Account
        </h2>
        <p className="text-xs text-dumline-charcoal/70">
          Access your royal orders, address book, or kitchen management portals.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="rounded-3xl border border-dumline-sand-dark bg-white p-8 shadow-xl text-center text-xs text-dumline-charcoal/60">
              Loading royal sign in portal...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
