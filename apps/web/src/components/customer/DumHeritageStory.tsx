'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Flame, Sparkles, Clock, ShieldCheck, ChevronRight, BookOpen } from 'lucide-react';

interface StoryChapter {
  id: string;
  chapterNumber: string;
  title: string;
  subtitle: string;
  quote: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
  pillarBadge: string;
  metric: { value: string; label: string };
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'dum-pukht',
    chapterNumber: 'Chapter I',
    title: 'The Sacred Art of Dum Pukht',
    subtitle: 'Breathing and Steaming in Trapped Aromatics',
    quote: 'When steam has no escape, flavors have no choice but to marry.',
    paragraphs: [
      'In the royal kitchens of the Nizams, cooking was an act of contemplation. Dum Pukht—literally meaning "to breathe and cook in steam"—is a four-century-old culinary technique where handis are sealed airtight with a ribbon of soft wheat dough (the purdah).',
      'As the handi rests over dying embers of charcoal, trapped steam circulates within. The meat releases its natural juices, infusing each grain of aged long-grain basmati with deep aromatics without burning or drying out.',
    ],
    image: '/images/dum-craftsmanship.jpg',
    imageAlt: 'Authentic dough-sealed copper handi resting on gentle charcoal embers with royal whole spices',
    pillarBadge: 'Purdah Dough Sealing',
    metric: { value: '400+', label: 'Years of Heritage' },
  },
  {
    id: 'royal-kitchens',
    chapterNumber: 'Chapter II',
    title: 'The Royal Kitchens of Hyderabad',
    subtitle: 'Nizami Court Craftsmanship & Pure Ghee Tradition',
    quote: 'Cooking for the Nizam was not mere preparation—it was statecraft and devotion.',
    paragraphs: [
      'The Asaf Jahi court maintained dedicated culinary ateliers where royal khansamas guarded their heirloom recipes like crown jewels. Hand-hammered copper deghs and brass vessels were tinned meticulously to ensure pure heat distribution.',
      'Our recipes strictly honor these archives: pure desi ghee, stone-ground garam masalas, and patience. We never cut corners with artificial gravies or pre-cooked shortcuts.',
    ],
    image: '/images/signature-shahi-haleem.jpg',
    imageAlt: 'Slow-cooked royal heritage dish with glistening pure ghee, fried shallots, and fresh herbs',
    pillarBadge: 'Heirloom Nizam Archives',
    metric: { value: '100%', label: 'Pure Desi Ghee' },
  },
  {
    id: 'kacchi-layering',
    chapterNumber: 'Chapter III',
    title: 'The Sacred Kacchi Dum Layering',
    subtitle: 'Raw Marinated Cuts Beneath Aged Saffron Basmati',
    quote: 'The bottom layer tenderizes into succulent bliss, while the steam perfumes every grain.',
    paragraphs: [
      'Unlike ordinary commercial biryanis where pre-cooked meat is mixed into rice, authentic Hyderabadi Dum Biryani uses the Kacchi method: prime cuts marinated in cultured yogurt, raw papaya, and ground spices are arranged raw at the base of the handi.',
      'Layers of 70% parboiled aged long-grain basmati rice are placed on top, bathed in saffron-infused milk, golden caramelized birista onions, and hand-torn mint before the vessel is sealed.',
    ],
    image: '/images/signature-mutton-biryani.jpg',
    imageAlt: 'Plated Royal Hyderabadi Dum Biryani with distinct saffron rice grains and succulent cuts',
    pillarBadge: 'Authentic Kacchi Dum',
    metric: { value: '2-Year', label: 'Aged Basmati Rice' },
  },
  {
    id: 'handi-to-table',
    chapterNumber: 'Chapter IV',
    title: 'From Handi to Royal Dastarkhwan',
    subtitle: 'The Aromatic Reveal of the Broken Seal',
    quote: 'The first burst of steam tells the soul what the tongue is about to savor.',
    paragraphs: [
      'The moment of truth arrives when the dough seal is sliced open. A warm, fragrant cloud of green cardamom, star anise, mace, and royal saffron perfumes the chamber.',
      'Because Dumline enforces single-outlet kitchen isolation, your handi is prepared and dispatched directly from your designated neighborhood hearth—delivering that authentic table-opening aroma to your doorstep.',
    ],
    image: '/images/hero-biryani.jpg',
    imageAlt: 'Steaming Hyderabadi Dum Biryani in royal copper handi ready for serving',
    pillarBadge: 'Hearth-to-Home Freshness',
    metric: { value: '20 Min', label: 'Minimum Prep Floor' },
  },
];

