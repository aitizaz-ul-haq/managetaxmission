'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/layout/AdminSidebar';
import Topbar from '../../components/layout/Topbar';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'super_admin') {
      router.replace('/company/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="loading-spinner"><p>Loading…</p></div>;
  }

  if (!user || user.role !== 'super_admin') return null;

  return (
    <div className="app-shell">
      <AdminSidebar />
      <div className="main-content">
        <Topbar title="Admin Control Panel" />
        {children}
      </div>
    </div>
  );
}
