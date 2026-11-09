'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import ApiClient from '../../lib/api';
import { getSocket, subscribeToOrder } from '../../lib/socket';
import { OrderDetail } from '@dumline/shared';
import { formatINR, formatTime, formatDateTime, parseCustomizations } from '../../lib/utils';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChefHat,
  Package,
  Bike,
  Sparkles,
  Info,
  ArrowLeft,
} from 'lucide-react';

interface LiveOrderTrackerProps {
  initialOrderId: string;
}

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Payment verified & submitted' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Acknowledged by kitchen staff' },
  { key: 'PREPARING', label: 'Dum Steaming', desc: 'Slow cooking in sealed handi' },
  { key: 'READY', label: 'Ready', desc: 'Packed and staged at counter' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Delivered / Handed over' },
];

export default function LiveOrderTracker({ initialOrderId }: LiveOrderTrackerProps) {
  const { token } = useAuthStore();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isCancelling, setIsCancelling] = useState(false);
  const [isJustConfirmed, setIsJustConfirmed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('new') === 'true') {
        setIsJustConfirmed(true);
      }
    }
  }, []);

  // Interval timer for countdown and overdue calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Order and Subscribe to Socket.IO
  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      if (!token) return;
      setIsLoading(true);
      try {
        const data = await ApiClient.getOrder(initialOrderId, token);
        if (isMounted) {
          setOrder(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to load order details');
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    // Socket.IO real-time subscription
    subscribeToOrder(initialOrderId);
    const socket = getSocket();

    const handleUpdate = (payload: any) => {
      if (!payload || payload.orderId === initialOrderId || payload.id === initialOrderId) {
        // Refresh full order from authoritative API
        if (token) {
          ApiClient.getOrder(initialOrderId, token)
            .then((updated) => isMounted && setOrder(updated))
            .catch(() => {});
        }
      }
    };

    socket.on('order:update', handleUpdate);
    socket.on('order:status-updated', handleUpdate);
    socket.on('order:overdue', handleUpdate);
    socket.on('order:overdue-alert', handleUpdate);
    socket.on('order:prep-time-overridden', handleUpdate);

    return () => {
      isMounted = false;
      socket.off('order:update', handleUpdate);
      socket.off('order:status-updated', handleUpdate);
      socket.off('order:overdue', handleUpdate);
      socket.off('order:overdue-alert', handleUpdate);
      socket.off('order:prep-time-overridden', handleUpdate);
    };
  }, [initialOrderId, token]);

  // Customer Cancel Handler (permitted from PLACED)
  const handleCancelOrder = async () => {
    if (!token || !order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setIsCancelling(true);
    try {
      const updated = await ApiClient.updateOrderStatus(
        order.id,
        'CANCELLED',
        token,
        'Customer requested cancellation from order tracking'
      );
      setOrder(updated);
    } catch (err: any) {
      alert(err.message || 'Could not cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-dumline-crimson border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-bold text-dumline-charcoal">Connecting to Dumline Live Dispatch...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-dumline-crimson mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-dumline-charcoal">Order Not Found</h2>
        <p className="text-xs text-dumline-charcoal/70">{error || 'Unable to locate order'}</p>
        <Link
          href="/menu"
          className="inline-block rounded-full bg-dumline-crimson px-6 py-2.5 text-xs font-bold text-white shadow"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'CANCELLED';

  // Compute live overdue calculation:
  // Elapsed time >= promisedTime + 10 min while not READY or COMPLETED
  const promisedTimeMs = new Date(order.promisedTime).getTime();
  const diffMs = promisedTimeMs - now;
  const isOverdue = now >= promisedTimeMs + 10 * 60 * 1000 && !['READY', 'COMPLETED', 'CANCELLED'].includes(order.status);
  const minutesPastPromised = Math.floor((now - promisedTimeMs) / (60 * 1000));

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-dumline-charcoal hover:text-dumline-crimson transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All My Orders</span>
        </Link>
        <Link
          href="/menu"
          className="text-xs font-bold text-dumline-saffron-dark hover:text-dumline-crimson transition-colors"
        >
          Order More Dishes →
        </Link>
      </div>

      {/* Feature 13: Cinematic Order Confirmation Banner */}
      {isJustConfirmed && (
        <div className="rounded-3xl border-2 border-dumline-saffron/40 bg-gradient-to-r from-dumline-charcoal via-[#2A231E] to-dumline-charcoal p-6 text-white shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 animate-fade-in">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-dumline-crimson flex items-center justify-center text-white shadow-lg">
            <Sparkles className="h-7 w-7 text-dumline-saffron" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-widest text-dumline-saffron block mb-1">
              Royal Order Confirmed & Staged
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">
              Your Feast Has Been Received at {order.outletName}
            </h2>
            <p className="text-xs text-dumline-sand/80 mt-1 leading-relaxed">
              Your mock payment has cleared with transaction reference{' '}
              <strong className="text-dumline-saffron font-mono">{order.payments[0]?.transactionRef || 'TXN-CONFIRMED'}</strong>. Our kitchen staff has received your ticket on the Kitchen Display System.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsJustConfirmed(false)}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-all shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner: Overdue Warning or Live Status */}
      {isOverdue && (
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-5 shadow-md flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-red-900 uppercase tracking-wide">
              Priority Kitchen Alert: Order Overdue by {minutesPastPromised} Minutes
            </h3>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              Your order has exceeded its promised preparation window. Our outlet manager at{' '}
              <strong>{order.outletName}</strong> has been notified on the Kitchen Display System to expedite your handi immediately.
            </p>
          </div>
        </div>
      )}

      {/* Main Order Card */}
      <div className="rounded-3xl border border-dumline-sand bg-white p-6 sm:p-8 shadow-xl space-y-6">
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-dumline-sand gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-dumline-saffron-dark">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live Order Tracking</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-dumline-charcoal mt-1">
              Order #{order.orderNumber}
            </h1>
            <p className="text-xs text-dumline-charcoal/60 mt-0.5">
              Placed at {formatTime(order.placedAt)} • {order.fulfillmentType === 'DELIVERY' ? 'Direct Delivery' : 'Counter Pickup'}
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-[10px] uppercase font-bold text-dumline-charcoal/50">Kitchen Outlet</span>
            <span className="text-sm font-bold text-dumline-charcoal flex items-center gap-1 mt-0.5">
              <MapPin className="h-4 w-4 text-dumline-crimson" />
              <span>{order.outletName}</span>
            </span>
          </div>
        </div>

        {/* Status Stepper */}
        {!isCancelled ? (
          <div className="py-6">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-6 right-6 h-1 bg-dumline-sand -z-0 hidden md:block">
                <div
                  className="h-full bg-dumline-crimson transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStepIndex / (ORDER_STEPS.length - 1)) * 100)}%`,
                  }}
                />
              </div>

              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                {ORDER_STEPS.map((step, idx) => {
                  const isDone = currentStepIndex > idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div
                      key={step.key}
                      className={`flex md:flex-col items-center md:text-center gap-3 md:gap-2 p-2 rounded-xl transition-all ${
                        isCurrent ? 'bg-dumline-sand/40 md:bg-transparent' : ''
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all ${
                          isDone
                            ? 'bg-dumline-crimson text-white shadow'
                            : isCurrent
                            ? 'bg-dumline-charcoal text-white ring-4 ring-dumline-crimson/20 shadow-lg'
                            : 'bg-dumline-sand text-dumline-charcoal/40'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                      </div>
                      <div>
                        <span
                          className={`text-xs font-bold block ${
                            isCurrent
                              ? 'text-dumline-crimson'
                              : isDone
                              ? 'text-dumline-charcoal'
                              : 'text-dumline-charcoal/40'
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[10px] text-dumline-charcoal/60 hidden md:block">
                          {step.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center text-red-800">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-600 mb-2" />
            <h3 className="font-bold text-base">This Order Has Been Cancelled</h3>
            <p className="text-xs mt-1 text-red-700">Food preparation stopped.</p>
          </div>
        )}

        {/* Timings & Preparation Floor Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-dumline-sand/30 border border-dumline-sand">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-dumline-charcoal/50 block">
              Promised Ready Time
            </span>
            <span className="text-lg font-black text-dumline-charcoal">
              {formatTime(order.promisedTime)}
            </span>
            <span className="text-[11px] text-dumline-charcoal/60 block mt-0.5">
              Floor: 20-min minimum slow dum steam
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-dumline-charcoal/50 block">
              Estimated Window
            </span>
            <span className="text-sm font-bold text-dumline-crimson flex items-center gap-1.5 mt-1">
              <Clock className="h-4 w-4" />
              <span>
                {diffMs > 0
                  ? `~${Math.ceil(diffMs / 60000)} mins remaining`
                  : order.status === 'READY' || order.status === 'COMPLETED'
                  ? 'Completed on schedule'
                  : `Overdue by ${minutesPastPromised}m`}
              </span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-dumline-charcoal/50 block">
              Current Status
            </span>
            <span className="inline-block mt-1 rounded-full bg-dumline-charcoal px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              {order.status}
            </span>
          </div>
        </div>

        {/* Items Summary Table */}
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-bold text-dumline-charcoal">Dishes in this Order</h3>
          <div className="divide-y divide-dumline-sand border border-dumline-sand rounded-2xl overflow-hidden">
            {order.items.map((item) => (
              <div key={item.id} className="p-3.5 flex justify-between items-center text-xs bg-white">
                <div>
                  <span className="font-bold text-dumline-charcoal">{item.quantity}× {item.itemName}</span>
                  {item.selectedOptionsJson && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {parseCustomizations(item.selectedOptionsJson).map((opt, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-md bg-dumline-sand/50 px-2 py-0.5 text-[10px] font-semibold text-dumline-charcoal"
                        >
                          <span className="text-dumline-saffron-dark mr-1">{opt.label}:</span>
                          <span>{opt.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-bold text-dumline-charcoal">{formatINR(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          {/* Pricing breakdown */}
          <div className="space-y-1 text-xs pt-2 pl-2">
            <div className="flex justify-between text-dumline-charcoal/80">
              <span>Item Subtotal (GST Inclusive)</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-dumline-charcoal/60">
              <span>• 5% Restaurant GST Breakdown</span>
              <span>{formatINR(order.gstAmount)}</span>
            </div>
            <div className="flex justify-between text-dumline-charcoal/80">
              <span>Fulfillment Fee</span>
              <span>{order.deliveryFee === 0 ? 'FREE' : formatINR(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-dumline-charcoal pt-2 border-t border-dumline-sand">
              <span>Total Paid ({order.payments[0]?.method || 'PREPAID'})</span>
              <span className="text-dumline-crimson font-black">{formatINR(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Cancellation Action (Permitted only from PLACED) */}
        {order.status === 'PLACED' && (
          <div className="pt-4 border-t border-dumline-sand flex justify-end">
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancelOrder}
              className="text-xs font-bold text-red-600 hover:text-red-700 underline"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order (Only available while Placed)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

