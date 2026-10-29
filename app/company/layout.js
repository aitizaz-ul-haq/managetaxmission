'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import PortalShell from '../../components/layout/PortalShell';
import { getDashboardPath, isSupervisor } from '../../lib/auth/dashboardPath';

export default function CompanyLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'company_user' || isSupervisor(user)) {
      router.replace(getDashboardPath(user));
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="loading-spinner"><p>Loading…</p></div>;
  }

  if (!user || user.role !== 'company_user' || isSupervisor(user)) return null;

  return <PortalShell>{children}</PortalShell>;
}
