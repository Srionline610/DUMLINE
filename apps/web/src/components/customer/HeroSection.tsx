import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Clock, ShieldCheck, Flame } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-dumline-ivory pt-8 pb-16 lg:py-20 border-b border-dumline-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Brand Typography */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-dumline-saffron/30 bg-dumline-saffron/10 px-3.5 py-1 text-xs font-bold text-dumline-saffron-dark">
              <Sparkles className="h-3.5 w-3.5" />
              <span>THE MODERN ROYAL KITCHEN • HYDERABAD</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-dumline-charcoal leading-[1.08]">
              The Art of <span className="italic font-normal text-dumline-crimson">Dum Cooking</span>, Sealed for Royalty.
            </h1>

            <p className="text-base sm:text-lg text-dumline-charcoal/80 leading-relaxed max-w-2xl">
              Marinated tender meats and aged long-grain basmati layered with saffron and whole spices, sealed with dough in clay handis and steamed over low charcoal embers. Delivered hot and fragrant across Hyderabad.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/menu"
                className="flex items-center gap-2 rounded-full bg-dumline-crimson px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg hover:bg-dumline-crimson-dark transition-all transform hover:-translate-y-0.5"
              >
                <span>Order Now / Explore Menu</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#heritage"
                className="flex items-center gap-2 rounded-full border border-dumline-sand-dark bg-dumline-sand/30 px-6 py-3.5 text-sm font-bold text-dumline-charcoal hover:bg-dumline-sand transition-all"
              >
                <span>The Dum Craft Story</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-dumline-sand">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-dumline-crimson/10 text-dumline-crimson">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dumline-charcoal">Slow Dum Cooking</h4>
                  <p className="text-[11px] text-dumline-charcoal/60">Sealed Clay Handi</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-dumline-saffron/20 text-dumline-saffron-dark">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dumline-charcoal">Promised Timings</h4>
                  <p className="text-[11px] text-dumline-charcoal/60">Live Kitchen Tracking</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-dumline-sage/15 text-dumline-sage">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-dumline-charcoal">5% Inclusive GST</h4>
                  <p className="text-[11px] text-dumline-charcoal/60">No Double Charging</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto w-full max-w-lg aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-dumline-sand">
              <Image
                src="/images/hero-biryani.jpg"
                alt="Authentic Hyderabadi Dum Biryani steaming in a royal copper handi"
                fill
                priority
                className="object-cover transform hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dumline-charcoal/80 via-transparent to-transparent" />
              
              {/* Floating Pill on Image */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-dumline-ivory/95 backdrop-blur-md border border-dumline-sand shadow-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-dumline-saffron-dark">
                    Signature Creation
                  </span>
                  <h3 className="font-serif text-lg font-bold text-dumline-charcoal">
                    Chicken Dum Biryani Family Pack
                  </h3>
                  <p className="text-xs text-dumline-charcoal/60">With Mirchi ka Salan & Raita</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-dumline-crimson">₹1,180</span>
                  <span className="block text-[10px] text-dumline-charcoal/50">(incl. GST)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

