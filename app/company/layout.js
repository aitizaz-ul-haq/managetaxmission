'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import CompanySidebar from '../../components/layout/CompanySidebar';
import Topbar from '../../components/layout/Topbar';

export default function CompanyLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'company_user') {
      router.replace('/admin/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="loading-spinner"><p>Loading…</p></div>;
  }

  if (!user || user.role !== 'company_user') return null;

  return (
    <div className="app-shell">
      <CompanySidebar />
      <div className="main-content">
        <Topbar />
        {children}
      </div>
    </div>
  );
}
