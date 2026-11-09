'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useOutletStore } from '../../store/outletStore';
import ApiClient from '../../lib/api';
import { formatINR } from '../../lib/utils';
import { MOCK_PAYMENT_PRESETS } from '../../lib/constants';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function CheckoutForm() {
  const router = useRouter();
  const {
    items,
    boundOutletId,
    boundOutletName,
    fulfillmentType,
    setFulfillmentType,
    deliveryAddress,
    setDeliveryAddress,
    getSubtotal,
    getBaseAmount,
    getGstAmount,
    getDeliveryFee,
    getTotalAmount,
    clearCart,
  } = useCartStore();

  const { user, token, isAuthenticated, setAuth } = useAuthStore();
  const { selectedOutlet, outlets } = useOutletStore();

  // Inline auth state for unauthenticated users
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false); // Unchecked by default per AGENTS.md rule!
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD'>('UPI');
  const [upiVpa, setUpiVpa] = useState<string>(MOCK_PAYMENT_PRESETS.upiSuccess);
  const [cardLast4, setCardLast4] = useState<string>(MOCK_PAYMENT_PRESETS.cardSuccess);

  // Address form
  const [addressLine1, setAddressLine1] = useState(deliveryAddress.line1 || 'Road No. 36, Jubilee Hills');
  const [addressLine2, setAddressLine2] = useState(deliveryAddress.line2 || 'Near Metro Pillar 24');
  const [distanceKm, setDistanceKm] = useState(deliveryAddress.distanceKm || 3.5);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const baseAmount = getBaseAmount();
  const gstAmount = getGstAmount();
  const deliveryFee = getDeliveryFee();
  const total = getTotalAmount();

  const activeOutlet =
    outlets.find((o) => o.id === boundOutletId) ||
    selectedOutlet ||
    outlets[0];

  // Inline Auth Handler
  const handleInlineAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      if (authMode === 'LOGIN') {
        const res = await ApiClient.login({
          emailOrPhone: authEmailOrPhone,
          password: authPassword,
        });
        setAuth(res.token, res.user);
      } else {
        const res = await ApiClient.register({
          email: authEmailOrPhone,
          phone: authPhone,
          password: authPassword,
          fullName: authFullName,
          marketingConsent,
        });
        setAuth(res.token, res.user);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Order Submission Handler
  const handlePlaceOrder = async () => {
    if (!token) {
      setOrderError('Customer authentication is mandatory prior to placing an order.');
      return;
    }

    if (items.length === 0) {
      setOrderError('Your cart is empty.');
      return;
    }

    if (!activeOutlet) {
      setOrderError('No active outlet found.');
      return;
    }

    // Validate delivery radius
    if (fulfillmentType === 'DELIVERY') {
      if (!addressLine1.trim()) {
        setOrderError('Delivery address line 1 is required.');
        return;
      }
      if (distanceKm > activeOutlet.deliveryRadiusKm) {
        setOrderError(
          `Delivery address (${distanceKm} km) exceeds ${activeOutlet.name}'s service radius of ${activeOutlet.deliveryRadiusKm} km.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      const idempotencyKey = `idemp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // 1. Submit Order to Backend
      const order = await ApiClient.createOrder(
        {
          outletId: activeOutlet.id,
          fulfillmentType,
          items: items.map((i) => ({
            itemId: i.itemId,
            itemName: i.itemName,
            quantity: i.quantity,
            selectedOptions: i.selectedOptions,
          })),
          deliveryAddress:
            fulfillmentType === 'DELIVERY'
              ? {
                  line1: addressLine1,
                  line2: addressLine2,
                  city: 'Hyderabad',
                  distanceKm,
                }
              : undefined,
          paymentMethod,
          idempotencyKey,
        },
        token
      );

      // 2. Process Simulated Mock Payment
      const paymentResult = await ApiClient.processPayment(
        {
          orderId: order.id,
          method: paymentMethod,
          vpa: paymentMethod === 'UPI' ? upiVpa : undefined,
          cardLast4: paymentMethod === 'CARD' ? cardLast4 : undefined,
          idempotencyKey: `pay-${idempotencyKey}`,
        },
        token
      );

      if (paymentResult.status === 'PAID') {
        // Clear active cart upon successful payment
        clearCart();
        // Redirect to real-time order tracking
        router.push(`/orders/${order.id}?new=true`);
      } else {
        // Payment failed - keep order in place for retry
        setOrderError(
          `Payment simulation failed (${paymentResult.failureReason || 'DECLINED'}). Please check test triggers and retry.`
        );
      }
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold text-dumline-charcoal">Your cart is empty</h2>
        <p className="text-xs text-dumline-charcoal/70">
          Please add dishes from our menu before proceeding to checkout.
        </p>
        <Link
          href="/menu"
          className="inline-block rounded-full bg-dumline-crimson px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-dumline-crimson-dark"
        >
          Explore Royal Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-dumline-saffron-dark">
          Finalize Your Order
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal mt-1">
          Royal Checkout & Dispatch
        </h1>
        <p className="text-xs text-dumline-charcoal/60 mt-1">
          Single-outlet kitchen: <strong className="text-dumline-charcoal">{activeOutlet?.name}</strong> • Prices inclusive of 5% restaurant GST.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Steps */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Customer Authentication Check */}
          <div className="rounded-3xl border border-dumline-sand bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-dumline-sand pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dumline-crimson text-white text-xs font-bold">
                  1
                </span>
                <h3 className="font-serif text-lg font-bold text-dumline-charcoal">Customer Authentication</h3>
              </div>
              {isAuthenticated && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Authenticated</span>
                </span>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center justify-between text-xs text-dumline-charcoal/80 bg-dumline-sand/30 p-3 rounded-xl">
                <div>
                  <strong className="block text-dumline-charcoal">{user?.fullName}</strong>
                  <span>{user?.email} • {user?.phone}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-dumline-saffron-dark bg-white px-2 py-0.5 rounded border border-dumline-sand">
                  {user?.role}
                </span>
              </div>
            ) : (
              <form onSubmit={handleInlineAuth} className="space-y-3">
                <div className="flex items-center gap-3 border-b border-dumline-sand pb-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setAuthMode('LOGIN')}
                    className={`text-xs font-bold pb-1 ${
                      authMode === 'LOGIN'
                        ? 'text-dumline-crimson border-b-2 border-dumline-crimson'
                        : 'text-dumline-charcoal/60'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('REGISTER')}
                    className={`text-xs font-bold pb-1 ${
                      authMode === 'REGISTER'
                        ? 'text-dumline-crimson border-b-2 border-dumline-crimson'
                        : 'text-dumline-charcoal/60'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {authMode === 'REGISTER' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={authFullName}
                        onChange={(e) => setAuthFullName(e.target.value)}
                        placeholder="e.g. Asif Khan"
                        className="w-full rounded-xl border border-dumline-sand-dark px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">Phone (+91)</label>
                      <input
                        type="tel"
                        required
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="+919876543210"
                        className="w-full rounded-xl border border-dumline-sand-dark px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">
                    {authMode === 'LOGIN' ? 'Email or Phone' : 'Email Address'}
                  </label>
                  <input
                    type="text"
                    required
                    value={authEmailOrPhone}
                    onChange={(e) => setAuthEmailOrPhone(e.target.value)}
                    placeholder="demo.customer@example.com"
                    className="w-full rounded-xl border border-dumline-sand-dark px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-dumline-sand-dark px-3 py-2 text-xs"
                  />
                </div>

                {authMode === 'REGISTER' && (
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="marketingConsent"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 rounded border-dumline-sand text-dumline-crimson focus:ring-dumline-crimson"
                    />
                    <label htmlFor="marketingConsent" className="text-[11px] text-dumline-charcoal/70 leading-snug">
                      I opt-in to receive promotional updates and royal festival specials from Dumline. (Optional)
                    </label>
                  </div>
                )}

                {authError && (
                  <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg font-medium">{authError}</p>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full rounded-xl bg-dumline-charcoal text-white py-2.5 text-xs font-bold hover:bg-black transition-colors"
                >
                  {isAuthLoading ? 'Authenticating...' : authMode === 'LOGIN' ? 'Sign In & Continue' : 'Create Account & Continue'}
                </button>
              </form>
            )}
          </div>

          {/* Step 2: Fulfillment & Demo Delivery Radius Validation */}
          <div className="rounded-3xl border border-dumline-sand bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-dumline-sand pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dumline-crimson text-white text-xs font-bold">
                2
              </span>
              <h3 className="font-serif text-lg font-bold text-dumline-charcoal">Fulfillment Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  fulfillmentType === 'DELIVERY'
                    ? 'border-dumline-crimson bg-dumline-crimson/5 ring-1 ring-dumline-crimson'
                    : 'border-dumline-sand hover:bg-dumline-sand/30'
                }`}
              >
                <span className="text-xs font-bold text-dumline-charcoal">Simulated Direct Delivery</span>
                <span className="text-[11px] text-dumline-charcoal/60 mt-1">Dispatched from {activeOutlet?.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('PICKUP')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  fulfillmentType === 'PICKUP'
                    ? 'border-dumline-crimson bg-dumline-crimson/5 ring-1 ring-dumline-crimson'
                    : 'border-dumline-sand hover:bg-dumline-sand/30'
                }`}
              >
                <span className="text-xs font-bold text-dumline-charcoal">Kitchen Takeaway / Pickup</span>
                <span className="text-[11px] text-green-700 font-semibold mt-1">Free • No Delivery Fee</span>
              </button>
            </div>

            {fulfillmentType === 'DELIVERY' ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">
                    Demo Delivery Address (Street / Flat / Colony)
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => {
                      setAddressLine1(e.target.value);
                      setDeliveryAddress({ line1: e.target.value });
                    }}
                    placeholder="Road No 36, Jubilee Hills"
                    className="w-full rounded-xl border border-dumline-sand-dark px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => {
                        setAddressLine2(e.target.value);
                        setDeliveryAddress({ line2: e.target.value });
                      }}
                      placeholder="Near Metro Station"
                      className="w-full rounded-xl border border-dumline-sand-dark px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">
                      Simulated Distance ({distanceKm} km)
                    </label>
                    <input
                      type="range"
                      min="1.0"
                      max="12.0"
                      step="0.5"
                      value={distanceKm}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setDistanceKm(val);
                        setDeliveryAddress({ distanceKm: val });
                      }}
                      className="w-full accent-dumline-crimson"
                    />
                    <div className="flex justify-between text-[10px] text-dumline-charcoal/50">
                      <span>1 km</span>
                      <span>Radius limit: {activeOutlet?.deliveryRadiusKm} km</span>
                      <span>12 km</span>
                    </div>
                  </div>
                </div>

                {distanceKm > (activeOutlet?.deliveryRadiusKm ?? 7.0) && (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Distance ({distanceKm} km) exceeds {activeOutlet?.name}&apos;s delivery radius ({activeOutlet?.deliveryRadiusKm} km).</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-dumline-sand/30 rounded-xl text-xs space-y-1">
                <p className="font-bold text-dumline-charcoal">Pickup Counter Location:</p>
                <p className="text-dumline-charcoal/80">{activeOutlet?.name} — {activeOutlet?.address}</p>
                <p className="text-[11px] text-dumline-saffron-dark font-medium">Staged for collection upon kitchen notification.</p>
              </div>
            )}
          </div>

          {/* Step 3: Server-Side Mock Payment Selection */}
          <div className="rounded-3xl border border-dumline-sand bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-dumline-sand pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dumline-crimson text-white text-xs font-bold">
                3
              </span>
              <h3 className="font-serif text-lg font-bold text-dumline-charcoal">Mock Payment Processing</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-dumline-crimson bg-dumline-crimson/5 ring-1 ring-dumline-crimson'
                    : 'border-dumline-sand hover:bg-dumline-sand/30'
                }`}
              >
                <Smartphone className="h-5 w-5 text-dumline-crimson" />
                <div>
                  <span className="text-xs font-bold text-dumline-charcoal block">Instant UPI VPA</span>
                  <span className="text-[10px] text-dumline-charcoal/60">Simulated VPA transfer</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-dumline-crimson bg-dumline-crimson/5 ring-1 ring-dumline-crimson'
                    : 'border-dumline-sand hover:bg-dumline-sand/30'
                }`}
              >
                <CreditCard className="h-5 w-5 text-dumline-crimson" />
                <div>
                  <span className="text-xs font-bold text-dumline-charcoal block">Debit / Credit Card</span>
                  <span className="text-[10px] text-dumline-charcoal/60">Simulated Card gateway</span>
                </div>
              </button>
            </div>

            {/* Test Trigger Helper Pills */}
            <div className="bg-dumline-sand/40 p-4 rounded-2xl space-y-2.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-dumline-charcoal/70 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-dumline-saffron-dark" />
                <span>Assessment Mock Payment Test Triggers:</span>
              </span>

              {paymentMethod === 'UPI' ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUpiVpa(MOCK_PAYMENT_PRESETS.upiSuccess)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        upiVpa === MOCK_PAYMENT_PRESETS.upiSuccess
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-dumline-sand bg-white text-dumline-charcoal'
                      }`}
                    >
                      ✓ success@upi (PAID)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiVpa(MOCK_PAYMENT_PRESETS.upiFail)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        upiVpa === MOCK_PAYMENT_PRESETS.upiFail
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-dumline-sand bg-white text-dumline-charcoal'
                      }`}
                    >
                      ✕ fail@upi (INSUFFICIENT_FUNDS)
                    </button>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">Selected VPA</label>
                    <input
                      type="text"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      className="w-full rounded-xl border border-dumline-sand-dark px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCardLast4(MOCK_PAYMENT_PRESETS.cardSuccess)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        cardLast4 === MOCK_PAYMENT_PRESETS.cardSuccess
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-dumline-sand bg-white text-dumline-charcoal'
                      }`}
                    >
                      ✓ Ending 4242 (PAID)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardLast4(MOCK_PAYMENT_PRESETS.cardFail)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        cardLast4 === MOCK_PAYMENT_PRESETS.cardFail
                          ? 'border-red-600 bg-red-50 text-red-700'
                          : 'border-dumline-sand bg-white text-dumline-charcoal'
                      }`}
                    >
                      ✕ Ending 0002 (BANK_TIMEOUT)
                    </button>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-dumline-charcoal block mb-1">Card Last 4 Digits</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value)}
                      className="w-full rounded-xl border border-dumline-sand-dark px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-dumline-sand bg-white p-6 shadow-xl sticky top-24 space-y-4">
            <h3 className="font-serif text-xl font-bold text-dumline-charcoal border-b border-dumline-sand pb-3">
              Order Summary ({items.length} items)
            </h3>

            {/* Items list */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.itemId} className="flex justify-between items-center text-xs">
                  <span className="text-dumline-charcoal font-medium truncate max-w-[200px]">
                    {item.quantity}× {item.itemName}
                  </span>
                  <span className="font-bold text-dumline-charcoal">{formatINR(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Calculation Breakdown */}
            <div className="border-t border-dumline-sand pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-dumline-charcoal/80">
                <span>Items Subtotal (GST Inclusive)</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-dumline-charcoal/60 pl-2">
                <span>• Base Net Amount</span>
                <span>{formatINR(baseAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-dumline-charcoal/60 pl-2">
                <span>• 5% Restaurant GST Breakdown</span>
                <span>{formatINR(gstAmount)}</span>
              </div>
              <div className="flex justify-between text-dumline-charcoal/80">
                <span>Fulfillment ({fulfillmentType})</span>
                <span className="font-semibold">
                  {deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : formatINR(deliveryFee)}
                </span>
              </div>
              <div className="border-t border-dumline-sand pt-2.5 flex justify-between text-base font-bold text-dumline-charcoal">
                <span>Total Payable</span>
                <span className="font-black text-dumline-crimson text-xl">{formatINR(total)}</span>
              </div>
            </div>

            {/* Error banner */}
            {orderError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {orderError}
              </div>
            )}

            {/* Place Order CTA */}
            <button
              type="button"
              disabled={isSubmitting || !isAuthenticated}
              onClick={handlePlaceOrder}
              className={`w-full rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                isSubmitting || !isAuthenticated
                  ? 'bg-dumline-charcoal/50 cursor-not-allowed'
                  : 'bg-dumline-crimson hover:bg-dumline-crimson-dark'
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Processing Order & Payment...'
                  : !isAuthenticated
                  ? 'Sign In Above to Place Order'
                  : `Pay ${formatINR(total)} & Dispatch`}
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-dumline-charcoal/50 pt-2 text-center">
              <ShieldCheck className="h-4 w-4 text-dumline-sage shrink-0" />
              <span>Idempotent submission key protects against duplicate billing.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

