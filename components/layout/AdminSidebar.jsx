'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminIcon from '../admin/AdminIcon';
import styles from './AdminSidebar.module.css';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/companies', label: 'Companies', icon: 'company' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/submissions', label: 'All Submissions', icon: 'submissions' },
  { href: '/admin/reference-data', label: 'Reference Data', icon: 'database' },
];

export default function AdminSidebar({ open = false, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const sidebar = sidebarRef.current;
    const focusFrame = requestAnimationFrame(() => sidebar?.querySelector('a[aria-current="page"]')?.focus());

    function handleKey(event) {
      if (event.key === 'Escape') onClose?.();
      if (event.key !== 'Tab') return;
      const controls = [...sidebar.querySelectorAll('a, button')].filter((element) => element.offsetParent !== null && !element.disabled);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }

    document.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open, onClose]);

  return (
    <aside id="admin-sidebar" ref={sidebarRef} className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      <div className={styles.logo}>
        <div className={styles.logoFrame}><Image
          src="/images/Mnagae_taxmission_logo_new.png"
          alt="Manage Taxmission"
          width={1448}
          height={1086}
          sizes="185px"
          className={styles.logoImg}
          priority
        /></div>
        <span className={styles.logoSub}>Admin Portal</span>
        <button type="button" className={styles.closeButton} aria-label="Close navigation" onClick={onClose}><AdminIcon name="close" /></button>
      </div>

      <nav aria-label="Admin navigation">
      <ul className={styles.navList}>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}
              onClick={onClose}
              className={`${styles.navLink} ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? styles.active : ''}`}
            >
              <AdminIcon name={item.icon} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      </nav>

      <div className={styles.userSection}>
        <div className={styles.userIdentity}>
          <span className={styles.avatar}><AdminIcon name="user" /></span>
          <div><p className={styles.userName}>{user?.fullName || 'Super Admin'}</p><p className={styles.userRole}>Super Admin</p></div>
        </div>
        <button type="button" onClick={logout} className={styles.logoutBtn}>
          <AdminIcon name="logout" size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
