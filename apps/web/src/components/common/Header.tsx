'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '../../store/cartStore';
import { useOutletStore } from '../../store/outletStore';
import { useAuthStore } from '../../store/authStore';
import {
  ShoppingBag,
  MapPin,
  ChevronDown,
  User,
  LogOut,
  ChefHat,
  ShieldAlert,
  SlidersHorizontal,
  Menu as MenuIcon,
  X,
  Receipt,
  ExternalLink,
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { getItemCount, toggleCart, items, boundOutletId, openSwitchModal } = useCartStore();
  const { outlets, selectedOutlet, setSelectedOutlet, loadOutlets } = useOutletStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [outletMenuOpen, setOutletMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSelectOutlet = (outlet: (typeof outlets)[0]) => {
    if (items.length > 0 && boundOutletId && boundOutletId !== outlet.id) {
      openSwitchModal({ targetOutlet: outlet });
    } else {
      setSelectedOutlet(outlet);
    }
  };

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  const itemCount = getItemCount();

  // If on KDS route, KDS has its own specialized operational fullscreen interface
  if (pathname?.startsWith('/kds')) {
    return null;
  }

  const role = user?.role;
  const isKitchenStaff = role === 'KITCHEN_STAFF';
  const isOutletManager = role === 'OUTLET_MANAGER';
  const isAdmin = role === 'ADMIN';
  const isOperationalStaff = isKitchenStaff || isOutletManager || isAdmin;

  // Determine assigned outlet name for staff
  const assignedOutlet = outlets.find((o) => o.id === user?.assignedOutletId) || selectedOutlet;

  // Brand link and subtitle based on role
  const brandHref = isKitchenStaff ? '/kds' : isOutletManager ? '/manager' : isAdmin ? '/admin' : '/';
  const brandSubtitle = isKitchenStaff
    ? 'Kitchen Operations'
    : isOutletManager
    ? 'Outlet Management'
    : isAdmin
    ? 'Central Administration'
    : 'The Modern Royal Kitchen';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-dumline-sand bg-dumline-ivory/95 backdrop-blur-md">
      {/* Top Banner */}
      <div className="bg-dumline-charcoal px-4 py-1.5 text-center text-xs text-dumline-sand font-medium tracking-wider flex items-center justify-center gap-2">
        <span>✨ THE ART OF DUM COOKING — AUTHENTIC HYDERABADI DUM BIRYANI & NIZAMI SPECIALTIES</span>
        {isOperationalStaff && (
          <span className="hidden sm:inline-block rounded-full bg-dumline-saffron/20 px-2 py-0.2 text-[10px] font-bold text-dumline-saffron uppercase tracking-widest border border-dumline-saffron/40">
            {role?.replace('_', ' ')} PORTAL
          </span>
        )}
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo & Outlet Context */}
        <div className="flex items-center gap-6">
          <Link href={brandHref} className="group flex flex-col items-start focus:outline-none">
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-dumline-charcoal group-hover:text-dumline-crimson transition-colors">
              DUMLINE
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-dumline-saffron-dark font-semibold">
              {brandSubtitle}
            </span>
          </Link>

          {/* Customer / Guest / Admin: Outlet Selector Dropdown */}
          {(!isKitchenStaff && !isOutletManager) && (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setOutletMenuOpen(!outletMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-dumline-sand-dark bg-dumline-sand/40 px-3.5 py-1.5 text-xs font-semibold text-dumline-charcoal hover:bg-dumline-sand transition-all"
                aria-expanded={outletMenuOpen}
                aria-haspopup="listbox"
              >
                <MapPin className="h-3.5 w-3.5 text-dumline-crimson" />
                <span>{selectedOutlet ? selectedOutlet.name : 'Select Outlet'}</span>
                <ChevronDown className="h-3 w-3 text-dumline-charcoal/60" />
              </button>

              {outletMenuOpen && (
                <div
                  className="absolute left-0 mt-2 w-72 rounded-2xl border border-dumline-sand-dark bg-dumline-ivory p-2 shadow-xl ring-1 ring-black/5 z-50"
                  role="listbox"
                >
                  <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-dumline-charcoal/50">
                    Select Kitchen Outlet
                  </div>
                  {outlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={() => {
                        handleSelectOutlet(outlet);
                        setOutletMenuOpen(false);
                      }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs transition-colors flex flex-col gap-0.5 ${
                        selectedOutlet?.id === outlet.id
                          ? 'bg-dumline-crimson text-white font-medium'
                          : 'text-dumline-charcoal hover:bg-dumline-sand'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{outlet.name}</span>
                        <span className="text-[10px] opacity-80">{outlet.minPrepMinutes}m min prep</span>
                      </div>
                      <span className={`text-[11px] ${selectedOutlet?.id === outlet.id ? 'text-white/80' : 'text-dumline-charcoal/60'}`}>
                        {outlet.address} • {outlet.deliveryRadiusKm}km delivery radius
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kitchen Staff & Manager: Assigned Outlet Pill */}
          {(isKitchenStaff || isOutletManager) && (
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-dumline-saffron/40 bg-dumline-saffron/10 px-3 py-1 text-xs font-bold text-dumline-saffron-dark">
              <MapPin className="h-3.5 w-3.5 text-dumline-crimson" />
              <span>{assignedOutlet?.name || 'Assigned Kitchen'}</span>
            </div>
          )}
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold tracking-wide text-dumline-charcoal/90">
          {/* CUSTOMER & GUEST NAVIGATION */}
          {!isOperationalStaff && (
            <>
              <Link
                href="/menu"
                className={`hover:text-dumline-crimson transition-colors ${
                  pathname === '/menu' ? 'text-dumline-crimson border-b-2 border-dumline-crimson pb-0.5' : ''
                }`}
              >
                Menu Catalog
              </Link>
              {isAuthenticated && (
                <Link
                  href="/orders"
                  className={`hover:text-dumline-crimson transition-colors flex items-center gap-1.5 ${
                    pathname?.startsWith('/orders') ? 'text-dumline-crimson border-b-2 border-dumline-crimson pb-0.5' : ''
                  }`}
                >
                  <Receipt className="h-4 w-4" />
                  <span>My Orders</span>
                </Link>
              )}
              <Link
                href="/#heritage"
                className="hover:text-dumline-crimson transition-colors"
              >
                Dum Cooking Story
              </Link>
              <Link
                href="/#outlets"
                className="hover:text-dumline-crimson transition-colors"
              >
                Hyderabad Outlets
              </Link>
            </>
          )}

          {/* KITCHEN STAFF NAVIGATION */}
          {isKitchenStaff && (
            <>
              <Link
                href="/kds"
                className="flex items-center gap-2 rounded-xl bg-dumline-crimson px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-dumline-crimson-dark transition-all"
              >
                <ChefHat className="h-4 w-4" />
                <span>Kitchen Display System (KDS)</span>
              </Link>
              <Link
                href="/"
                className="hover:text-dumline-crimson text-xs font-semibold text-dumline-charcoal/70 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Storefront View</span>
              </Link>
            </>
          )}

          {/* OUTLET MANAGER NAVIGATION */}
          {isOutletManager && (
            <>
              <Link
                href="/manager"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  pathname === '/manager'
                    ? 'bg-dumline-crimson text-white shadow-sm'
                    : 'text-dumline-charcoal bg-dumline-sand/50 hover:bg-dumline-sand'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4 text-dumline-saffron-dark" />
                <span>Outlet Operations</span>
              </Link>
              <Link
                href="/kds"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-dumline-charcoal bg-dumline-sand/50 hover:bg-dumline-sand transition-all"
              >
                <ChefHat className="h-4 w-4 text-dumline-crimson" />
                <span>Kitchen Display (KDS)</span>
              </Link>
              <Link
                href="/"
                className="hover:text-dumline-crimson text-xs font-semibold text-dumline-charcoal/70 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Storefront View</span>
              </Link>
            </>
          )}

          {/* CENTRAL ADMIN NAVIGATION */}
          {isAdmin && (
            <>
              <Link
                href="/kds"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  pathname === '/kds'
                    ? 'bg-dumline-crimson text-white shadow-sm'
                    : 'text-dumline-charcoal bg-dumline-sand/50 hover:bg-dumline-sand'
                }`}
              >
                <ChefHat className="h-4 w-4 text-dumline-crimson" />
                <span>All Kitchens</span>
              </Link>
              <Link
                href="/admin"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  pathname === '/admin'
                    ? 'bg-dumline-crimson text-white shadow-sm'
                    : 'text-dumline-charcoal bg-dumline-sand/50 hover:bg-dumline-sand'
                }`}
              >
                <ShieldAlert className="h-4 w-4 text-dumline-sage" />
                <span>Central Menu Admin</span>
              </Link>
              <Link
                href="/manager"
                className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-dumline-charcoal bg-dumline-sand/50 hover:bg-dumline-sand transition-all"
              >
                <SlidersHorizontal className="h-4 w-4 text-dumline-saffron-dark" />
                <span>Outlet Operations</span>
              </Link>
              <Link
                href="/"
                className="hover:text-dumline-crimson text-xs font-semibold text-dumline-charcoal/70 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Storefront View</span>
              </Link>
            </>
          )}
        </nav>

        {/* Right Actions: Cart (Customers only) & Auth / Profile */}
        <div className="flex items-center gap-3">
          {/* Cart Button: Rendered strictly for Customers / Guests */}
          {!isOperationalStaff && (
            <button
              type="button"
              onClick={toggleCart}
              className="relative flex items-center gap-2 rounded-full border border-dumline-crimson bg-dumline-crimson px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-dumline-crimson-dark transition-all focus:outline-none focus:ring-2 focus:ring-dumline-crimson focus:ring-offset-2"
              aria-label={`View Cart, ${itemCount} items`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-dumline-crimson">
                {itemCount}
              </span>
            </button>
          )}

          {/* User Auth Menu or Direct Staff Profile */}
          {isAuthenticated ? (
            isOperationalStaff ? (
              /* Operational Staff Profile & Direct Sign Out */
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-dumline-charcoal">{user?.fullName}</div>
                  <div className="text-[10px] text-dumline-saffron-dark font-bold uppercase tracking-wider">
                    {role?.replace('_', ' ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 rounded-full border border-dumline-sand-dark bg-white px-3 py-1.5 text-xs font-bold text-dumline-crimson hover:bg-dumline-crimson/10 shadow-sm transition-all"
                  title="Sign Out of Portal"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              /* Customer Profile Dropdown */
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-dumline-sand-dark bg-dumline-sand/50 p-2 text-xs font-semibold text-dumline-charcoal hover:bg-dumline-sand transition-all"
                  aria-label="User Account Menu"
                >
                  <User className="h-4 w-4 text-dumline-charcoal" />
                  <span className="hidden md:inline max-w-[120px] truncate">{user?.fullName || 'My Account'}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-dumline-sand-dark bg-dumline-ivory p-2 shadow-xl z-50">
                    <div className="px-3 py-2 border-b border-dumline-sand">
                      <p className="text-xs font-bold text-dumline-charcoal">{user?.fullName}</p>
                      <p className="text-[11px] text-dumline-charcoal/60 truncate">{user?.email}</p>
                      <span className="mt-1 inline-block rounded bg-dumline-saffron/20 px-1.5 py-0.5 text-[9px] font-bold text-dumline-saffron-dark">
                        CUSTOMER
                      </span>
                    </div>
                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-dumline-charcoal hover:bg-dumline-sand transition-colors"
                    >
                      <Receipt className="h-3.5 w-3.5 text-dumline-crimson" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-dumline-charcoal hover:bg-dumline-sand transition-colors"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-dumline-saffron-dark" />
                      <span>Active Checkout</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-dumline-crimson hover:bg-dumline-crimson/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full border border-dumline-sand-dark bg-transparent px-4 py-2 text-xs font-bold text-dumline-charcoal hover:bg-dumline-sand transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="rounded-lg p-2 text-dumline-charcoal lg:hidden hover:bg-dumline-sand"
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div className="border-t border-dumline-sand bg-dumline-ivory px-4 pt-3 pb-6 lg:hidden">
          {/* Customer / Guest / Admin: Mobile Outlet Selector */}
          {(!isKitchenStaff && !isOutletManager) && (
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase text-dumline-charcoal/50">Active Kitchen Outlet</span>
              <select
                value={selectedOutlet?.id || ''}
                onChange={(e) => {
                  const found = outlets.find((o) => o.id === e.target.value);
                  if (found) handleSelectOutlet(found);
                }}
                className="mt-1 block w-full rounded-xl border border-dumline-sand-dark bg-white px-3 py-2 text-xs font-semibold text-dumline-charcoal"
              >
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.deliveryRadiusKm}km)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mobile Role Navigation */}
          <div className="flex flex-col gap-3 font-semibold text-sm">
            {/* Customer / Guest Mobile Links */}
            {!isOperationalStaff && (
              <>
                <Link
                  href="/menu"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg py-1.5 text-dumline-charcoal hover:text-dumline-crimson"
                >
                  Menu Catalog
                </Link>
                {isAuthenticated && (
                  <Link
                    href="/orders"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-2 rounded-lg py-1.5 text-dumline-crimson font-bold"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>My Orders</span>
                  </Link>
                )}
                <Link
                  href="/#heritage"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg py-1.5 text-dumline-charcoal hover:text-dumline-crimson"
                >
                  The Art of Dum Cooking
                </Link>
                <Link
                  href="/#outlets"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg py-1.5 text-dumline-charcoal hover:text-dumline-crimson"
                >
                  Hyderabad Locations
                </Link>
              </>
            )}

            {/* Kitchen Staff Mobile Links */}
            {isKitchenStaff && (
              <>
                <div className="text-[11px] font-bold uppercase text-dumline-saffron-dark">
                  Staff: {assignedOutlet?.name}
                </div>
                <Link
                  href="/kds"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-dumline-crimson p-3 text-white font-bold"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>Kitchen Display System (KDS)</span>
                </Link>
                <Link
                  href="/"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-lg py-1.5 text-dumline-charcoal"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Storefront View</span>
                </Link>
              </>
            )}

            {/* Manager Mobile Links */}
            {isOutletManager && (
              <>
                <div className="text-[11px] font-bold uppercase text-dumline-saffron-dark">
                  Manager: {assignedOutlet?.name}
                </div>
                <Link
                  href="/manager"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-dumline-crimson p-3 text-white font-bold"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Outlet Operations Dashboard</span>
                </Link>
                <Link
                  href="/kds"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-lg py-1.5 text-dumline-charcoal"
                >
                  <ChefHat className="h-4 w-4 text-dumline-crimson" />
                  <span>Kitchen Display (KDS)</span>
                </Link>
                <Link
                  href="/"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-lg py-1.5 text-dumline-charcoal"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Storefront View</span>
                </Link>
              </>
            )}

            {/* Admin Mobile Links */}
            {isAdmin && (
              <>
                <div className="text-[11px] font-bold uppercase text-dumline-saffron-dark">
                  Central Administrator
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-xl bg-dumline-crimson p-3 text-white font-bold"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Central Menu Admin</span>
                </Link>
                <Link
                  href="/kds"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-lg py-1.5 text-dumline-crimson font-bold"
                >
                  <ChefHat className="h-4 w-4" />
                  <span>All Kitchens (Central KDS)</span>
                </Link>
                <Link
                  href="/manager"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-lg py-1.5 text-dumline-charcoal"
                >
                  <SlidersHorizontal className="h-4 w-4 text-dumline-saffron-dark" />
                  <span>Outlet Manager</span>
                </Link>
                <Link
                  href="/"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex items-center gap-2 rounded-lg py-1.5 text-dumline-charcoal"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Storefront View</span>
                </Link>
              </>
            )}

            {/* Mobile Auth actions */}
            <hr className="border-dumline-sand my-2" />
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileNavOpen(false);
                }}
                className="flex items-center gap-2 rounded-lg py-2 text-xs font-bold text-dumline-crimson"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out ({user?.fullName})</span>
              </button>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center justify-center rounded-xl bg-dumline-crimson py-2.5 text-xs font-bold text-white shadow"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
