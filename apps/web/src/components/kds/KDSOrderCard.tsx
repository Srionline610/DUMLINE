'use client';

import React from 'react';
import { KitchenQueueOrder } from '@dumline/shared';
import { formatTime, parseCustomizations } from '../../lib/utils';
import { Clock, AlertTriangle, CheckCircle, Flame, PackageCheck, UserCheck, MapPin } from 'lucide-react';

interface KDSOrderCardProps {
  order: KitchenQueueOrder;
  onUpdateStatus: (orderId: string, nextStatus: string) => void;
  isUpdating?: boolean;
}

export default function KDSOrderCard({
  order,
  onUpdateStatus,
  isUpdating = false,
}: KDSOrderCardProps) {
  const now = Date.now();
  const placedTimeMs = new Date(order.placedAt).getTime();
  const promisedTimeMs = new Date(order.promisedTime).getTime();

  const elapsedMins = Math.max(0, Math.floor((now - placedTimeMs) / 60000));
  const diffPromisedMins = Math.floor((promisedTimeMs - now) / 60000);

  // Status Token Styling
  const isOverdue = order.isOverdue || now >= promisedTimeMs + 10 * 60 * 1000;
  const isApproaching = diffPromisedMins <= 5 && diffPromisedMins >= 0;

  let tokenBg = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
  let tokenBadge = 'ON SCHEDULE';

  if (isOverdue) {
    tokenBg = 'bg-red-950 border-red-500 text-red-200 animate-pulse';
    tokenBadge = `OVERDUE (+${Math.abs(diffPromisedMins)}m)`;
  } else if (order.status === 'PLACED') {
    tokenBg = 'bg-sky-950 border-sky-500 text-sky-200 animate-pulse';
    tokenBadge = 'NEW • PENDING ACCEPTANCE';
  } else if (isApproaching) {
    tokenBg = 'bg-amber-950/80 border-amber-500/50 text-amber-300';
    tokenBadge = `EXPEDITE (${diffPromisedMins}m left)`;
  }

  // Next State Action
  let nextAction: { label: string; status: string; icon: React.ReactNode; color: string } | null = null;
  if (order.status === 'PLACED') {
    nextAction = {
      label: 'ACCEPT ORDER',
      status: 'ACCEPTED',
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black',
    };
  } else if (order.status === 'ACCEPTED') {
    nextAction = {
      label: 'START DUM COOKING',
      status: 'PREPARING',
      icon: <Flame className="h-5 w-5" />,
      color: 'bg-amber-600 hover:bg-amber-500 text-black font-black',
    };
  } else if (order.status === 'PREPARING') {
    nextAction = {
      label: 'MARK READY & STAGED',
      status: 'READY',
      icon: <PackageCheck className="h-5 w-5" />,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white font-black',
    };
  } else if (order.status === 'READY') {
    nextAction = {
      label: 'COMPLETE HANDOFF',
      status: 'COMPLETED',
      icon: <UserCheck className="h-5 w-5" />,
      color: 'bg-blue-600 hover:bg-blue-500 text-white font-black',
    };
  }

  return (
    <div
      className={`rounded-2xl border-2 p-5 flex flex-col justify-between transition-all bg-[#1E1915] shadow-kds-card ${
        isOverdue ? 'border-red-500 ring-2 ring-red-500/30' : 'border-[#3D332B]'
      }`}
    >
      {/* Card Header */}
      <div className="space-y-3 pb-3 border-b border-[#3D332B]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xl sm:text-2xl font-black tracking-wider text-white">
              #{order.orderNumber}
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#B5A99D] flex-wrap">
              <span className="font-semibold text-white uppercase px-2 py-0.5 rounded bg-[#2D251F] border border-[#4D4035]">
                {order.fulfillmentType}
              </span>
              <span
                className={`font-semibold uppercase px-2 py-0.5 rounded border text-[11px] ${
                  order.status === 'PLACED'
                    ? 'bg-sky-950 text-sky-300 border-sky-500/50'
                    : order.status === 'ACCEPTED'
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-500/50'
                    : order.status === 'PREPARING'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : order.status === 'READY'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-600'
                }`}
              >
                {order.status}
              </span>
              <span>Placed {formatTime(order.placedAt)}</span>
            </div>
            {order.outletName && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 font-bold text-xs text-[#E5D7C7] bg-[#2A221C] border border-[#544437] px-2.5 py-0.5 rounded-lg shadow-sm">
                  <MapPin className="h-3 w-3 text-dumline-crimson shrink-0" />
                  <span>{order.outletName}</span>
                </span>
              </div>
            )}
          </div>

          {/* Urgent / Overdue Pill */}
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-black tracking-wider flex items-center gap-1.5 ${tokenBg}`}>
            {isOverdue && <AlertTriangle className="h-4 w-4 text-red-400" />}
            <span>{tokenBadge}</span>
          </div>
        </div>

        {/* Live Timers */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-[#15110E] p-2.5 rounded-xl border border-[#3D332B]">
          <div>
            <span className="text-[10px] text-[#8C7E72] uppercase block">Elapsed Time</span>
            <span className="text-sm font-bold text-white flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#B5A99D]" />
              <span>{elapsedMins} mins</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#8C7E72] uppercase block">Promised Time</span>
            <span className="text-sm font-bold text-[#E5D7C7]">
              {formatTime(order.promisedTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Items List (Large 3-5 ft readable typography) */}
      <div className="py-4 space-y-3 flex-1 overflow-y-auto max-h-60">
        {order.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#28211B] border border-[#3D332B]"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dumline-crimson text-white text-base font-black">
                {item.quantity}×
              </span>
              <div>
                <span className="text-sm sm:text-base font-bold text-white block leading-snug">
                  {item.itemName}
                </span>
                {item.selectedOptionsJson && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {parseCustomizations(item.selectedOptionsJson).map((opt, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md bg-[#332A23] border border-[#544537] px-2 py-0.5 text-[11px] font-semibold text-[#E6C687]"
                      >
                        <span className="text-[#A89E94] mr-1">{opt.label}:</span>
                        <span>{opt.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Touch Control Action Button (>= 48px touch target!) */}
      {nextAction && (
        <div className="pt-3 border-t border-[#3D332B]">
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(order.id, nextAction!.status)}
            className={`w-full min-h-[52px] rounded-xl text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98] transition-all ${nextAction.color}`}
          >
            {nextAction.icon}
            <span>{isUpdating ? 'Updating State...' : nextAction.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}