export default function DumHeritageStory() {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const chapter = STORY_CHAPTERS[activeChapterIndex];

  return (
    <section id="heritage" className="py-24 bg-[#FAF7F2] border-t border-dumline-sand relative overflow-hidden">
      {/* Decorative Watermark Emblem */}
      <div className="absolute -top-12 -right-12 select-none opacity-5 pointer-events-none font-serif text-[180px] font-bold text-dumline-charcoal">
        DUM
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-dumline-saffron/40 bg-dumline-saffron/10 px-4 py-1 text-xs font-bold text-dumline-saffron-dark uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            <span>NIZAMI CULINARY ARCHIVE</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-dumline-charcoal mt-2 leading-tight">
            The Living Heritage of <span className="italic text-dumline-crimson">Dum Pukht</span>
          </h2>
          <p className="text-xs sm:text-sm text-dumline-charcoal/70 mt-2 max-w-xl mx-auto">
            Explore the four sacred chapters behind Hyderabad&apos;s royal culinary tradition—where time, steam, and patience transform simple ingredients into edible gold.
          </p>

          {/* Chapter Selector Tabs */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-8 overflow-x-auto pb-2 scrollbar-none">
            {STORY_CHAPTERS.map((item, idx) => {
              const isActive = idx === activeChapterIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveChapterIndex(idx)}
                  className={`shrink-0 rounded-full px-4 sm:px-5 py-2 text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-dumline-charcoal text-white shadow-md ring-2 ring-dumline-saffron/40'
                      : 'bg-white border border-dumline-sand-dark text-dumline-charcoal/75 hover:bg-dumline-sand hover:text-dumline-charcoal'
                  }`}
                >
                  <span className="text-[10px] text-dumline-saffron uppercase tracking-widest">
                    0{idx + 1}
                  </span>
                  <span>{item.title.replace('The Sacred ', '').replace('The Royal ', '').replace('From Handi to ', '')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side-by-Side Editorial Story Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Visual Column (Left) */}
          <div className="lg:col-span-6 relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-dumline-sand bg-dumline-sand/30 group">
              <Image
                key={chapter.image}
                src={chapter.image}
                alt={chapter.imageAlt}
                fill
                priority
                className="object-cover transition-all duration-700 transform group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dumline-charcoal/80 via-transparent to-transparent opacity-60" />

              {/* Pillar Badge on Image */}
              <div className="absolute top-4 left-4 bg-dumline-charcoal/90 backdrop-blur-md border border-dumline-saffron/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-dumline-saffron shadow-lg flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-dumline-crimson" />
                <span>{chapter.pillarBadge}</span>
              </div>

              {/* Floating Metric Badge */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md border border-dumline-sand px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3">
                <span className="font-serif text-2xl font-black text-dumline-crimson">
                  {chapter.metric.value}
                </span>
                <span className="text-[11px] font-bold text-dumline-charcoal/70 leading-tight">
                  {chapter.metric.label}
                </span>
              </div>
            </div>

            {/* Navigation Indicators */}
            <div className="flex items-center justify-between mt-4 text-xs text-dumline-charcoal/60 px-2">
              <span>{chapter.chapterNumber} of IV</span>
              <div className="flex items-center gap-1">
                {STORY_CHAPTERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveChapterIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === activeChapterIndex ? 'w-6 bg-dumline-crimson' : 'w-2 bg-dumline-sand-dark'
                    }`}
                    aria-label={`Go to chapter ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Editorial Text Column (Right) */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div>
              <span className="text-xs font-bold tracking-widest text-dumline-saffron-dark uppercase block mb-1">
                {chapter.chapterNumber} • {chapter.subtitle}
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal leading-tight">
                {chapter.title}
              </h3>
            </div>

            {/* Narrative Pullquote */}
            <blockquote className="border-l-4 border-dumline-crimson pl-4 py-1 italic font-serif text-base sm:text-lg text-dumline-charcoal/90 bg-white/60 p-4 rounded-r-2xl border-y border-r border-dumline-sand shadow-sm">
              &ldquo;{chapter.quote}&rdquo;
            </blockquote>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-dumline-charcoal/80 font-sans">
              {chapter.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Interactive Next Chapter Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveChapterIndex((activeChapterIndex + 1) % STORY_CHAPTERS.length)}
                className="inline-flex items-center gap-2 rounded-full bg-dumline-charcoal px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-dumline-crimson transition-all"
              >
                <span>Read Next Chapter</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
