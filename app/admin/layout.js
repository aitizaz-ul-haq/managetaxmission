'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminTopbar from '../../components/layout/AdminTopbar';
import { getDashboardPath } from '../../lib/auth/dashboardPath';
import styles from './admin-theme.module.css';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 821px)');
    const handleResize = () => { if (desktop.matches) setSidebarOpen(false); };
    desktop.addEventListener('change', handleResize);
    return () => desktop.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'super_admin') {
      router.replace(getDashboardPath(user));
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="loading-spinner"><p>Loading…</p></div>;
  }

  if (!user || user.role !== 'super_admin') return null;

  return (
    <div className={`app-shell ${styles.shell}`}>
      <a href="#admin-content" className={styles.skipLink}>Skip to content</a>
      {sidebarOpen && <button type="button" className={styles.backdrop} onClick={closeSidebar} aria-label="Close navigation" tabIndex={-1} />}
      <AdminSidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className={`main-content ${styles.content}`}>
        <AdminTopbar sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
        <main id="admin-content" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
