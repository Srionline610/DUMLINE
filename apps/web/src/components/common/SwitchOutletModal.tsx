'use client';

import React, { useEffect, useRef } from 'react';
import { useCartStore } from '../../store/cartStore';
import { AlertTriangle, X } from 'lucide-react';

export default function SwitchOutletModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { isSwitchModalOpen, boundOutletName, pendingChange, closeSwitchModal, confirmSwitchOutlet } =
    useCartStore();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isSwitchModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isSwitchModalOpen]);

  if (!isSwitchModalOpen || !pendingChange) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={closeSwitchModal}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl bg-dumline-ivory p-0 shadow-2xl backdrop:bg-dumline-charcoal/70 border border-dumline-sand-dark"
      aria-labelledby="switch-outlet-title"
      aria-describedby="switch-outlet-desc"
    >
      <div className="p-6">
        <div className="flex items-center justify-between border-b border-dumline-sand pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dumline-crimson/10 text-dumline-crimson">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 id="switch-outlet-title" className="font-serif text-2xl font-bold text-dumline-charcoal">
              Switch Kitchen Outlet?
            </h3>
          </div>
          <button
            type="button"
            onClick={closeSwitchModal}
            className="rounded-lg p-1.5 text-dumline-charcoal/60 hover:bg-dumline-sand hover:text-dumline-charcoal transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4 text-sm leading-relaxed text-dumline-charcoal/80" id="switch-outlet-desc">
          <p className="mb-3">
            Your current cart is bound to{' '}
            <strong className="text-dumline-charcoal">{boundOutletName || 'your current outlet'}</strong>.
          </p>
          <p className="mb-2">
            Dumline strictly enforces <strong className="text-dumline-crimson">single-outlet kitchen isolation</strong> to ensure food temperature, authenticity, and live station timing.
          </p>
          <p className="text-xs text-dumline-charcoal/60">
            Switching to <strong>{pendingChange.targetOutlet.name}</strong> will clear items currently in your cart.
          </p>
        </div>

        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={closeSwitchModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-dumline-sand-dark bg-transparent text-sm font-semibold text-dumline-charcoal hover:bg-dumline-sand transition-colors"
          >
            Keep Cart & Cancel
          </button>
          <button
            type="button"
            onClick={confirmSwitchOutlet}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-dumline-crimson text-sm font-semibold text-white shadow hover:bg-dumline-crimson-dark transition-colors"
          >
            Clear Cart & Switch Outlet
          </button>
        </div>
      </div>
    </dialog>
  );
}

