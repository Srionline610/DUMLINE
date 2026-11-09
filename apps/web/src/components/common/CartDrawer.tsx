'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../../store/cartStore';
import { formatINR } from '../../lib/utils';
import { DISH_ASSETS, DEFAULT_DISH_IMAGE } from '../../lib/constants';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartDrawer() {
  const {
    items,
    boundOutletName,
    isCartDrawerOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getBaseAmount,
    getGstAmount,
    getDeliveryFee,
    getTotalAmount,
    fulfillmentType,
    setFulfillmentType,
  } = useCartStore();

  // Escape key listener for accessible cart dismissal - ALWAYS at top level
  React.useEffect(() => {
    if (!isCartDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartDrawerOpen, closeCart]);

  if (!isCartDrawerOpen) return null;

  const subtotal = getSubtotal();
  const baseAmount = getBaseAmount();
  const gstAmount = getGstAmount();
  const deliveryFee = getDeliveryFee();
  const total = getTotalAmount();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your Royal Feast Cart"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-dumline-charcoal/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-dumline-ivory shadow-2xl border-l border-dumline-sand flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-dumline-sand bg-dumline-ivory">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dumline-crimson/10 text-dumline-crimson">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-dumline-charcoal">Your Royal Feast</h2>
                {boundOutletName && (
                  <p className="text-[11px] font-semibold text-dumline-saffron-dark tracking-wide">
                    Kitchen: {boundOutletName}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-lg p-2 text-dumline-charcoal/60 hover:bg-dumline-sand hover:text-dumline-charcoal transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Fulfillment Toggle */}
          <div className="px-6 py-3 bg-dumline-sand/40 border-b border-dumline-sand flex items-center justify-between">
            <span className="text-xs font-bold text-dumline-charcoal uppercase tracking-wider">Fulfillment</span>
            <div className="flex rounded-full bg-dumline-sand p-0.5 border border-dumline-sand-dark">
              <button
                type="button"
                onClick={() => setFulfillmentType('DELIVERY')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  fulfillmentType === 'DELIVERY'
                    ? 'bg-dumline-crimson text-white shadow-sm'
                    : 'text-dumline-charcoal/70 hover:text-dumline-charcoal'
                }`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => setFulfillmentType('PICKUP')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  fulfillmentType === 'PICKUP'
                    ? 'bg-dumline-crimson text-white shadow-sm'
                    : 'text-dumline-charcoal/70 hover:text-dumline-charcoal'
                }`}
              >
                Takeaway
              </button>
            </div>
          </div>

          {/* Complimentary Delivery Progress Indicator */}
          {items.length > 0 && fulfillmentType === 'DELIVERY' && (
            <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between">
              <span>
                {subtotal >= 1500
                  ? '✨ Complimentary Royal Delivery Unlocked!'
                  : `Add ${formatINR(Math.max(0, 1500 - subtotal))} more for free direct delivery`}
              </span>
              <span className="font-bold text-[10px] text-dumline-crimson">
                {Math.min(100, Math.round((subtotal / 1500) * 100))}%
              </span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="h-16 w-16 rounded-full bg-dumline-sand flex items-center justify-center text-dumline-saffron-dark mb-4">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-xl font-bold text-dumline-charcoal mb-1">Your cart is empty</h3>
                <p className="text-xs text-dumline-charcoal/60 max-w-xs mb-6">
                  Explore our authentic slow-cooked dum biryanis, aromatic curries, and Nizami desserts.
                </p>
                <Link
                  href="/menu"
                  onClick={closeCart}
                  className="rounded-full bg-dumline-crimson px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-dumline-crimson-dark transition-all"
                >
                  Explore Royal Menu
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const dishAsset = DISH_ASSETS[item.itemId];
                const imageSrc = dishAsset?.image || DEFAULT_DISH_IMAGE;

                return (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-4 p-3 rounded-2xl border border-dumline-sand bg-white shadow-sm"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-dumline-sand">
                      <Image
                        src={imageSrc}
                        alt={item.itemName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-dumline-charcoal truncate">{item.itemName}</h4>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {Object.entries(item.selectedOptions).map(([key, val], i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded bg-dumline-sand/60 px-1.5 py-0.5 text-[9px] font-semibold text-dumline-charcoal"
                            >
                              <span className="text-dumline-charcoal/60 mr-1">{key}:</span>
                              <span>{val}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-dumline-crimson">{formatINR(item.unitPrice)}</span>
                        <span className="text-[10px] text-dumline-charcoal/50">(incl. 5% GST)</span>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center rounded-lg border border-dumline-sand-dark bg-dumline-sand/30">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                            className="p-1 text-dumline-charcoal hover:bg-dumline-sand rounded-l-lg transition-colors"
                            aria-label={`Decrease quantity of ${item.itemName}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-dumline-charcoal">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                            className="p-1 text-dumline-charcoal hover:bg-dumline-sand rounded-r-lg transition-colors"
                            aria-label={`Increase quantity of ${item.itemName}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.itemId)}
                          className="text-dumline-charcoal/40 hover:text-dumline-crimson p-1 transition-colors"
                          aria-label={`Remove ${item.itemName} from cart`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-dumline-charcoal">
                        {formatINR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pricing Summary & Checkout Footer */}
          {items.length > 0 && (
            <div className="border-t border-dumline-sand bg-white p-6 shadow-lg space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-dumline-charcoal/80">
                  <span>Item Subtotal (GST Inclusive)</span>
                  <span className="font-semibold">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-dumline-charcoal/60 pl-2">
                  <span>• Net Base Price</span>
                  <span>{formatINR(baseAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-dumline-charcoal/60 pl-2">
                  <span>• Inclusive 5% Restaurant GST</span>
                  <span>{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-dumline-charcoal/80">
                  <span>Fulfillment ({fulfillmentType === 'DELIVERY' ? 'Simulated Direct Delivery' : 'Store Pickup'})</span>
                  <span className="font-semibold">
                    {deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : formatINR(deliveryFee)}
                  </span>
                </div>
                <div className="border-t border-dumline-sand my-2 pt-2 flex justify-between text-base font-bold text-dumline-charcoal">
                  <span>Total Payable</span>
                  <span className="font-black text-dumline-crimson text-lg">{formatINR(total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-dumline-sage font-medium bg-dumline-sand/40 p-2 rounded-lg">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Prices inclusive of 5% GST. No unexpected charges at checkout.</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-xl border border-dumline-sand-dark px-3 py-3 text-xs font-bold text-dumline-charcoal/70 hover:bg-dumline-sand hover:text-dumline-charcoal transition-colors"
                >
                  Clear
                </button>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-dumline-crimson py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-dumline-crimson-dark transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

