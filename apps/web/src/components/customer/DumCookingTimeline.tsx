'use client';

import React, { useState } from 'react';
import { Flame, Sparkles, Clock, CheckCircle2, Shield, ChefHat } from 'lucide-react';

interface Stage {
  step: string;
  title: string;
  shortDesc: string;
  duration: string;
  details: string;
  technique: string;
}

const STAGES: Stage[] = [
  {
    step: '01',
    title: 'The Nizami Marinade',
    shortDesc: 'Prime cuts steeped overnight in cultured curd and 18 stone-ground spices.',
    duration: '12 Hours',
    details:
      'Tender cuts are rubbed with raw green papaya paste, fresh ginger-garlic, cultured whole-milk yogurt, red chili, and our house-ground garam masala. The enzymes gently tenderize the meat to melting softness.',
    technique: 'Cold Enzymatic Tenderization',
  },
  {
    step: '02',
    title: 'Aged Basmati & Saffron Bath',
    shortDesc: 'Aged long-grain rice parboiled to exactly 70% in whole-spice water.',
    duration: '7 Minutes',
    details:
      'Two-year aged Dehradun basmati is boiled with cinnamon, cloves, and bay leaf until the grain yields with a slight bite. It is immediately drained and bathed in Kashmiri saffron milk and melted pure desi ghee.',
    technique: '70% Precise Parboiling',
  },
  {
    step: '03',
    title: 'The Purdah Dough Seal',
    shortDesc: 'Hand-rolled soft wheat dough pinched around the heavy copper rim.',
    duration: 'Airtight Lock',
    details:
      'A long ribbon of kneaded whole-wheat dough is pressed around the circumference of the handi. The heavy lid is firmly seated and crimped airtight, creating a pressure vessel that traps 100% of steam and aroma.',
    technique: 'Traditional Purdah Sealing',
  },
  {
    step: '04',
    title: 'Slow Charcoal Dum Steaming',
    shortDesc: 'Cooked over gentle glowing embers with hot coals placed on the lid.',
    duration: '20-30 Mins',
    details:
      'The sealed handi rests over dying embers of acacia charcoal, with a small pan of hot embers resting on the lid. Gentle top-and-bottom convection cooks the meat in its own trapped steam without scorching.',
    technique: 'Dual-Direction Low Convection',
  },
  {
    step: '05',
    title: 'The Table Opening & Handoff',
    shortDesc: 'The dough seal is sliced open, releasing the fragrant aromatic cloud.',
    duration: 'Immediate',
    details:
      'The baked dough seal is sliced tableside or upon delivery. The first burst of steam perfumes the room with green cardamom, mace, and saffron. Served steaming hot with chilled raita and spicy Mirchi Ka Salan.',
    technique: 'Hearth-to-Dastarkhwan Handoff',
  },
];

export default function DumCookingTimeline() {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const activeStage = STAGES[selectedStageIndex];

  return (
    <section className="py-20 bg-white border-t border-dumline-sand">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-dumline-saffron-dark">
            <Flame className="h-3.5 w-3.5 text-dumline-crimson" />
            <span>The 5 Sacred Stages</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-dumline-charcoal mt-1">
            The Interactive Dum Cooking Journey
          </h2>
          <p className="text-xs sm:text-sm text-dumline-charcoal/70 mt-2">
            Follow the meticulous preparation journey of true Hyderabadi Dum Biryani—from overnight marinade to the ceremonial breaking of the dough seal.
          </p>
        </div>

        {/* Step Progression Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {STAGES.map((stage, idx) => {
            const isSelected = idx === selectedStageIndex;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setSelectedStageIndex(idx)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-dumline-crimson bg-dumline-crimson/5 ring-2 ring-dumline-crimson/20 shadow-md'
                    : 'border-dumline-sand bg-dumline-sand/10 hover:bg-dumline-sand/30'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-xs font-black ${
                      isSelected ? 'text-dumline-crimson' : 'text-dumline-charcoal/40'
                    }`}
                  >
                    {stage.step}
                  </span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-dumline-crimson" />}
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-dumline-charcoal line-clamp-1">
                    {stage.title}
                  </h4>
                  <span className="text-[10px] font-semibold text-dumline-saffron-dark mt-0.5 block">
                    {stage.duration}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Card */}
        <div className="rounded-3xl border border-dumline-sand-dark bg-dumline-ivory p-8 shadow-royal">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-dumline-crimson px-3 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                  Stage {activeStage.step}
                </span>
                <span className="text-xs font-bold text-dumline-saffron-dark uppercase tracking-wider">
                  {activeStage.technique}
                </span>
              </div>

              <h3 className="font-serif text-3xl font-bold text-dumline-charcoal">
                {activeStage.title}
              </h3>

              <p className="text-sm font-medium text-dumline-crimson italic">
                {activeStage.shortDesc}
              </p>

              <p className="text-xs sm:text-sm text-dumline-charcoal/80 leading-relaxed font-sans">
                {activeStage.details}
              </p>
            </div>

            <div className="md:col-span-4 flex flex-col justify-center items-center p-6 rounded-2xl bg-white border border-dumline-sand text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-dumline-crimson/10 flex items-center justify-center text-dumline-crimson">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-dumline-charcoal/50 tracking-wider">
                  Operational Standard
                </span>
                <h4 className="font-serif text-2xl font-bold text-dumline-charcoal">
                  {activeStage.duration}
                </h4>
              </div>
              <p className="text-[11px] text-dumline-charcoal/70">
                Never hurried or microwaved. Every handi is prepared strictly to recipe order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

