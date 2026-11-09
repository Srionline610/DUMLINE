'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight, X, VolumeX } from 'lucide-react';

export default function CinematicBrandIntro() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsFadingOut(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dumline_awakening_intro_seen', 'true');
    }
    setTimeout(() => {
      setIsVisible(false);
    }, 800); // 800ms smooth dissolve
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Accessibility guard: honor prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        return;
      }

      // 2. Session guard: only play once per session
      const alreadySeen = sessionStorage.getItem('dumline_awakening_intro_seen');
      if (alreadySeen) {
        return;
      }

      setIsVisible(true);

      // Auto-transition after 5 seconds
      const autoTimer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      // Keyboard escape listener
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleDismiss();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(autoTimer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="The Awakening of Dum — Cinematic Brand Experience"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#120F0D] overflow-hidden transition-all duration-800 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Cinematic Food Visual */}
      <div className="absolute inset-0">
        <Image
          src="/images/cinematic-biryani-intro.jpg"
          alt="The Awakening of Dum — Steaming Hyderabadi Dum Handi with royal saffron"
          fill
          priority
          className="object-cover scale-105 animate-pulse-slow"
          sizes="100vw"
        />
        {/* Layered Chiaroscuro Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120F0D] via-[#120F0D]/75 to-[#120F0D]/50" />
        <div className="absolute inset-0 bg-radial-vignette opacity-90" />
      </div>

      {/* Atmospheric Realistic Rising Steam & Ember Elements */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-end pb-28 overflow-hidden opacity-70">
        <div className="steam-particle steam-1" />
        <div className="steam-particle steam-2" />
        <div className="steam-particle steam-3" />
        {/* Subtle ember particles */}
        <div className="absolute w-2 h-2 rounded-full bg-dumline-saffron/80 blur-[1px] animate-rise-ember-1" />
        <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/70 blur-[1px] animate-rise-ember-2" />
      </div>

      {/* Top Bar: Sound Status & Accessible Skip Intro Button */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full border border-dumline-sand/20 bg-black/40 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-medium text-dumline-sand/70">
          <VolumeX className="h-3.5 w-3.5 text-dumline-saffron" />
          <span>Visual Prologue</span>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="group flex items-center gap-2.5 rounded-full border border-dumline-saffron/40 bg-black/60 px-5 py-2 text-xs font-bold uppercase tracking-wider text-dumline-sand backdrop-blur-md hover:bg-dumline-crimson hover:border-dumline-crimson hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-dumline-saffron"
          aria-label="Skip cinematic introduction and enter site"
        >
          <span>Skip Intro</span>
          <span className="text-[10px] text-dumline-saffron group-hover:text-white/80 font-mono">[Esc]</span>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Central Brand Story & Reveal */}
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center flex flex-col items-center">
        {/* Royal Crest / Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-dumline-saffron/50 bg-dumline-saffron/15 px-4 py-1.5 text-xs font-bold tracking-widest text-dumline-saffron uppercase mb-5 animate-fade-in shadow-lg">
          <Sparkles className="h-3.5 w-3.5 text-dumline-saffron" />
          <span>THE AWAKENING OF DUM • ESTD. 1928</span>
        </div>

        {/* Brand Display Title */}
        <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-3 animate-scale-up drop-shadow-2xl">
          DUMLINE
        </h1>

        {/* Gold Leaf Rule */}
        <div className="flex items-center gap-3 my-2">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-dumline-saffron" />
          <div className="h-1.5 w-1.5 rotate-45 bg-dumline-saffron" />
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-dumline-saffron" />
        </div>

        <p className="font-serif italic text-2xl sm:text-3xl lg:text-4xl text-dumline-sand mb-4 font-normal tracking-wide">
          The Modern Royal Kitchen
        </p>

        <p className="max-w-xl text-xs sm:text-sm md:text-base text-dumline-sand/80 leading-relaxed font-sans mb-8">
          Aromatic long-grain basmati and marinated succulent meats, sealed in clay handis with dough, slow-steamed over gentle charcoal embers.
        </p>

        {/* Enter CTA Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="group flex items-center gap-3 rounded-full bg-dumline-crimson px-8 py-4 text-xs sm:text-sm font-bold uppercase tracking-widest text-white shadow-2xl hover:bg-dumline-crimson-dark transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-dumline-saffron"
        >
          <span>Enter Royal Kitchen</span>
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform" />
        </button>
      </div>

      {/* Bottom Bar: Brand Hallmarks */}
      <div className="absolute bottom-6 left-0 right-0 px-4 text-center">
        <p className="text-[10px] sm:text-xs text-dumline-sand/50 uppercase tracking-widest font-semibold">
          Single-Outlet Hearth Isolation • Pure Desi Ghee Handis • 5% Inclusive GST
        </p>
      </div>
    </div>
  );
}
