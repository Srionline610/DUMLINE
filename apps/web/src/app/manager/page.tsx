'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useOutletStore } from '../../store/outletStore';
import ApiClient from '../../lib/api';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { getSocket, subscribeToOutlet } from '../../lib/socket';
import { KitchenQueueOrder, OutletSummary } from '@dumline/shared';
import { formatINR, formatDateTime, formatTime } from '../../lib/utils';
import {
  ShieldAlert,
  Clock,
  Flame,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Edit3,
  X,
  User,
  MapPin,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function ManagerDashboard() {
  const { user, token, setAuth } = useAuthStore();
  const { outlets, selectedOutlet, setSelectedOutlet, loadOutlets } = useOutletStore();

  const [activeOutletId, setActiveOutletId] = useState<string>('');
  const [orders, setOrders] = useState<KitchenQueueOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Override Modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedOrderForOverride, setSelectedOrderForOverride] = useState<KitchenQueueOrder | null>(null);
  const [newPrepMinutes, setNewPrepMinutes] = useState<number>(30);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  // Initialize outlets
  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  // Set active outlet
  useEffect(() => {
    if (outlets.length > 0 && !activeOutletId) {
      const targetId = user?.assignedOutletId || selectedOutlet?.id || outlets[0].id;
      setActiveOutletId(targetId);
    }
  }, [outlets, user, selectedOutlet, activeOutletId]);

  // Fetch orders
  const fetchOrders = async (outletId: string) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getKitchenQueue(outletId, token);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load outlet operational orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeOutletId && token) {
      fetchOrders(activeOutletId);

      // Subscribe to real-time events for this outlet
      const socket = getSocket();
      subscribeToOutlet(activeOutletId);

      const handleOrderUpdate = () => {
        fetchOrders(activeOutletId);
      };

      socket.on('order:created', handleOrderUpdate);
      socket.on('order:status-updated', handleOrderUpdate);
      socket.on('order:overdue-alert', handleOrderUpdate);
      socket.on('order:prep-time-overridden', handleOrderUpdate);

      return () => {
        socket.off('order:created', handleOrderUpdate);
        socket.off('order:status-updated', handleOrderUpdate);
        socket.off('order:overdue-alert', handleOrderUpdate);
        socket.off('order:prep-time-overridden', handleOrderUpdate);
      };
    }
  }, [activeOutletId, token]);

  const activeOutlet = outlets.find((o) => o.id === activeOutletId);

  // Demo auto-login as Jubilee Hills Outlet Manager for one-click testing
  const handleQuickLoginAsManager = async () => {
    try {
      setIsLoading(true);
      const res = await ApiClient.login({
        emailOrPhone: 'manager@dumline.com',
        password: 'Manager@123',
      });
      setAuth(res.token, res.user);
      if (res.user.assignedOutletId) {
        setActiveOutletId(res.user.assignedOutletId);
      }
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Open override modal
  const handleOpenOverride = (order: KitchenQueueOrder) => {
    const prepMins = Math.max(
      5,
      Math.round((new Date(order.promisedTime).getTime() - new Date(order.placedAt).getTime()) / 60000)
    );
    setSelectedOrderForOverride(order);
    setNewPrepMinutes(prepMins);
    setOverrideReason('');
    setOverrideError(null);
    setOverrideSuccess(null);
    setOverrideModalOpen(true);
  };

  // Submit override
  const handleSubmitOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForOverride || !token) return;

    if (!overrideReason.trim()) {
      setOverrideError('A detailed reason is required for operational auditing.');
      return;
    }

    setIsSubmittingOverride(true);
    setOverrideError(null);

    try {
      const newPromisedDate = new Date(Date.now() + newPrepMinutes * 60000).toISOString();
      await ApiClient.overridePrepTime(
        selectedOrderForOverride.id,
        newPromisedDate,
        overrideReason.trim(),
        token
      );
      setOverrideSuccess('Promised preparation time updated successfully.');
      setTimeout(() => {
        setOverrideModalOpen(false);
        if (activeOutletId) fetchOrders(activeOutletId);
      }, 1000);
    } catch (err: any) {
      setOverrideError(err.message || 'Failed to override prep time.');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Calculate statistics
  const overdueOrders = orders.filter((o) => o.isOverdue);
  const activeOrders = orders.filter((o) => ['ACCEPTED', 'PREPARING'].includes(o.status));
  const readyOrders = orders.filter((o) => o.status === 'READY');

  return (
    <ProtectedRoute allowedRoles={['OUTLET_MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-dumline-sand/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dumline-sand-dark pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-dumline-saffron/30 bg-dumline-saffron/10 px-3 py-0.5 text-xs font-bold text-dumline-saffron-dark mb-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>OUTLET OPERATIONS & PREP-TIME DISPATCH</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal">
                Kitchen Manager Portal
              </h1>
              <p className="text-xs sm:text-sm text-dumline-charcoal/70">
                Real-time station monitoring, AI estimate validation, overdue alerts, and audited manager overrides.
              </p>
            </div>

            {/* Quick Staff Persona Bar or Outlet Selector */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-dumline-charcoal">{user?.fullName || 'Outlet Manager'}</div>
                  <div className="text-[10px] text-dumline-saffron-dark font-semibold uppercase tracking-wider">
                    {user?.role} • {activeOutlet?.name || 'Assigned'}
                  </div>
                </div>

                {/* If Admin, allow switching outlets */}
                {user?.role === 'ADMIN' && (
                  <select
                    value={activeOutletId}
                    onChange={(e) => setActiveOutletId(e.target.value)}
                    className="rounded-xl border border-dumline-sand-dark bg-white px-3 py-2 text-xs font-semibold text-dumline-charcoal shadow-sm"
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

        {/* Operational Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-dumline-sand-dark bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-dumline-charcoal/60">
                Active Kitchen Load
              </span>
              <Flame className="h-5 w-5 text-dumline-crimson" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-dumline-charcoal">
                {activeOrders.length}
              </span>
              <span className="text-xs text-dumline-charcoal/70">pots steaming</span>
            </div>
          </div>

          <div className="rounded-2xl border border-dumline-sand-dark bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-dumline-charcoal/60">
                Outlet Prep Floor (T_Min)
              </span>
              <Clock className="h-5 w-5 text-dumline-saffron-dark" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-dumline-charcoal">
                {activeOutlet?.minPrepMinutes || 20}m
              </span>
              <span className="text-xs text-dumline-charcoal/70">mandatory floor</span>
            </div>
          </div>

          <div className="rounded-2xl border border-dumline-sand-dark bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-dumline-charcoal/60">
                Staged for Handover
              </span>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-dumline-charcoal">
                {readyOrders.length}
              </span>
              <span className="text-xs text-dumline-charcoal/70">ready for dispatch</span>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 shadow-sm transition-all ${
              overdueOrders.length > 0
                ? 'border-red-400 bg-red-50 ring-2 ring-red-400/30'
                : 'border-dumline-sand-dark bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  overdueOrders.length > 0 ? 'text-red-700' : 'text-dumline-charcoal/60'
                }`}
              >
                Overdue ($\ge 10$m)
              </span>
              <AlertTriangle
                className={`h-5 w-5 ${
                  overdueOrders.length > 0 ? 'text-red-600 animate-bounce' : 'text-dumline-charcoal/40'
                }`}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`font-serif text-3xl font-bold ${
                  overdueOrders.length > 0 ? 'text-red-700' : 'text-dumline-charcoal'
                }`}
              >
                {overdueOrders.length}
              </span>
              <span className="text-xs text-dumline-charcoal/70">requiring manager intervention</span>
            </div>
          </div>
        </div>

        {/* Overdue Urgent Alert Banner */}
        {overdueOrders.length > 0 && (
          <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white font-bold">
                !
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-red-900">
                  {overdueOrders.length} Order(s) Exceeded Promised Time + 10 Minutes
                </h3>
                <p className="text-xs text-red-700">
                  Automated customer notifications dispatched. Station leads must expedite packaging or contact guests immediately.
                </p>
              </div>
            </div>
            <Link
              href="/kds"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow"
            >
              <span>Switch to KDS Urgent Screen</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Live Orders Table with AI Model & Override Controls */}
        <div className="rounded-2xl border border-dumline-sand-dark bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-dumline-sand px-6 py-4 bg-dumline-sand/10">
            <div>
              <h2 className="font-serif text-xl font-bold text-dumline-charcoal">
                Active Operational Orders & AI Scheduling
              </h2>
              <p className="text-xs text-dumline-charcoal/70">
                Formula: Promised Time = max(Active Estimate, Min Floor). Overrides are recorded in the audit trail.
              </p>
            </div>
            <button
              type="button"
              onClick={() => activeOutletId && fetchOrders(activeOutletId)}
              className="flex items-center gap-1.5 rounded-lg border border-dumline-sand-dark bg-white px-3 py-1.5 text-xs font-semibold text-dumline-charcoal hover:bg-dumline-sand transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-dumline-charcoal/60">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-dumline-crimson border-t-transparent" />
              <p className="mt-2">Loading live outlet dispatch orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-dumline-charcoal/60">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
              <p className="font-semibold text-sm text-dumline-charcoal">All orders clear and delivered.</p>
              <p>No active kitchen orders queued for this outlet right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-dumline-sand bg-dumline-sand/20 text-[11px] font-bold uppercase tracking-wider text-dumline-charcoal/70">
                  <tr>
                    <th className="px-5 py-3.5">Order ID</th>
                    <th className="px-5 py-3.5">Type & Placed</th>
                    <th className="px-5 py-3.5">Ordered Items</th>
                    <th className="px-5 py-3.5">Kitchen Status</th>
                    <th className="px-5 py-3.5">Promised Prep Time</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dumline-sand">
                  {orders.map((ord) => {
                    return (
                      <tr
                        key={ord.id}
                        className={`hover:bg-dumline-sand/20 transition-colors ${
                          ord.isOverdue ? 'bg-red-50/70' : ''
                        }`}
                      >
                        {/* Order ID */}
                        <td className="px-5 py-4 font-mono font-bold text-dumline-charcoal">
                          <Link
                            href={`/orders/${ord.id}`}
                            className="hover:text-dumline-crimson underline underline-offset-2"
                          >
                            {ord.id}
                          </Link>
                          {ord.isOverdue && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                              OVERDUE
                            </span>
                          )}
                        </td>

                        {/* Type & Placed */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-dumline-charcoal">{ord.fulfillmentType}</div>
                          <div className="text-[11px] text-dumline-charcoal/60">
                            {formatTime(ord.placedAt)}
                          </div>
                        </td>

                        {/* Items */}
                        <td className="px-5 py-4">
                          <div className="max-w-xs space-y-0.5">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-medium text-dumline-charcoal truncate">
                                  {it.quantity}x {it.itemName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
                              ord.status === 'PREPARING'
                                ? 'bg-amber-100 text-amber-900'
                                : ord.status === 'ACCEPTED'
                                ? 'bg-blue-100 text-blue-900'
                                : ord.status === 'READY'
                                ? 'bg-green-100 text-green-900'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>

                        {/* Promised Prep Minutes */}
                        <td className="px-5 py-4">
                          {(() => {
                            const promisedMins = Math.max(
                              0,
                              Math.round(
                                (new Date(ord.promisedTime).getTime() - new Date(ord.placedAt).getTime()) / 60000
                              )
                            );
                            return (
                              <div>
                                <div className="font-semibold text-dumline-charcoal text-sm">
                                  {promisedMins} mins
                                </div>
                                <div className="text-[10px] text-dumline-charcoal/60">
                                  Due: {formatTime(ord.promisedTime)}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenOverride(ord)}
                            className="inline-flex items-center gap-1 rounded-lg border border-dumline-sand-dark bg-dumline-sand/30 px-3 py-1.5 text-xs font-semibold text-dumline-charcoal hover:bg-dumline-crimson hover:text-white transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Override</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Manager Override Modal Dialog */}
        {overrideModalOpen && selectedOrderForOverride && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dumline-charcoal/70 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-dumline-ivory border border-dumline-sand-dark p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-dumline-sand pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-dumline-crimson/10 text-dumline-crimson font-bold">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-dumline-charcoal">
                      Manager Prep-Time Override
                    </h3>
                    <p className="text-xs text-dumline-charcoal/70 font-mono">
                      Order #{selectedOrderForOverride.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="rounded-lg p-1.5 text-dumline-charcoal/60 hover:bg-dumline-sand"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitOverride} className="mt-5 space-y-4">
                {overrideError && (
                  <div className="rounded-xl bg-red-50 border border-red-300 p-3 text-xs text-red-800">
                    {overrideError}
                  </div>
                )}
                {overrideSuccess && (
                  <div className="rounded-xl bg-green-50 border border-green-300 p-3 text-xs text-green-800">
                    {overrideSuccess}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-dumline-sand/40 p-3 text-xs">
                  <div>
                    <span className="text-dumline-charcoal/60">Current Promised Time:</span>
                    <div className="font-bold text-dumline-charcoal text-base">
                      {Math.max(
                        0,
                        Math.round(
                          (new Date(selectedOrderForOverride.promisedTime).getTime() -
                            new Date(selectedOrderForOverride.placedAt).getTime()) /
                            60000
                        )
                      )}{' '}
                      mins
                    </div>
                  </div>
                  <div>
                    <span className="text-dumline-charcoal/60">Outlet Min Floor (T_Min):</span>
                    <div className="font-bold text-dumline-charcoal text-base">
                      {activeOutlet?.minPrepMinutes || 20} mins
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1">
                    New Promised Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={newPrepMinutes}
                    onChange={(e) => setNewPrepMinutes(parseInt(e.target.value) || 20)}
                    className="w-full rounded-xl border border-dumline-sand-dark bg-white px-3.5 py-2.5 text-sm font-semibold text-dumline-charcoal shadow-sm focus:border-dumline-crimson focus:outline-none"
                    required
                  />
                  <span className="text-[11px] text-dumline-charcoal/60">
                    Must be realistic between 5 and 180 minutes. Customer ETA will adjust in real-time.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal mb-1">
                    Audited Reason for Adjustment <span className="text-dumline-crimson">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="e.g. Large bulk corporate batch requires additional 15 minutes of clay handi dum steaming."
                    className="w-full rounded-xl border border-dumline-sand-dark bg-white p-3 text-xs text-dumline-charcoal shadow-sm focus:border-dumline-crimson focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-dumline-sand">
                  <button
                    type="button"
                    onClick={() => setOverrideModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-dumline-charcoal hover:bg-dumline-sand transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOverride}
                    className="rounded-xl bg-dumline-crimson px-5 py-2 text-xs font-bold text-white shadow hover:bg-dumline-crimson-dark disabled:opacity-50 transition-all"
                  >
                    {isSubmittingOverride ? 'Saving Override...' : 'Confirm Audited Override'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
