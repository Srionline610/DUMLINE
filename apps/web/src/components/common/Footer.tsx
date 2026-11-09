import React from 'react';
import Link from 'next/link';
import { DEMO_COMPLIANCE } from '../../lib/constants';
import { MapPin, Clock, Shield, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-dumline-sand bg-dumline-charcoal text-dumline-sand">
      {/* Brand & Culinary Philosophy Section */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand & Manifesto */}
          <div className="space-y-4">
            <div>
              <span className="font-serif text-3xl font-bold tracking-tight text-white">
                DUMLINE
              </span>
              <p className="text-[10px] uppercase tracking-[0.25em] text-dumline-saffron font-semibold">
                The Modern Royal Kitchen
              </p>
            </div>
            <p className="text-xs leading-relaxed text-dumline-sand/80">
              Preserving the slow-cooked culinary legacy of Hyderabadi royal kitchens. Sealed handis, fragrant aged basmati, whole spices, and patience—delivered directly to your home.
            </p>
            <div className="flex items-center gap-2 text-xs text-dumline-saffron">
              <Sparkles className="h-4 w-4" />
              <span>Dum Cooking: Sealed In Clay Handis</span>
            </div>
          </div>

          {/* Column 2: Hyderabad Outlets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Hyderabad Kitchen Outlets
            </h4>
            <ul className="space-y-2.5 text-xs text-dumline-sand/80">
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-dumline-saffron shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Kondapur</strong>
                  <p className="text-[11px] text-dumline-sand/60">Kondapur Main Rd • 7.0km Delivery Radius</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-dumline-saffron shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Gachibowli Cloud Kitchen</strong>
                  <p className="text-[11px] text-dumline-sand/60">Financial District Hub • 7.0km Delivery Radius</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-dumline-saffron shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Kukatpally</strong>
                  <p className="text-[11px] text-dumline-sand/60">Housing Board Colony • 7.0km Delivery Radius</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Hours & Operations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Service Timings & Standards
            </h4>
            <div className="space-y-2 text-xs text-dumline-sand/80">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-dumline-saffron" />
                <span>Lunch: 11:30 AM – 3:30 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-dumline-saffron" />
                <span>Dinner: 7:00 PM – 11:30 PM</span>
              </div>
              <div className="pt-2 text-[11px] text-dumline-sand/60">
                Minimum operational prep threshold: <strong>20 Minutes</strong> (ensures authentic slow steaming).
              </div>
              <div className="pt-2 flex flex-col gap-1 text-[11px]">
                <Link
                  href="/orders"
                  className="font-bold text-dumline-saffron hover:underline"
                >
                  📜 Track Previous Orders (My Orders) →
                </Link>
                <Link
                  href="/kds"
                  className="font-bold text-dumline-saffron hover:underline"
                >
                  ⚡ Open Kitchen Display System (KDS) →
                </Link>
              </div>
            </div>
          </div>

          {/* Column 4: Compliance & Assignment Disclosure */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-dumline-saffron" />
              <span>Assessment & Standards</span>
            </h4>
            <div className="space-y-2 text-[11px] text-dumline-sand/70 bg-white/5 p-3 rounded-xl border border-white/10">
              <p>
                <strong>{DEMO_COMPLIANCE.fssaiNumber}</strong>
              </p>
              <p>
                <strong>GSTIN:</strong> {DEMO_COMPLIANCE.gstin}
              </p>
              <p className="text-[10px] text-dumline-sand/50 pt-1">
                IsoCode Labs Software Engineering Intern Assessment Prototype. All delivery simulations, payment triggers, and registrations represent testing environments.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-dumline-sand/50 gap-4">
          <p>© {new Date().getFullYear()} Dumline. The Modern Royal Kitchen. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/menu" className="hover:text-white transition-colors">
              Menu
            </Link>
            <Link href="/kds" className="hover:text-white transition-colors">
              Kitchen Display
            </Link>
            <Link href="/manager" className="hover:text-white transition-colors">
              Manager
            </Link>
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

