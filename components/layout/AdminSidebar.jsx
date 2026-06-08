'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminSidebar.module.css';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/companies', label: 'Companies' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/submissions', label: 'All Submissions' },
  { href: '/admin/reference-data', label: 'Reference Data' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.logo}>
        <Image
          src="/images/taxmissionlogo.png"
          alt="Manage Taxmission"
          width={150}
          height={66}
          className={styles.logoImg}
          priority
        />
        <span className={styles.logoSub}>Admin Portal</span>
      </div>

      <ul className={styles.navList}>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${styles.navLink} ${pathname.startsWith(item.href) ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.userSection}>
        <p className={styles.userName}>{user?.fullName}</p>
        <p className={styles.userRole}>Super Admin</p>
        <button onClick={logout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
}
