'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, MapPin, Flame, BookOpen, Clock, Utensils } from 'lucide-react';

const JOURNEY_LINKS = [
  { href: '#hero', label: 'The Royal Hearth', icon: Sparkles },
  { href: '#outlets', label: 'Kitchen Outlets', icon: MapPin },
  { href: '#spotlight', label: 'Signature Dish', icon: Flame },
  { href: '#heritage', label: 'Heritage Archive', icon: BookOpen },
  { href: '#timeline', label: 'Dum Cooking Stages', icon: Clock },
  { href: '#ingredients', label: 'Sacred Spices', icon: Utensils },
];

export default function CulinaryJourneyNav() {
  return (
    <nav
      aria-label="Culinary Experience Navigation"
      className="hidden md:block sticky top-[73px] z-30 w-full bg-dumline-charcoal/95 backdrop-blur-md border-b border-dumline-sand/20 py-2.5 shadow-sm"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-dumline-saffron">
          <span>Culinary Journey</span>
          <span className="text-white/40">•</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {JOURNEY_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-dumline-sand/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon className="h-3 w-3 text-dumline-saffron" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>

        <Link
          href="/menu"
          className="rounded-full bg-dumline-crimson px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-dumline-crimson-dark transition-all"
        >
          Order Now
        </Link>
      </div>
    </nav>
  );
}

