import React from 'react';
import LiveOrderTracker from '../../../components/customer/LiveOrderTracker';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Order Status & Live Tracking | Dumline',
  description: 'Live order tracking with real-time Socket.IO status and AI preparation time updates.',
};

export default async function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = await params;

  return (
    <div className="min-h-screen bg-dumline-sand/20 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <LiveOrderTracker initialOrderId={resolvedParams.id} />
      </div>
    </div>
  );
}

