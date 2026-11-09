'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCartStore } from '../../store/cartStore';
import { useOutletStore } from '../../store/outletStore';
import ApiClient from '../../lib/api';
import { formatINR } from '../../lib/utils';
import { DISH_ASSETS, DEFAULT_DISH_IMAGE } from '../../lib/constants';
import { MenuCategoryGroup, MenuItemWithOutletData, MenuItemOptionGroup, DISH_CUSTOMIZATION_CATALOG } from '@dumline/shared';
import {
  Search,
  Plus,
  Minus,
  Filter,
  AlertCircle,
  Sparkles,
  ChefHat,
  X,
  Check,
  Flame,
  Info,
} from 'lucide-react';

export default function MenuCatalog() {
  const { selectedOutlet, outlets } = useOutletStore();
  const { addItem, openCart } = useCartStore();

  const [categories, setCategories] = useState<MenuCategoryGroup[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customization modal state
  const [customizingDish, setCustomizingDish] = useState<MenuItemWithOutletData | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Load categorized menu with outlet overrides
  useEffect(() => {
    let isMounted = true;
    async function loadMenu() {
      setIsLoading(true);
      setError(null);
      try {
        const outletId = selectedOutlet?.id || (outlets.length > 0 ? outlets[0].id : undefined);
        const data = await ApiClient.getCategorizedMenu(outletId);
        if (isMounted) {
          setCategories(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load menu items');
          setIsLoading(false);
        }
      }
    }
    loadMenu();
    return () => {
      isMounted = false;
    };
  }, [selectedOutlet, outlets]);

  // Escape key listener for accessible modal dismissal
  useEffect(() => {
    if (!customizingDish) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCustomizingDish(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [customizingDish]);

  const allItems: MenuItemWithOutletData[] = categories.flatMap((c) => c.items);

  // Filter items
  const filteredItems = allItems.filter((item) => {
    // Category match
    if (activeCategory !== 'ALL' && item.category !== activeCategory) {
      return false;
    }
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    // Veg filter
    if (vegOnly && !item.isVegetarian) {
      return false;
    }
    return true;
  });

  const getDishOptionGroups = (dish: MenuItemWithOutletData): MenuItemOptionGroup[] => {
    if (dish.optionGroups && dish.optionGroups.length > 0) {
      return dish.optionGroups;
    }
    return DISH_CUSTOMIZATION_CATALOG[dish.id] || [];
  };

  const handleOpenCustomize = (dish: MenuItemWithOutletData) => {
    const groups = getDishOptionGroups(dish);
    const initialOptions: Record<string, string> = {};
    for (const grp of groups) {
      if (grp.options.length > 0) {
        initialOptions[grp.name] = grp.options[0].name;
      }
    }
    setCustomizingDish(dish);
    setModalQuantity(1);
    setSelectedOptions(initialOptions);
  };

  const handleAddDirect = (e: React.MouseEvent, dish: MenuItemWithOutletData) => {
    e.stopPropagation();
    const activeOutlet = selectedOutlet || outlets[0];
    if (!activeOutlet) return;

    const groups = getDishOptionGroups(dish);
    const defaultOptions: Record<string, string> = {};
    let addedPrice = 0;
    for (const grp of groups) {
      if (grp.required && grp.options.length > 0) {
        defaultOptions[grp.name] = grp.options[0].name;
        addedPrice += grp.options[0].priceModifier || 0;
      }
    }

    addItem(
      activeOutlet,
      {
        id: dish.id,
        name: dish.name,
        effectivePrice: dish.effectivePrice + addedPrice,
        category: dish.category,
      },
      1,
      defaultOptions
    );
  };

  const handleConfirmCustomize = () => {
    if (!customizingDish) return;
    const activeOutlet = selectedOutlet || outlets[0];
    if (!activeOutlet) return;

    const groups = getDishOptionGroups(customizingDish);
    let addedPrice = 0;
    for (const [grpName, optVal] of Object.entries(selectedOptions)) {
      const grp = groups.find((g) => g.name === grpName);
      const opt = grp?.options.find((o) => o.name === optVal);
      if (opt?.priceModifier) {
        addedPrice += opt.priceModifier;
      }
    }

    addItem(
      activeOutlet,
      {
        id: customizingDish.id,
        name: customizingDish.name,
        effectivePrice: customizingDish.effectivePrice + addedPrice,
        category: customizingDish.category,
      },
      modalQuantity,
      selectedOptions
    );

    setCustomizingDish(null);
    openCart();
  };

  const currentModalUnitPrice = (() => {
    if (!customizingDish) return 0;
    const groups = getDishOptionGroups(customizingDish);
    let added = 0;
    for (const [grpName, optVal] of Object.entries(selectedOptions)) {
      const grp = groups.find((g) => g.name === grpName);
      const opt = grp?.options.find((o) => o.name === optVal);
      if (opt?.priceModifier) {
        added += opt.priceModifier;
      }
    }
    return customizingDish.effectivePrice + added;
  })();

  const categoryNames = ['ALL', ...Array.from(new Set(categories.map((c) => c.category)))];

  return (
    <div className="space-y-8">
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-dumline-sand shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dumline-charcoal/40" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Hyderabadi biryani, salan, haleem..."
            className="w-full rounded-xl border border-dumline-sand-dark bg-dumline-sand/20 pl-10 pr-4 py-2.5 text-xs text-dumline-charcoal placeholder:text-dumline-charcoal/40 focus:border-dumline-crimson focus:outline-none"
          />
        </div>

        {/* Dietary Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setVegOnly(!vegOnly)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
              vegOnly
                ? 'border-green-600 bg-green-50 text-green-700'
                : 'border-dumline-sand-dark bg-transparent text-dumline-charcoal hover:bg-dumline-sand'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                vegOnly ? 'bg-green-600' : 'bg-dumline-charcoal/30'
              }`}
            />
            <span>Vegetarian Only</span>
          </button>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categoryNames.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-dumline-charcoal text-white shadow'
                : 'bg-white border border-dumline-sand-dark text-dumline-charcoal hover:bg-dumline-sand'
            }`}
          >
            {cat === 'ALL' ? 'All Creations' : cat}
          </button>
        ))}
      </div>

      {/* Feature 18: Refined Royal Loading Skeleton & Feature 17: Premium Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-96 rounded-3xl bg-gradient-to-br from-white to-dumline-sand/30 p-5 border border-dumline-sand shadow-sm animate-pulse flex flex-col justify-between"
            >
              <div className="w-full aspect-[16/10] rounded-2xl bg-dumline-sand/50 mb-4" />
              <div className="space-y-2">
                <div className="h-5 w-3/4 bg-dumline-sand/60 rounded" />
                <div className="h-3 w-full bg-dumline-sand/40 rounded" />
                <div className="h-3 w-2/3 bg-dumline-sand/40 rounded" />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-dumline-sand/50">
                <div className="h-6 w-20 bg-dumline-sand/60 rounded" />
                <div className="h-8 w-16 bg-dumline-sand/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-center text-red-800">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
          <h3 className="font-bold">Unable to load menu</h3>
          <p className="text-xs mt-1">{error}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-14 text-center rounded-3xl bg-white border border-dumline-sand shadow-royal space-y-4">
          <div className="h-16 w-16 rounded-full bg-dumline-sand/50 mx-auto flex items-center justify-center text-dumline-saffron-dark">
            <ChefHat className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-dumline-charcoal">No Royal Dishes Match Your Filter</h3>
            <p className="text-xs text-dumline-charcoal/60 mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any dishes matching &ldquo;{searchQuery}&rdquo;. Try resetting your filters to explore all 9 authentic Nizami creations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('ALL');
              setVegOnly(false);
            }}
            className="rounded-full bg-dumline-crimson px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-dumline-crimson-dark transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Dishes Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((dish) => {
            const asset = DISH_ASSETS[dish.id];
            const imageSrc = asset?.image || DEFAULT_DISH_IMAGE;
            const isAvailable = dish.isAvailableAtOutlet;

            return (
              <div
                key={dish.id}
                onClick={() => isAvailable && handleOpenCustomize(dish)}
                className={`group flex flex-col rounded-3xl border bg-white overflow-hidden transition-all duration-300 cursor-pointer ${
                  isAvailable
                    ? 'border-dumline-sand shadow-sm hover:shadow-royal-hover hover:border-dumline-saffron/40'
                    : 'border-dumline-sand opacity-60 bg-dumline-sand/10 cursor-not-allowed'
                }`}
              >
                {/* Dish Image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-dumline-sand">
                  <Image
                    src={imageSrc}
                    alt={dish.name}
                    fill
                    className={`object-cover ${isAvailable ? 'group-hover:scale-105 transition-transform duration-500' : 'grayscale'}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />

                  {/* Veg / Non-Veg Indicator */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold shadow">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        dish.isVegetarian ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    />
                    <span className="text-dumline-charcoal">{dish.isVegetarian ? 'VEG' : 'NON-VEG'}</span>
                  </div>

                  {/* Complexity Tag */}
                  <div className="absolute top-3 right-3 rounded-full bg-dumline-charcoal/80 backdrop-blur-sm px-2.5 py-1 text-[9px] font-bold text-dumline-saffron">
                    {dish.prepComplexityTag.replace('_', ' ')}
                  </div>

                  {!isAvailable && (
                    <div className="absolute inset-0 bg-dumline-charcoal/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow">
                        86&apos;d • Sold Out
                      </span>
                    </div>
                  )}
                </div>

                {/* Dish Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-xl font-bold text-dumline-charcoal group-hover:text-dumline-crimson transition-colors">
                        {dish.name}
                      </h3>
                    </div>
                    <p className="text-xs text-dumline-charcoal/70 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                    {asset?.serves && (
                      <span className="inline-block text-[10px] font-semibold text-dumline-saffron-dark">
                        Portion: {asset.serves}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-dumline-sand flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-dumline-crimson">
                        {formatINR(dish.effectivePrice)}
                      </span>
                      <span className="block text-[10px] text-dumline-charcoal/50">Incl. 5% GST</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={(e) => handleAddDirect(e, dish)}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                          isAvailable
                            ? 'bg-dumline-crimson text-white shadow hover:bg-dumline-crimson-dark'
                            : 'bg-dumline-sand text-dumline-charcoal/40 cursor-not-allowed'
                        }`}
                        aria-label={`Add ${dish.name} to cart`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{isAvailable ? 'Add' : 'Sold Out'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item Customization & Details Modal Dialog */}
      {customizingDish && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-dish-title"
          onClick={() => setCustomizingDish(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dumline-charcoal/70 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-dumline-ivory border border-dumline-sand-dark p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto overscroll-contain"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-dumline-sand pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      customizingDish.isVegetarian ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-dumline-charcoal/60">
                    {customizingDish.category} • {customizingDish.prepComplexityTag.replace('_', ' ')}
                  </span>
                </div>
                <h3 id="modal-dish-title" className="font-serif text-2xl font-bold text-dumline-charcoal">
                  {customizingDish.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomizingDish(null)}
                className="rounded-lg p-1.5 text-dumline-charcoal/60 hover:bg-dumline-sand transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description & Base Details */}
            <p className="text-xs text-dumline-charcoal/80 leading-relaxed">
              {customizingDish.description}
            </p>

            {/* Dynamic Customization Options */}
            <div className="space-y-4">
              {getDishOptionGroups(customizingDish).map((grp) => (
                <div key={grp.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-dumline-charcoal">
                      {grp.name}
                    </label>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        grp.required
                          ? 'bg-dumline-crimson/10 text-dumline-crimson'
                          : 'bg-dumline-charcoal/10 text-dumline-charcoal/70'
                      }`}
                    >
                      {grp.required ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {grp.options.map((opt) => {
                      const isSelected = selectedOptions[grp.name] === opt.name;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() =>
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [grp.name]: opt.name,
                            }))
                          }
                          className={`w-full flex items-center justify-between rounded-xl border p-2.5 text-xs font-semibold transition-all text-left ${
                            isSelected
                              ? 'border-dumline-crimson bg-dumline-crimson/10 text-dumline-crimson font-bold'
                              : 'border-dumline-sand-dark bg-white text-dumline-charcoal hover:bg-dumline-sand'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isSelected && <Check className="h-4 w-4 text-dumline-crimson shrink-0" />}
                            <span>{opt.name}</span>
                          </span>
                          {opt.priceModifier > 0 && (
                            <span className="text-[11px] font-bold text-dumline-crimson">
                              +{formatINR(opt.priceModifier)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between pt-2 border-t border-dumline-sand">
              <span className="text-xs font-bold uppercase tracking-wider text-dumline-charcoal">
                Quantity
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-dumline-sand-dark bg-white text-dumline-charcoal hover:bg-dumline-sand"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-dumline-charcoal">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-dumline-sand-dark bg-white text-dumline-charcoal hover:bg-dumline-sand"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-dumline-sand flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-dumline-crimson">
                  {formatINR(currentModalUnitPrice * modalQuantity)}
                </span>
                <span className="block text-[10px] text-dumline-charcoal/60">GST-Inclusive</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCustomizingDish(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-dumline-charcoal hover:bg-dumline-sand"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCustomize}
                  className="rounded-xl bg-dumline-crimson px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow hover:bg-dumline-crimson-dark transition-all"
                >
                  Add to Royal Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
