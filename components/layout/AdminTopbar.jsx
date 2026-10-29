'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AdminIcon from '../admin/AdminIcon';
import styles from './AdminTopbar.module.css';

export default function AdminTopbar({ sidebarOpen, onOpenSidebar }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const activityButtonRef = useRef(null);
  const accountButtonRef = useRef(null);
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (sidebarOpen) return;
        inputRef.current?.focus();
        setPanel('search');
      }
      if (event.key === 'Escape' && panel && !sidebarOpen) {
        event.preventDefault();
        if (panel === 'search') inputRef.current?.focus();
        else if (panel === 'activity') activityButtonRef.current?.focus();
        else accountButtonRef.current?.focus();
        setPanel(null);
      }
    }
    function handleOutside(event) {
      if (!headerRef.current?.contains(event.target)) setPanel(null);
    }
    document.addEventListener('keydown', handleShortcut);
    document.addEventListener('pointerdown', handleOutside);
    return () => {
      document.removeEventListener('keydown', handleShortcut);
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, [panel, sidebarOpen]);

  useEffect(() => { setPanel(null); setQuery(''); }, [pathname]);

  useEffect(() => {
    let active = true;
    const term = query.trim();
    setResults([]);
    setSearchError('');
    setSearchLoading(term.length >= 2);
    if (term.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(term)}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Search is unavailable. Please try again.');
        if (active) setResults(data.results || []);
      } catch (error) {
        if (active) setSearchError(error?.message || 'Search is unavailable. Please try again.');
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    if (panel !== 'activity') return;
    let active = true;
    setActivityLoading(true);
    setActivityError('');
    async function loadActivity() {
      try {
        const response = await fetch('/api/admin/stats', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Activity is unavailable.');
        if (active) setActivity(data.recentSubmissions || []);
      } catch (error) {
        if (active) setActivityError(error?.message || 'Activity is unavailable.');
      } finally {
        if (active) setActivityLoading(false);
      }
    }
    loadActivity();
    return () => { active = false; };
  }, [panel]);

  function handleSearchKey(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      resultsRef.current?.querySelector('a')?.focus();
    }
    if (event.key === 'Enter' && results.length) {
      event.preventDefault();
      setPanel(null);
      router.push(results[0].href);
    }
  }

  const initial = user?.fullName?.trim().charAt(0).toUpperCase() || 'S';

  return (
    <header ref={headerRef} className={styles.topbar}>
      <div className={styles.heading}>
        <button id="admin-menu-button" type="button" className={`${styles.iconButton} ${styles.menuButton}`} onClick={() => { setPanel(null); onOpenSidebar(); }} aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls="admin-sidebar"><AdminIcon name="menu" /></button>
        <p className={styles.title}>Admin Control Panel</p>
      </div>

      <div className={styles.search} role="search" aria-label="Search admin records">
        <AdminIcon name="search" size={19} />
        <input ref={inputRef} type="search" maxLength={100} value={query} onChange={(event) => { setQuery(event.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} onKeyDown={handleSearchKey} aria-label="Search companies, users and submissions" aria-controls="admin-search-results" placeholder="Search companies, users, submissions…" autoComplete="off" />
        <kbd>Ctrl + K</kbd>
        {panel === 'search' && (
          <div id="admin-search-results" ref={resultsRef} className={`${styles.popover} ${styles.searchPopover}`}>
            <p className={styles.popoverHeading}>Search records</p>
            <div role="status" className={styles.searchStatus}>{query.trim().length < 2 ? 'Type at least 2 characters to search.' : searchLoading ? 'Searching…' : searchError || (!results.length ? 'No matching records.' : `${results.length} results`)}</div>
            {!!results.length && <ul className={styles.results}>{results.map((result) => <li key={`${result.type}-${result.id}`}><Link href={result.href} onClick={() => setPanel(null)}><span className={styles.resultIcon}><AdminIcon name={result.type === 'company' ? 'company' : result.type === 'user' ? 'users' : 'submissions'} size={18} /></span><span><strong>{result.title}</strong><small>{result.type} · {result.description}</small></span><AdminIcon name="chevron" size={14} /></Link></li>)}</ul>}
          </div>
        )}
      </div>

      <div className={styles.tools}>
        <div className={styles.toolWrapper}>
          <button ref={activityButtonRef} type="button" className={styles.iconButton} aria-label="View submission activity" aria-expanded={panel === 'activity'} aria-controls="admin-activity" onClick={() => setPanel(panel === 'activity' ? null : 'activity')}><AdminIcon name="bell" size={22} /></button>
          {panel === 'activity' && <section id="admin-activity" className={`${styles.popover} ${styles.activityPopover}`} aria-label="Recent submission activity"><div className={styles.popoverHeading}>Recent activity <Link href="/admin/submissions" onClick={() => setPanel(null)}>View all</Link></div>{activityLoading ? <p className={styles.searchStatus} role="status">Loading activity…</p> : activityError ? <p className={styles.searchStatus} role="alert">{activityError}</p> : activity.length ? <ul className={styles.results}>{activity.map((record) => <li key={record.id}><Link href={`/admin/submissions/${record.id}`} onClick={() => setPanel(null)}><span className={styles.resultIcon}><AdminIcon name="submissions" size={18} /></span><span><strong>{record.companyName || 'Company submission'}</strong><small>{record.invoiceNumber || 'Submission'} · {String(record.status || 'pending').replace(/_/g, ' ')}</small></span></Link></li>)}</ul> : <p className={styles.searchStatus}>No submission activity yet.</p>}</section>}
        </div>
        <div className={styles.accountWrapper}>
          <button ref={accountButtonRef} type="button" className={styles.accountButton} aria-label={`Account menu for ${user?.fullName || 'Super Admin'}`} aria-expanded={panel === 'account'} aria-controls="admin-account" onClick={() => setPanel(panel === 'account' ? null : 'account')}>
            <span className={styles.avatar}>{initial}</span>
            <span className={styles.accountText}><strong>{user?.fullName || 'Super Admin'}</strong><small>Super Admin</small></span>
            <AdminIcon name="chevron" className={styles.caret} size={15} />
          </button>
          {panel === 'account' && <section id="admin-account" className={`${styles.popover} ${styles.accountPopover}`} aria-label="Admin account"><p className={styles.popoverHeading}>{user?.fullName || 'Super Admin'}</p><p className={styles.accountEmail}>{user?.email}</p><Link href="/admin/users" onClick={() => setPanel(null)}><AdminIcon name="users" size={17} />Manage users</Link><button type="button" onClick={logout}><AdminIcon name="logout" size={17} />Logout</button></section>}
        </div>
      </div>
    </header>
  );
}
