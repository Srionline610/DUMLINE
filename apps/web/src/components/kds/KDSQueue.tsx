'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import { useOutletStore } from '../../store/outletStore';
import ApiClient from '../../lib/api';
import { getSocket, subscribeToOutlet } from '../../lib/socket';
import { KitchenQueueOrder, OutletSummary } from '@dumline/shared';
import KDSOrderCard from './KDSOrderCard';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ArrowLeft,
  Volume2,
  VolumeX,
  MapPin,
  Building2,
  Filter,
} from 'lucide-react';

export default function KDSQueue() {
  const { token, user } = useAuthStore();
  const { outlets, selectedOutlet, setSelectedOutlet, loadOutlets } = useOutletStore();

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'KITCHEN_STAFF';

  const [activeOutletId, setActiveOutletId] = useState<string>('');
  const [queue, setQueue] = useState<KitchenQueueOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize outlets
  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  // Set active outlet based on authenticated role
  useEffect(() => {
    if (outlets.length > 0 && !activeOutletId) {
      if (isAdmin) {
        // Central Admin defaults to All Outlets
        setActiveOutletId('ALL');
      } else if (user?.assignedOutletId) {
        // Kitchen Staff and Outlet Managers are locked to their assigned outlet
        setActiveOutletId(user.assignedOutletId);
      } else if (selectedOutlet?.id) {
        setActiveOutletId(selectedOutlet.id);
      } else {
        setActiveOutletId(outlets[0].id);
      }
    }
  }, [outlets, user, selectedOutlet, activeOutletId, isAdmin]);

  // Load Kitchen Queue
  const fetchQueue = async (outletId: string, status?: string) => {
    if (!token || !outletId) return;
    try {
      const data = await ApiClient.getKitchenQueue(outletId, token, status);
      // Ensure deduplication by order ID
      const deduplicated = Array.from(new Map(data.map((o) => [o.id, o])).values());
      setQueue(deduplicated);
      setFetchError(null);
    } catch (err: any) {
      console.error('KDS queue fetch error:', err);
      setQueue([]);
      setFetchError(err?.message || 'Failed to load kitchen queue for this outlet');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeOutletId && token) {
      setIsLoading(true);
      const apiStatus =
        filterStatus === 'COMPLETED'
          ? 'COMPLETED'
          : filterStatus === 'OVERDUE'
          ? 'OVERDUE'
          : undefined;

      fetchQueue(activeOutletId, apiStatus);

      // Socket.IO real-time kitchen updates
      subscribeToOutlet(activeOutletId);
      const socket = getSocket();

      const onNotify = () => {
        fetchQueue(activeOutletId, apiStatus);
      };

      socket.on('kitchen:notify', onNotify);
      socket.on('order:created', onNotify);
      socket.on('order:status-updated', onNotify);
      socket.on('order:update', onNotify);
      socket.on('order:overdue-alert', onNotify);
      socket.on('order:overdue', onNotify);
      socket.on('order:prep-time-overridden', onNotify);

      return () => {
        socket.off('kitchen:notify', onNotify);
        socket.off('order:created', onNotify);
        socket.off('order:status-updated', onNotify);
        socket.off('order:update', onNotify);
        socket.off('order:overdue-alert', onNotify);
        socket.off('order:overdue', onNotify);
        socket.off('order:prep-time-overridden', onNotify);
      };
    }
  }, [activeOutletId, token, filterStatus]);

  // Status transition handler
  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      await ApiClient.updateOrderStatus(orderId, nextStatus, token);
      const apiStatus =
        filterStatus === 'COMPLETED'
          ? 'COMPLETED'
          : filterStatus === 'OVERDUE'
          ? 'OVERDUE'
          : undefined;
      await fetchQueue(activeOutletId, apiStatus);
    } catch (err: any) {
      alert(`Error updating order status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter queue for display
  const filteredQueue = useMemo(() => {
    return queue.filter((order) => {
      if (filterStatus === 'ALL') return order.status !== 'COMPLETED';
      if (filterStatus === 'OVERDUE') {
        return order.isOverdue || Date.now() >= new Date(order.promisedTime).getTime() + 10 * 60 * 1000;
      }
      return order.status === filterStatus;
    });
  }, [queue, filterStatus]);

  // Calculate overdue count across current queue
  const overdueCount = useMemo(() => {
    return queue.filter(
      (o) => o.isOverdue || Date.now() >= new Date(o.promisedTime).getTime() + 10 * 60 * 1000
    ).length;
  }, [queue]);

  const currentOutlet = outlets.find((o) => o.id === activeOutletId);

  // Per-branch statistics for Central Admin
  const branchSummaries = useMemo(() => {
    if (!isAdmin) return [];
    return outlets.map((outlet) => {
      const branchOrders = queue.filter((o) => o.outletId === outlet.id);
      const activeCount = branchOrders.filter((o) => o.status !== 'COMPLETED').length;
      const overdue = branchOrders.filter(
        (o) => o.isOverdue || Date.now() >= new Date(o.promisedTime).getTime() + 10 * 60 * 1000
      ).length;
      return {
        ...outlet,
        activeCount,
        overdue,
      };
    });
  }, [isAdmin, outlets, queue]);

  const statusTabs = [
    { key: 'ALL', label: 'ALL ACTIVE' },
    { key: 'PLACED', label: 'NEW (PLACED)' },
    { key: 'ACCEPTED', label: 'ACCEPTED' },
    { key: 'PREPARING', label: 'PREPARING' },
    { key: 'READY', label: 'READY' },
    { key: 'COMPLETED', label: 'COMPLETED' },
    { key: 'OVERDUE', label: 'DELAYED (OVERDUE)' },
  ];

  return (
    <div className="min-h-screen bg-[#120F0C] text-[#F5EFE6] flex flex-col font-sans">
      {/* KDS Top Operational Header */}
      <header className="bg-[#1A1512] border-b border-[#38302A] px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Outlet & Title */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-[#A89E94] hover:text-white transition-colors p-1.5 rounded-lg bg-[#26201B]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Store</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dumline-crimson text-white">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider text-white">
                  {isAdmin
                    ? activeOutletId === 'ALL'
                      ? 'ALL-KITCHENS CENTRAL KDS COMMAND'
                      : `CENTRAL KDS — ${currentOutlet?.name?.toUpperCase() || 'BRANCH'}`
                    : 'KDS OPERATIONAL DISPLAY'}
                </h1>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-black border ${
                    isAdmin
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {isAdmin ? 'CENTRAL ADMIN MONITORING' : 'LIVE SOCKET'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                {isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-dumline-saffron-dark shrink-0" />
                    <select
                      value={activeOutletId}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setActiveOutletId(newId);
                        setQueue([]);
                        setIsLoading(true);
                      }}
                      className="rounded bg-[#28211B] border border-[#4D4035] px-2.5 py-1 text-xs font-bold text-[#F5EFE6] focus:outline-none focus:border-dumline-saffron"
                    >
                      <option value="ALL">All Outlets (All Branches)</option>
                      {outlets.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#28211B] border border-[#4D4035] text-xs font-bold text-[#F5EFE6]">
                    <MapPin className="h-3 w-3 text-dumline-crimson shrink-0" />
                    <span>{currentOutlet?.name || 'Assigned Kitchen'}</span>
                    <span className="text-[10px] text-[#A89E94] font-normal">(Station Locked)</span>
                  </div>
                )}

                {activeOutletId !== 'ALL' && currentOutlet && (
                  <span className="text-[11px] text-[#A89E94]">
                    Min Prep: {currentOutlet.minPrepMinutes || 20}m
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                filterStatus === tab.key
                  ? tab.key === 'OVERDUE'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                    : 'bg-white text-black shadow'
                  : tab.key === 'OVERDUE' && overdueCount > 0
                  ? 'bg-red-950/80 text-red-300 border border-red-500/60 hover:bg-red-900'
                  : 'bg-[#26201B] text-[#A89E94] hover:bg-[#332B25] hover:text-white border border-[#38302A]'
              }`}
            >
              {tab.label}
              {tab.key === 'OVERDUE' && overdueCount > 0 && ` (${overdueCount})`}
            </button>
          ))}
        </div>

        {/* Right: Metrics & Clock */}
        <div className="flex items-center gap-4">
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950 border border-red-500 text-red-300 animate-pulse text-xs font-black">
              <AlertTriangle className="h-4 w-4" />
              <span>{overdueCount} OVERDUE</span>
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#26201B] px-3 py-1.5 rounded-xl border border-[#38302A]">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="font-mono text-base font-black tracking-wider text-white">
              {currentTime || '00:00:00'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              const apiStatus =
                filterStatus === 'COMPLETED'
                  ? 'COMPLETED'
                  : filterStatus === 'OVERDUE'
                  ? 'OVERDUE'
                  : undefined;
              fetchQueue(activeOutletId, apiStatus);
            }}
            className="p-2 rounded-xl bg-[#26201B] hover:bg-[#332B25] text-white border border-[#38302A] transition-colors"
            aria-label="Refresh kitchen queue"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Central Admin Multi-Branch Executive Bar */}
      {isAdmin && (
        <div className="bg-[#171310] border-b border-[#2C241E] px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[#8C7E72] font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Quick Switch:
          </span>

          <button
            type="button"
            onClick={() => {
              setActiveOutletId('ALL');
              setQueue([]);
              setIsLoading(true);
            }}
            className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-2 ${
              activeOutletId === 'ALL'
                ? 'bg-dumline-crimson text-white shadow'
                : 'bg-[#221B16] text-[#B5A99D] hover:bg-[#2C241E] hover:text-white border border-[#38302A]'
            }`}
          >
            <span>All Branches</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px]">
              {queue.filter((o) => o.status !== 'COMPLETED').length} active
            </span>
          </button>

          {branchSummaries.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setActiveOutletId(b.id);
                setQueue([]);
                setIsLoading(true);
              }}
              className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-2 ${
                activeOutletId === b.id
                  ? 'bg-dumline-crimson text-white shadow'
                  : 'bg-[#221B16] text-[#B5A99D] hover:bg-[#2C241E] hover:text-white border border-[#38302A]'
              }`}
            >
              <span>{b.name}</span>
              {activeOutletId === 'ALL' && (
                <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px]">
                  {b.activeCount}
                </span>
              )}
              {b.overdue > 0 && (
                <span className="px-1 py-0.2 rounded-md bg-red-900 text-red-200 text-[10px] font-black animate-pulse">
                  {b.overdue} delayed
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Queue Body */}
      <main className="flex-1 p-6">
        {fetchError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-between gap-4 text-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-bold">Outlet Access Notice</p>
                <p className="text-xs text-red-300/80">{fetchError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const apiStatus =
                  filterStatus === 'COMPLETED'
                    ? 'COMPLETED'
                    : filterStatus === 'OVERDUE'
                    ? 'OVERDUE'
                    : undefined;
                fetchQueue(activeOutletId, apiStatus);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-900 hover:bg-red-800 text-xs font-bold text-white transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
            <div className="h-10 w-10 border-4 border-dumline-crimson border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#A89E94]">
              {isAdmin && activeOutletId === 'ALL'
                ? 'Loading All Kitchen Branches Orders...'
                : 'Loading Station Orders...'}
            </p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] text-center space-y-4 border-2 border-dashed border-[#38302A] rounded-3xl p-8 bg-[#181310]/50">
            <div className="h-16 w-16 rounded-2xl bg-[#28211B] flex items-center justify-center text-dumline-saffron border border-[#3D332B]">
              <ChefHat className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">No Orders in Queue</h2>
              <p className="text-xs text-[#A89E94] max-w-md mt-1">
                There are no active orders under <strong className="text-white">{filterStatus}</strong> for{' '}
                <strong className="text-white">
                  {isAdmin && activeOutletId === 'ALL' ? 'all branches' : currentOutlet?.name || 'this outlet'}
                </strong>.
              </p>
              {user && (
                <p className="text-[11px] text-[#8C7E72] mt-2">
                  Viewing as: <span className="text-[#C59A45] font-semibold">{user.fullName || user.email}</span> (
                  {user.role})
                  {user.assignedOutletId ? ' • Station locked to assigned outlet' : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const apiStatus =
                  filterStatus === 'COMPLETED'
                    ? 'COMPLETED'
                    : filterStatus === 'OVERDUE'
                    ? 'OVERDUE'
                    : undefined;
                fetchQueue(activeOutletId, apiStatus);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-dumline-crimson px-5 py-2.5 text-xs font-bold text-white hover:bg-dumline-crimson-dark shadow transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Queue</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredQueue.map((order) => (
              <KDSOrderCard
                key={order.id}
                order={order}
                isUpdating={updatingId === order.id}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
