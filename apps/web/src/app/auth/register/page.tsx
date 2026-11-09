'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import ApiClient from '../../../lib/api';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // Explicit opt-in: unchecked by default per AGENTS.md rules
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await ApiClient.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        marketingConsent,
      });

      setAuth(res.token, res.user);
      router.push('/menu');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

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
          Create Your Royal Account
        </h2>
        <p className="text-xs text-dumline-charcoal/70">
          Join Dumline for seamless ordering, transparent pricing, and live kitchen tracking.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-dumline-sand-dark bg-white p-8 shadow-xl">
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dumline-charcoal/40" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Asif Jah"
                  className="w-full rounded-xl border border-dumline-sand-dark bg-dumline-sand/10 pl-10 pr-4 py-2.5 text-xs text-dumline-charcoal focus:border-dumline-crimson focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dumline-charcoal/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="asif@example.com"
                  className="w-full rounded-xl border border-dumline-sand-dark bg-dumline-sand/10 pl-10 pr-4 py-2.5 text-xs text-dumline-charcoal focus:border-dumline-crimson focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1">
                Mobile Number (10 digits)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dumline-charcoal/40" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                  className="w-full rounded-xl border border-dumline-sand-dark bg-dumline-sand/10 pl-10 pr-4 py-2.5 text-xs text-dumline-charcoal focus:border-dumline-crimson focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dumline-charcoal/40" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-dumline-sand-dark bg-dumline-sand/10 pl-10 pr-4 py-2.5 text-xs text-dumline-charcoal focus:border-dumline-crimson focus:outline-none"
                />
              </div>
            </div>

            {/* Explicit opt-in checkbox (unchecked by default) */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-dumline-charcoal cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-dumline-sand-dark text-dumline-crimson focus:ring-dumline-crimson"
                />
                <span className="leading-tight">
                  I agree to receive seasonal royal culinary updates, festival special handi notifications, and chef tasting invitations via WhatsApp/SMS. (Optional)
                </span>
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-dumline-crimson py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-dumline-crimson-dark disabled:opacity-50 transition-all"
              >
                <span>{isLoading ? 'Creating Royal Account...' : 'Complete Registration'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-dumline-charcoal/70">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-bold text-dumline-crimson hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

