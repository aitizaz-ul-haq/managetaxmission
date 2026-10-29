'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import CompanySidebar from './CompanySidebar';
import SupervisorSidebar from './SupervisorSidebar';
import Topbar from './Topbar';
import theme from '../portal/PortalTheme.module.css';
import styles from './PortalShell.module.css';

export default function PortalShell({ supervisor = false, children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const portal = supervisor ? 'supervisor' : 'company';
  const Sidebar = supervisor ? SupervisorSidebar : CompanySidebar;

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

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

  return (
    <div className={`${theme.portal} ${styles.shell}`}>
      <a href={`#${portal}-content`} className={styles.skipLink}>Skip to content</a>
      {sidebarOpen && <button type="button" className={styles.backdrop} aria-label="Close navigation" tabIndex={-1} onClick={closeSidebar} />}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />
      <div className={styles.content} inert={sidebarOpen ? '' : undefined}>
        <Topbar supervisor={supervisor} sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
        <main id={`${portal}-content`} tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
