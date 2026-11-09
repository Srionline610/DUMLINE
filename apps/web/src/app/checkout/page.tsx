import React from 'react';
import CheckoutForm from '../../components/customer/CheckoutForm';

export const metadata = {
  title: 'Royal Checkout | Dumline — The Modern Royal Kitchen',
  description:
    'Complete your Hyderabadi Dum Biryani order with transparent inclusive GST pricing and simulated secure payment.',
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-dumline-sand/20 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CheckoutForm />
      </div>
    </div>
  );
}

