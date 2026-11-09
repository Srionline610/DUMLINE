'use client';

import React from 'react';
import Link from 'next/link';
import { useOutletStore } from '../../store/outletStore';
import { useCartStore } from '../../store/cartStore';
import { OutletSummary } from '@dumline/shared';
import { MapPin, Clock, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OutletSelectorSection() {
  const { outlets, selectedOutlet, setSelectedOutlet } = useOutletStore();
  const { boundOutletId, items, openSwitchModal } = useCartStore();

  const handleSelectOutlet = (outlet: OutletSummary) => {
    // If cart has items from another outlet, trigger modal
    if (items.length > 0 && boundOutletId && boundOutletId !== outlet.id) {
      openSwitchModal({ targetOutlet: outlet });
      return;
    }
    setSelectedOutlet(outlet);
  };

  return (
    <section id="outlets" className="py-16 bg-dumline-sand/30 border-b border-dumline-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-dumline-saffron-dark">
            Direct Kitchen Network
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal mt-1">
            Choose Your Hyderabad Kitchen
          </h2>
          <p className="text-xs sm:text-sm text-dumline-charcoal/70 mt-2">
            Each Dumline kitchen is an isolated royal hearth. Orders are prepared fresh at your selected outlet to guarantee live station timing and maximum steam preservation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {outlets.map((outlet) => {
            const isSelected = selectedOutlet?.id === outlet.id;
            const isCartBound = boundOutletId === outlet.id && items.length > 0;

            return (
              <div
                key={outlet.id}
                className={`relative rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                  isSelected
                    ? 'border-dumline-crimson bg-white shadow-xl ring-2 ring-dumline-crimson/20'
                    : 'border-dumline-sand-dark bg-white/70 hover:bg-white hover:shadow-md'
                }`}
              >
                {/* Active selection badge */}
                {isSelected && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-dumline-crimson px-3 py-0.5 text-[11px] font-bold text-white shadow">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Active Kitchen</span>
                  </div>
                )}

                {isCartBound && !isSelected && (
                  <div className="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-dumline-saffron px-3 py-0.5 text-[11px] font-bold text-dumline-charcoal shadow">
                    <AlertCircle className="h-3 w-3" />
                    <span>Cart Bound</span>
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
                        <span>Hearth Active</span>
                      </span>
                      <span className="text-[10px] font-bold text-dumline-saffron-dark uppercase tracking-wider">
                        Live KDS Linked
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-dumline-charcoal">{outlet.name}</h3>
                    <p className="text-xs text-dumline-charcoal/70 flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-dumline-crimson shrink-0" />
                      <span>{outlet.address}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-dumline-sand">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-3.5 w-3.5 text-dumline-saffron-dark shrink-0" />
                      <div>
                        <span className="text-[10px] text-dumline-charcoal/50 block font-semibold">Service Area</span>
                        <strong className="text-dumline-charcoal">{outlet.deliveryRadiusKm} km Radius</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-dumline-saffron-dark shrink-0" />
                      <div>
                        <span className="text-[10px] text-dumline-charcoal/50 block font-semibold">Min Prep Floor</span>
                        <strong className="text-dumline-charcoal">{outlet.minPrepMinutes} mins Floor</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectOutlet(outlet)}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-dumline-crimson text-white shadow hover:bg-dumline-crimson-dark'
                        : 'border border-dumline-sand-dark text-dumline-charcoal hover:bg-dumline-sand'
                    }`}
                  >
                    {isSelected ? 'Kitchen Selected' : 'Select This Outlet'}
                  </button>
                  <Link
                    href={`/menu?outletId=${outlet.id}`}
                    className="rounded-xl border border-dumline-sand-dark px-3 py-2.5 text-xs font-semibold text-dumline-charcoal hover:bg-dumline-sand transition-colors"
                  >
                    Browse Menu
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

