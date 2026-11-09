'use client';

import React from 'react';
import Image from 'next/image';
import { useCartStore } from '../../store/cartStore';
import { useOutletStore } from '../../store/outletStore';
import { formatINR } from '../../lib/utils';
import { Sparkles, Plus, ArrowRight, Heart } from 'lucide-react';

interface PairingSet {
  id: string;
  title: string;
  description: string;
  mainDish: {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
  };
  sideDish: {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
  };
  comboPrice: number;
  savingsNote: string;
}

const PAIRING_SETS: PairingSet[] = [
  {
    id: 'pair-biryani-meetha',
    title: 'The Nizam&apos;s Royal Banquet Pairing',
    description: 'Aromatic Chicken Dum Biryani Family Pack paired harmoniously with royal Double Ka Meetha soaked in saffron rabri.',
    mainDish: {
      id: 'item-chk-dum-fam',
      name: 'Chicken dum biryani family pack',
      price: 1180.0,
      category: 'Biryani & Rice',
      image: '/images/hero-biryani.jpg',
    },
    sideDish: {
      id: 'item-double-meetha',
      name: 'Double ka meetha',
      price: 90.0,
      category: 'Desserts & Beverages',
      image: '/images/signature-double-ka-meetha.jpg',
    },
    comboPrice: 1270.0,
    savingsNote: 'Authentic Banquet Combination',
  },
  {
    id: 'pair-haleem-mutton',
    title: 'The Hyderabadi Heritage Duo',
    description: 'Succulent Royal Mutton Dum Biryani paired with slow-cooked Shahi Mutton Haleem garnished with pure desi ghee.',
    mainDish: {
      id: 'item-mut-dum',
      name: 'Mutton dum biryani',
      price: 420.0,
      category: 'Biryani & Rice',
      image: '/images/signature-mutton-biryani.jpg',
    },
    sideDish: {
      id: 'item-mut-haleem',
      name: 'Mutton haleem',
      price: 350.0,
      category: 'Hyderabadi Specialties',
      image: '/images/signature-shahi-haleem.jpg',
    },
    comboPrice: 770.0,
    savingsNote: 'Traditional Ramadan & Nizami Feasting',
  },
];

export default function CulinaryPairings() {
  const { addItem, openCart } = useCartStore();
  const { selectedOutlet, outlets } = useOutletStore();

  const handleAddPairing = (pair: PairingSet) => {
    const activeOutlet = selectedOutlet || outlets[0];
    if (!activeOutlet) return;

    // Add main dish
    addItem(
      activeOutlet,
      {
        id: pair.mainDish.id,
        name: pair.mainDish.name,
        effectivePrice: pair.mainDish.price,
        category: pair.mainDish.category,
      },
      1,
      { Spice: 'Royal Medium', Accompaniment: 'Standard Handi Pack' }
    );

    // Add side dish
    addItem(
      activeOutlet,
      {
        id: pair.sideDish.id,
        name: pair.sideDish.name,
        effectivePrice: pair.sideDish.price,
        category: pair.sideDish.category,
      },
      1
    );

    openCart();
  };

  return (
    <section className="py-20 bg-dumline-sand/30 border-t border-dumline-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-dumline-saffron-dark">
            <Heart className="h-3.5 w-3.5 text-dumline-crimson" />
            <span>Nizami Gastronomy</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal mt-1">
            Curated Royal Pairings
          </h2>
          <p className="text-xs sm:text-sm text-dumline-charcoal/70 mt-2">
            In Hyderabadi culinary tradition, flavors are never enjoyed in isolation. Discover our head chef&apos;s authoritative flavor pairings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PAIRING_SETS.map((pair) => (
            <div
              key={pair.id}
              className="rounded-3xl border border-dumline-sand bg-white p-6 sm:p-8 shadow-royal flex flex-col justify-between space-y-6"
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-dumline-saffron-dark block mb-1">
                  {pair.savingsNote}
                </span>
                <h3 className="font-serif text-2xl font-bold text-dumline-charcoal">
                  {pair.title}
                </h3>
                <p className="text-xs text-dumline-charcoal/70 mt-1 leading-relaxed">
                  {pair.description}
                </p>
              </div>

              {/* Visual Split Pair */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-dumline-sand/40 border border-dumline-sand">
                  <Image
                    src={pair.mainDish.image}
                    alt={pair.mainDish.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm p-1.5 rounded-lg text-white text-[10px] font-bold truncate">
                    {pair.mainDish.name}
                  </div>
                </div>

                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-dumline-sand/40 border border-dumline-sand">
                  <Image
                    src={pair.sideDish.image}
                    alt={pair.sideDish.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm p-1.5 rounded-lg text-white text-[10px] font-bold truncate">
                    {pair.sideDish.name}
                  </div>
                </div>
              </div>

              {/* Price & Add Pairing */}
              <div className="flex items-center justify-between pt-4 border-t border-dumline-sand">
                <div>
                  <span className="text-2xl font-black text-dumline-crimson">
                    {formatINR(pair.comboPrice)}
                  </span>
                  <span className="block text-[10px] text-dumline-charcoal/60 font-medium">
                    Both Dishes • Incl. 5% GST
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddPairing(pair)}
                  className="flex items-center gap-2 rounded-xl bg-dumline-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-dumline-crimson-dark transition-all"
                  aria-label={`Add ${pair.title} to cart`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Pairing</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

