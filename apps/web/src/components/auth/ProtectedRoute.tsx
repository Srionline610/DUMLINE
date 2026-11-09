'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Role } from '@dumline/shared';
import { ShieldAlert, Lock, ArrowRight, LogOut, ChefHat, SlidersHorizontal, Home } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  if (!isClientMounted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-dumline-sand/20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-dumline-crimson border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-dumline-charcoal/60 uppercase tracking-wider">
            Verifying Authorization...
          </p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Gate
  if (!token || !user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-dumline-sand/20 px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-dumline-sand-dark bg-white p-8 text-center shadow-xl space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dumline-sand text-dumline-crimson">
            <Lock className="h-7 w-7" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-dumline-saffron-dark">
              Authentication Required
            </span>
            <h1 className="font-serif text-2xl font-bold text-dumline-charcoal mt-1">
              Sign In to Continue
            </h1>
            <p className="text-xs text-dumline-charcoal/70 mt-1.5 leading-relaxed">
              This operational section is protected. Please sign in with an authorized account to access this dashboard.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(pathname || '/')}`}
              className="w-full rounded-full bg-dumline-crimson py-3 text-xs font-bold text-white shadow hover:bg-dumline-crimson-dark transition-all text-center"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/"
              className="w-full rounded-full border border-dumline-sand-dark bg-transparent py-2.5 text-xs font-bold text-dumline-charcoal hover:bg-dumline-sand transition-all text-center flex items-center justify-center gap-1.5"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Return to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Role Authorization Gate
  const isAuthorized = allowedRoles.includes(user.role);

  if (!isAuthorized) {
    const getRoleDestination = (role: Role) => {
      switch (role) {
        case 'KITCHEN_STAFF':
          return { label: 'Go to Kitchen Display (KDS)', href: '/kds', icon: <ChefHat className="h-4 w-4" /> };
        case 'OUTLET_MANAGER':
          return { label: 'Go to Outlet Manager Dashboard', href: '/manager', icon: <SlidersHorizontal className="h-4 w-4" /> };
        case 'ADMIN':
          return { label: 'Go to Central Admin Dashboard', href: '/admin', icon: <ShieldAlert className="h-4 w-4" /> };
        case 'CUSTOMER':
        default:
          return { label: 'Go to Customer Storefront', href: '/', icon: <Home className="h-4 w-4" /> };
      }
    };

    const dest = getRoleDestination(user.role);

    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-dumline-sand/20 px-4 py-16">
        <div className="max-w-lg w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-100/60 px-2.5 py-0.5 rounded-full">
              HTTP 403 • ACCESS FORBIDDEN
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-dumline-charcoal mt-2">
              Unauthorized Role Access
            </h1>
            <p className="text-xs text-dumline-charcoal/70 mt-2 leading-relaxed">
              You are signed in as <strong className="text-dumline-charcoal">{user.fullName || user.email}</strong> with role{' '}
              <span className="font-bold text-dumline-crimson uppercase px-1.5 py-0.5 rounded bg-dumline-sand text-[11px]">
                {user.role}
              </span>.
            </p>
            <p className="text-xs text-dumline-charcoal/60 mt-1">
              This area is restricted to: <strong className="text-dumline-charcoal">{allowedRoles.join(', ')}</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={dest.href}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-dumline-charcoal px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-dumline-crimson transition-all"
            >
              {dest.icon}
              <span>{dest.label}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                router.push('/auth/login');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-dumline-sand-dark px-5 py-2.5 text-xs font-bold text-dumline-charcoal hover:bg-dumline-sand transition-all"
            >
              <LogOut className="h-3.5 w-3.5 text-dumline-crimson" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
}

