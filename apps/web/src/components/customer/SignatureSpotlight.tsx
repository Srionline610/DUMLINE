'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useOutletStore } from '../../store/outletStore';
import { formatINR } from '../../lib/utils';
import { Flame, Sparkles, Clock, Plus, ArrowRight, ShieldCheck, Users } from 'lucide-react';

export default function SignatureSpotlight() {
  const { addItem, openCart } = useCartStore();
  const { selectedOutlet, outlets } = useOutletStore();

  const handleAddSpotlight = (id: string, name: string, price: number, category: string) => {
    const activeOutlet = selectedOutlet || outlets[0];
    if (!activeOutlet) return;
    addItem(
      activeOutlet,
      {
        id,
        name,
        effectivePrice: price,
        category,
      },
      1,
      { Spice: 'Royal Medium', Accompaniment: 'Standard Handi Pack' }
    );
    openCart();
  };

  return (
    <section className="py-20 bg-dumline-ivory border-t border-dumline-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-dumline-saffron-dark">
              <Sparkles className="h-3.5 w-3.5 text-dumline-crimson" />
              <span>The Crown Jewel</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal mt-1">
              Royal Chicken Dum Biryani (Family Pack)
            </h2>
            <p className="text-xs sm:text-sm text-dumline-charcoal/70 mt-1 max-w-xl">
              Slow-cooked aromatic kacchi dum biryani with marinated bone-in chicken, layered with saffron basmati rice, served in a royal sealed handi with Mirchi Ka Salan and Dahi Ki Chutney. Serves 3-4.
            </p>
          </div>

          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-xs font-bold text-dumline-crimson hover:text-dumline-crimson-dark transition-colors shrink-0"
          >
            <span>Explore All 9 Creations</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Editorial Spotlight Card */}
        <div className="rounded-3xl border border-dumline-sand bg-white shadow-royal overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
            {/* Image (Left) */}
            <div className="lg:col-span-6 relative aspect-[16/11] lg:aspect-auto lg:h-full min-h-[380px] bg-dumline-sand/30">
              <Image
                src="/images/hero-biryani.jpg"
                alt="Royal Chicken Dum Biryani Family Pack in hammered handi with saffron and birista"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute top-4 left-4 bg-dumline-charcoal/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-dumline-saffron flex items-center gap-1.5 shadow">
                <Flame className="h-3.5 w-3.5 text-dumline-crimson" />
                <span>Nizami Royal Specialty</span>
              </div>
            </div>

            {/* Content (Right) */}
            <div className="lg:col-span-6 p-8 lg:p-12 space-y-6">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-600" />
                  <span>NON-VEG</span>
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-dumline-charcoal/70">
                  <Users className="h-3.5 w-3.5 text-dumline-saffron-dark" />
                  <span>Generously Serves 3–4</span>
                </span>
              </div>

              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal leading-tight">
                Chicken Dum Biryani Family Pack
              </h3>

              <p className="text-xs sm:text-sm text-dumline-charcoal/80 leading-relaxed font-sans">
                Tender bone-in chicken steeped in cultured yogurt, raw spices, and brown shallots, cooked raw beneath a heavy blanket of saffron-scented aged basmati. Sealed with dough in a royal handi over slow embers.
              </p>

              {/* Culinary Notes Grid */}
              <div className="grid grid-cols-2 gap-3 py-2 border-y border-dumline-sand text-xs">
                <div>
                  <span className="text-[10px] text-dumline-charcoal/50 block font-semibold">Spice Profile</span>
                  <strong className="text-dumline-charcoal">Royal Medium (Balanced)</strong>
                </div>
                <div>
                  <span className="text-[10px] text-dumline-charcoal/50 block font-semibold">Accompaniments</span>
                  <strong className="text-dumline-charcoal">Mirchi Ka Salan + Raita</strong>
                </div>
              </div>

              {/* Pricing & CTA */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-3xl font-black text-dumline-crimson">
                    {formatINR(1180.0)}
                  </span>
                  <span className="block text-[10px] font-semibold text-dumline-charcoal/60">
                    Inclusive of 5% Restaurant GST
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleAddSpotlight(
                      'item-chk-dum-fam',
                      'Chicken dum biryani family pack',
                      1180.0,
                      'Biryani & Rice'
                    )
                  }
                  className="flex items-center gap-2 rounded-full bg-dumline-crimson px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xl hover:bg-dumline-crimson-dark transition-all transform hover:scale-105"
                  aria-label="Add Chicken Dum Biryani Family Pack to cart"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Royal Feast</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

