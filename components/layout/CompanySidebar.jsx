'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import styles from './CompanySidebar.module.css';

const navItems = [
  { href: '/company/dashboard', label: 'Dashboard' },
  { href: '/company/submissions/new', label: 'New Submission' },
  { href: '/company/invoice-items', label: 'Invoice Items' },
  { href: '/company/records', label: 'Records' },
  { href: '/company/profile', label: 'My Profile' },
];

export default function CompanySidebar() {
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
        <span className={styles.logoSub}>Company Portal</span>
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
        <p className={styles.userRole}>{user?.companyName || 'Company User'}</p>
        <button onClick={logout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
}
