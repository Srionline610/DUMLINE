'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '../../store/cartStore';
import { useOutletStore } from '../../store/outletStore';
import { formatINR } from '../../lib/utils';
import { DISH_ASSETS, DEFAULT_DISH_IMAGE } from '../../lib/constants';
import { Plus, ArrowRight, Sparkles } from 'lucide-react';

interface SignatureItem {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  isVegetarian: boolean;
  basePrepMinutes: number;
}

const SIGNATURES: SignatureItem[] = [
  {
    id: 'item-chk-dum-fam',
    name: 'Chicken dum biryani family pack',
    description: 'Slow-cooked aromatic kacchi dum biryani with marinated chicken pieces, served with mirchi ka salan and dahi ki chutney. Serves 3-4.',
    category: 'Biryani & Rice',
    basePrice: 1180.0,
    isVegetarian: false,
    basePrepMinutes: 25,
  },
  {
    id: 'item-mut-haleem',
    name: 'Mutton haleem',
    description: 'Traditional slow-cooked stew of pounded mutton, cracked wheat, lentils, ghee, and royal spices, garnished with fried onions and mint.',
    category: 'Hyderabadi Specialties',
    basePrice: 350.0,
    isVegetarian: false,
    basePrepMinutes: 15,
  },
  {
    id: 'item-veg-biryani',
    name: 'Veg biryani',
    description: 'Fragrant basmati rice layered with seasonal farm vegetables, fried onions, and saffron milk.',
    category: 'Biryani & Rice',
    basePrice: 280.0,
    isVegetarian: true,
    basePrepMinutes: 20,
  },
  {
    id: 'item-double-meetha',
    name: 'Double ka meetha',
    description: 'Crisp fried bread soaked in saffron-cardamom rabri, garnished with roasted cashews and silver vark.',
    category: 'Desserts & Beverages',
    basePrice: 90.0,
    isVegetarian: true,
    basePrepMinutes: 5,
  },
];

export default function SignatureDishes() {
  const { addItem } = useCartStore();
  const { selectedOutlet, outlets } = useOutletStore();

  const handleAddToCart = (item: SignatureItem) => {
    const activeOutlet = selectedOutlet || outlets[0];
    if (!activeOutlet) return;
    addItem(
      activeOutlet,
      {
        id: item.id,
        name: item.name,
        effectivePrice: item.basePrice,
        category: item.category,
      },
      1
    );
  };

  return (
    <section className="py-20 bg-dumline-ivory">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-dumline-saffron-dark">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Royal Creations</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal mt-1">
              Signature Royal Dishes
            </h2>
            <p className="text-xs sm:text-sm text-dumline-charcoal/70 mt-1 max-w-xl">
              Authentic Nizami recipes perfected through generations. Prepared fresh with whole spices, pure ghee, and saffron.
            </p>
          </div>
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-xs font-bold text-dumline-crimson hover:text-dumline-crimson-dark transition-colors"
          >
            <span>View Full 9-Dish Menu</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SIGNATURES.map((dish) => {
            const asset = DISH_ASSETS[dish.id];
            const imageSrc = asset?.image || DEFAULT_DISH_IMAGE;

            return (
              <div
                key={dish.id}
                className="group flex flex-col rounded-3xl border border-dumline-sand bg-white shadow-royal hover:shadow-royal-hover transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-dumline-sand">
                  <Image
                    src={imageSrc}
                    alt={dish.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Veg / Non-Veg Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold shadow">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        dish.isVegetarian ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    />
                    <span className="text-dumline-charcoal">{dish.isVegetarian ? 'VEG' : 'NON-VEG'}</span>
                  </div>

                  {/* Badge */}
                  {asset?.badge && (
                    <div className="absolute top-3 right-3 rounded-full bg-dumline-charcoal/90 px-2.5 py-1 text-[9px] font-bold text-dumline-saffron shadow">
                      {asset.badge}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-dumline-charcoal group-hover:text-dumline-crimson transition-colors line-clamp-1">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-dumline-charcoal/70 line-clamp-2 mt-1 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-dumline-sand flex items-center justify-between">
                    <div>
                      <span className="text-base font-black text-dumline-crimson">
                        {formatINR(dish.basePrice)}
                      </span>
                      <span className="block text-[10px] text-dumline-charcoal/50">Incl. 5% GST</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(dish)}
                      className="flex items-center gap-1.5 rounded-xl bg-dumline-crimson px-3 py-2 text-xs font-bold text-white shadow hover:bg-dumline-crimson-dark transition-all"
                      aria-label={`Add ${dish.name} to cart`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

