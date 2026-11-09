'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Info } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  origin: string;
  role: string;
  profile: string;
  colorToken: string;
}

const INGREDIENTS: Ingredient[] = [
  {
    id: 'saffron',
    name: 'Kashmiri Mogra Saffron',
    origin: 'Pampore, Kashmir Valley',
    role: 'Aromatic & Golden Hue',
    profile: 'Hand-harvested purple crocus stigmas soaked in warm buffalo milk; releases floral warmth and royal amber color.',
    colorToken: 'border-amber-400 bg-amber-50/50 text-amber-900',
  },
  {
    id: 'basmati',
    name: '2-Year Aged Dehradun Basmati',
    origin: 'Foothills of the Himalayas',
    role: 'Structure & Grain Separation',
    profile: 'Matured for 24 months to reduce moisture; grains elongate up to 24mm without sticking or breaking during steaming.',
    colorToken: 'border-yellow-300 bg-yellow-50/50 text-yellow-900',
  },
  {
    id: 'ghee',
    name: 'Pure Bilona Desi Ghee',
    origin: 'Telangana Artisanal Dairies',
    role: 'Richness & Convection Medium',
    profile: 'Cultured butter churned from curd; provides the signature velvety mouthfeel and glazes every grain.',
    colorToken: 'border-orange-300 bg-orange-50/50 text-orange-900',
  },
  {
    id: 'birista',
    name: 'Crispy Birista Shallots',
    origin: 'Heritage Kitchen Fryers',
    role: 'Caramelized Sweet-Savory Depth',
    profile: 'Paper-thin sliced shallots slow-fried in pure ghee to a rich mahogany crisp, infusing sweetness into the layers.',
    colorToken: 'border-rose-300 bg-rose-50/50 text-rose-900',
  },
  {
    id: 'masala',
    name: 'Royal Shahi Potli Spices',
    origin: 'Old City Hyderabad Spice Guilds',
    role: 'Complex Trapped Aromatics',
    profile: 'Star anise, green cardamom, mace (javitri), stone flower (dagad phool), and royal shahi jeera, stone-ground fresh.',
    colorToken: 'border-emerald-300 bg-emerald-50/50 text-emerald-900',
  },
  {
    id: 'salan',
    name: 'Bhavnagri Mirchi Ka Salan',
    origin: 'Deccan Nizam Banquets',
    role: 'Essential Spicy Counterpart',
    profile: 'Plump green chilies simmered in roasted sesame seeds, peanuts, coconut, and tamarind to cut through rich rice.',
    colorToken: 'border-red-300 bg-red-50/50 text-red-900',
  },
];

export default function IngredientDiscovery() {
  const [selectedId, setSelectedId] = useState(INGREDIENTS[0].id);
  const activeIngredient = INGREDIENTS.find((i) => i.id === selectedId) || INGREDIENTS[0];

  return (
    <section className="py-20 bg-dumline-sand/20 border-t border-dumline-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-dumline-saffron-dark">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Alchemy of Flavor</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal mt-1">
            Ingredients Behind the Royal Aroma
          </h2>
          <p className="text-xs sm:text-sm text-dumline-charcoal/70 mt-2">
            Every grain and spice in a Dumline handi has a lineage. Discover the six non-negotiable ingredients that define authentic Nizami gastronomy.
          </p>
        </div>

        {/* Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Ingredient Pills (Left) */}
          <div className="md:col-span-5 space-y-2.5">
            {INGREDIENTS.map((ing) => {
              const isSelected = ing.id === selectedId;
              return (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => setSelectedId(ing.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-dumline-crimson bg-white shadow-md ring-1 ring-dumline-crimson/20'
                      : 'border-dumline-sand-dark bg-white/60 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div>
                    <h4 className="font-serif text-base font-bold text-dumline-charcoal">
                      {ing.name}
                    </h4>
                    <span className="text-[11px] text-dumline-charcoal/60 block">
                      {ing.origin}
                    </span>
                  </div>
                  {isSelected ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-dumline-crimson text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-dumline-saffron-dark">
                      Explore →
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detailed Ingredient Spotlight (Right) */}
          <div className="md:col-span-7">
            <div className="rounded-3xl border border-dumline-sand bg-white p-8 shadow-royal space-y-6">
              <div className="flex items-center justify-between border-b border-dumline-sand pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-dumline-saffron-dark">
                    Origin: {activeIngredient.origin}
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-dumline-charcoal mt-0.5">
                    {activeIngredient.name}
                  </h3>
                </div>
                <div className="rounded-full bg-dumline-sand/40 border border-dumline-sand px-3 py-1 text-xs font-bold text-dumline-charcoal">
                  {activeIngredient.role}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm sm:text-base text-dumline-charcoal/80 leading-relaxed font-sans">
                  {activeIngredient.profile}
                </p>

                <div className="p-4 rounded-2xl bg-dumline-sand/30 border border-dumline-sand flex items-start gap-3">
                  <Info className="h-4 w-4 text-dumline-crimson shrink-0 mt-0.5" />
                  <p className="text-xs text-dumline-charcoal/70 leading-relaxed">
                    Dumline uses strictly 100% genuine single-origin ingredients. No synthetic essences, artificial coloring, or MSG are ever permitted in our kitchens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

