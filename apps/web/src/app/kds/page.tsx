import React from 'react';
import KDSQueue from '../../components/kds/KDSQueue';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

export const metadata = {
  title: 'Kitchen Display System (KDS) | Dumline Royal Kitchen',
  description:
    'Dedicated high-contrast operational display for commercial kitchen staff with real-time station routing and overdue alerting.',
};

export default function KDSPage() {
  return (
    <ProtectedRoute allowedRoles={['KITCHEN_STAFF', 'OUTLET_MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-dumline-kds-bg text-dumline-kds-text">
        <KDSQueue />
      </div>
    </ProtectedRoute>
  );
}

