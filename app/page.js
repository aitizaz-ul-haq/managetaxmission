'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../lib/auth/dashboardPath';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(getDashboardPath(user));
  }, [user, loading, router]);

  return (
    <div className="loading-spinner">
      <p>Loading Manage Taxmission…</p>
    </div>
  );
}
