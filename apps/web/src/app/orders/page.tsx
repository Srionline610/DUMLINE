'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import ApiClient from '../../lib/api';
import { OrderDetail, OrderStatus } from '@dumline/shared';
import { formatINR, formatTime, formatDateTime, parseCustomizations } from '../../lib/utils';
import {
  ShoppingBag,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Flame,
  ChefHat,
  PackageCheck,
  UserCheck,
  XCircle,
  Receipt,
  Sparkles,
} from 'lucide-react';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const fetchOrders = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getOrders(token);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-dumline-sand/20 px-4 py-16">
        <div className="max-w-md w-full rounded-3xl border border-dumline-sand-dark bg-white p-8 text-center shadow-lg space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dumline-sand text-dumline-crimson">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-dumline-charcoal">Sign In to View Your Orders</h1>
            <p className="text-xs text-dumline-charcoal/70 mt-1">
              Please sign in with your customer account to access your active and previous Nizami orders.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth/login?redirect=/orders"
              className="w-full rounded-full bg-dumline-crimson py-3 text-xs font-bold text-white shadow hover:bg-dumline-crimson-dark transition-all text-center"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/menu"
              className="w-full rounded-full border border-dumline-sand-dark bg-transparent py-2.5 text-xs font-bold text-dumline-charcoal hover:bg-dumline-sand transition-all text-center"
            >
              Browse Royal Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') {
      return ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status);
    }
    if (filter === 'COMPLETED') {
      return o.status === 'COMPLETED';
    }
    if (filter === 'CANCELLED') {
      return o.status === 'CANCELLED';
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return {
          label: 'Order Placed',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="h-3 w-3" />,
        };
      case 'ACCEPTED':
        return {
          label: 'Accepted by Kitchen',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <ChefHat className="h-3 w-3" />,
        };
      case 'PREPARING':
        return {
          label: 'Slow Dum Steaming',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Flame className="h-3 w-3" />,
        };
      case 'READY':
        return {
          label: 'Ready for Collection',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <PackageCheck className="h-3 w-3" />,
        };
      case 'COMPLETED':
        return {
          label: 'Fulfilled & Delivered',
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
          icon: <CheckCircle2 className="h-3 w-3" />,
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="h-3 w-3" />,
        };
      default:
        return {
          label: status,
          bg: 'bg-zinc-50 text-zinc-600 border-zinc-200',
          icon: <Clock className="h-3 w-3" />,
        };
    }
  };

  return (
    <div className="min-h-screen bg-dumline-sand/20 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-dumline-sand pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-dumline-saffron-dark">
              Order History & Tracking
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal mt-1">
              My Royal Orders
            </h1>
            <p className="text-xs text-dumline-charcoal/70 mt-1">
              Account: <strong className="text-dumline-charcoal">{user?.fullName || user?.email}</strong> • Persistent order journal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 rounded-full border border-dumline-sand-dark bg-white px-4 py-2 text-xs font-bold text-dumline-charcoal hover:bg-dumline-sand shadow-sm transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-dumline-crimson ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-full bg-dumline-crimson px-5 py-2 text-xs font-bold text-white hover:bg-dumline-crimson-dark shadow transition-all"
            >
              <span>Order More</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-dumline-sand pb-3 overflow-x-auto">
          {[
            { key: 'ALL', label: `All Orders (${orders.length})` },
            {
              key: 'ACTIVE',
              label: `Active (${orders.filter((o) => ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)).length})`,
            },
            {
              key: 'COMPLETED',
              label: `Completed (${orders.filter((o) => o.status === 'COMPLETED').length})`,
            },
            {
              key: 'CANCELLED',
              label: `Cancelled (${orders.filter((o) => o.status === 'CANCELLED').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as any)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-dumline-charcoal text-white shadow-sm'
                  : 'bg-white text-dumline-charcoal/70 hover:bg-dumline-sand border border-dumline-sand-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List Body */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="mx-auto h-10 w-10 border-4 border-dumline-crimson border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-dumline-charcoal/60">Fetching your order history from database...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
            <h3 className="font-bold text-red-900">Failed to Load Orders</h3>
            <p className="text-xs text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchOrders}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-dumline-sand-dark bg-white/60 p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-dumline-sand text-dumline-charcoal/40">
              <Receipt className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-bold text-dumline-charcoal">No Orders Found</h3>
              <p className="text-xs text-dumline-charcoal/70 max-w-sm mx-auto mt-1">
                {filter === 'ALL'
                  ? 'You have not placed any orders yet. Indulge in our slow-steamed royal biryanis crafted with authentic Nizam recipes.'
                  : `No orders found under the "${filter.toLowerCase()}" filter.`}
              </p>
            </div>
            <Link
              href="/menu"
              className="inline-block rounded-full bg-dumline-crimson px-6 py-2.5 text-xs font-bold text-white hover:bg-dumline-crimson-dark shadow transition-all"
            >
              Explore Royal Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const isLive = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status);

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-dumline-sand-dark bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="p-5 sm:p-6 border-b border-dumline-sand flex flex-wrap items-center justify-between gap-4 bg-dumline-ivory/50">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-xl sm:text-2xl font-bold text-dumline-charcoal">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                        {isLive && (
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-dumline-charcoal/70">
                        <span className="flex items-center gap-1 font-semibold text-dumline-charcoal">
                          <MapPin className="h-3.5 w-3.5 text-dumline-crimson" />
                          <span>{order.outletName || 'Hyderabad Kitchen'}</span>
                        </span>
                        <span>•</span>
                        <span>Placed on {formatDateTime(order.placedAt)}</span>
                        <span>•</span>
                        <span className="uppercase font-semibold px-2 py-0.5 rounded bg-dumline-sand text-[10px]">
                          {order.fulfillmentType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                          isLive
                            ? 'bg-dumline-crimson text-white hover:bg-dumline-crimson-dark'
                            : 'bg-dumline-sand text-dumline-charcoal hover:bg-dumline-sand-dark'
                        }`}
                      >
                        <span>{isLive ? 'Live Track Status' : 'View Order Details'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Card Items Details */}
                  <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Items List (col 7) */}
                    <div className="md:col-span-7 space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-dumline-charcoal/60">
                        Dishes Ordered ({order.items.reduce((s, i) => s + i.quantity, 0)})
                      </span>
                      <div className="divide-y divide-dumline-sand/60">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-dumline-sand text-dumline-charcoal text-xs font-bold">
                                {item.quantity}×
                              </span>
                              <div>
                                <p className="text-xs sm:text-sm font-bold text-dumline-charcoal">
                                  {item.itemName}
                                </p>
                                {item.selectedOptionsJson && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    {parseCustomizations(item.selectedOptionsJson).map((opt, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center rounded-md bg-dumline-sand/60 px-2 py-0.5 text-[10px] font-semibold text-dumline-charcoal"
                                      >
                                        <span className="text-dumline-saffron-dark mr-1">{opt.label}:</span>
                                        <span>{opt.value}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-dumline-charcoal whitespace-nowrap">
                              {formatINR(item.lineTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Summary & Delivery Info (col 5) */}
                    <div className="md:col-span-5 rounded-2xl bg-dumline-sand/30 p-4 space-y-3 border border-dumline-sand">
                      <div className="space-y-1.5 text-xs text-dumline-charcoal/80">
                        <div className="flex justify-between">
                          <span>Subtotal (Net Base)</span>
                          <span>{formatINR(order.subtotal - order.gstAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>5% Restaurant GST (Included)</span>
                          <span>{formatINR(order.gstAmount)}</span>
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="flex justify-between">
                            <span>Delivery Fee</span>
                            <span>{formatINR(order.deliveryFee)}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-dumline-sand flex justify-between font-serif text-base font-bold text-dumline-charcoal">
                          <span>Grand Total</span>
                          <span className="text-dumline-crimson">{formatINR(order.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Payment Badge */}
                      <div className="pt-2 border-t border-dumline-sand text-[11px] text-dumline-charcoal/70 flex items-center justify-between">
                        <span>Payment Status</span>
                        {order.payments && order.payments.length > 0 ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {order.payments[0].method} • PAID
                          </span>
                        ) : (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            PENDING
                          </span>
                        )}
                      </div>

                      {/* Promised Time */}
                      <div className="text-[11px] text-dumline-charcoal/70 flex items-center justify-between">
                        <span>Promised Time</span>
                        <span className="font-bold text-dumline-charcoal">
                          {formatTime(order.promisedTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

