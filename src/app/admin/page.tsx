import React from 'react';
import AdminDashboard from '@/components/AdminDashboard';

export const metadata = {
  title: 'Admin Control Center • UPRC Collector',
  description: 'Manage projects, dynamic categories, and workflow statuses for reviews, contributions, and bug reports.'
};

export default function AdminPage() {
  return (
    <div className="py-4">
      <AdminDashboard />
    </div>
  );
}
