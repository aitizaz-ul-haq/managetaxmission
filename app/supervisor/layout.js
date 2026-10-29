'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPath, isSupervisor } from '../../lib/auth/dashboardPath';
import PortalShell from '../../components/layout/PortalShell';

export default function SupervisorLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isSupervisor(user)) router.replace(getDashboardPath(user));
  }, [user, loading, router]);

  if (loading) return <div className="loading-spinner"><p>Loading…</p></div>;
  if (!isSupervisor(user)) return null;

  return <PortalShell supervisor>{children}</PortalShell>;
}
