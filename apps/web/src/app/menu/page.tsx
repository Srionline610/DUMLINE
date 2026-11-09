import React from 'react';
import MenuCatalog from '../../components/customer/MenuCatalog';

export const metadata = {
  title: 'Royal Menu | Dumline — The Modern Royal Kitchen',
  description:
    'Explore authentic Hyderabadi Dum Biryani, Gosht Korma, Mirchi Ka Salan, Double Ka Meetha, and Nizami kebabs crafted by master Khansamas.',
};

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-dumline-ivory py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MenuCatalog />
      </div>
    </div>
  );
}

