import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import SwitchOutletModal from '../components/common/SwitchOutletModal';
import CartDrawer from '../components/common/CartDrawer';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dumline — The Modern Royal Kitchen | Authentic Hyderabadi Biryani',
  description:
    'Experience the art of authentic Hyderabadi Dum Biryani and Nizami heritage cuisine, prepared with age-old culinary techniques and modern precision across Hyderabad.',
  keywords: [
    'Hyderabadi Biryani',
    'Dum Biryani',
    'Dumline',
    'Royal Kitchen',
    'Hyderabad Food Delivery',
    'Jubilee Hills Biryani',
    'Banjara Hills Biryani',
    'Gachibowli Biryani',
  ],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased bg-dumline-ivory text-dumline-charcoal min-h-screen flex flex-col selection:bg-dumline-crimson/20 selection:text-dumline-crimson">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <SwitchOutletModal />
        <CartDrawer />
      </body>
    </html>
  );
}

