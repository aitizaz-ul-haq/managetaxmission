'use client';
import { useAuth } from '../../context/AuthContext';
import styles from './Topbar.module.css';

export default function Topbar({ title }) {
  const { user } = useAuth();

  const leftTitle = title || (user?.companyName ?? '');

  return (
    <header className={styles.topbar}>
      <h2 className={styles.title}>{leftTitle}</h2>
      <div className={styles.userInfo}>
        <span className={styles.userName}>{user?.fullName}</span>
        <span className={styles.userRole}>
          {user?.role === 'super_admin' ? 'Super Admin' : (user?.companyName ?? 'Company User')}
        </span>
      </div>
    </header>
  );
}
