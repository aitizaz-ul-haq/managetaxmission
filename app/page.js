'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'super_admin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/company/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="loading-spinner">
      <p>Loading Manage Taxmission…</p>
    </div>
  );
}
