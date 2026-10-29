'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import AdminIcon from '../admin/AdminIcon';
import styles from './Topbar.module.css';

const buyerName = (record) => record.itemList?.[0]?.buyerBusinessName || record.buyerBusinessName || 'Submission';
const invoiceNumber = (record) => record.itemList?.[0]?.invoiceNumber || record.invoiceNumber || '';
const statusLabel = (status) => String(status || 'draft').replace(/_/g, ' ');

export default function Topbar({ title, supervisor = false, sidebarOpen = false, onOpenSidebar }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
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
  const [activityVersion, setActivityVersion] = useState(0);
  const portal = supervisor ? 'supervisor' : 'company';
  const recordsHref = supervisor ? '/supervisor/submissions' : '/company/records';
  const role = supervisor ? 'Supervisor' : 'Accountant';
  const leftTitle = title || user?.companyName || role + ' Portal';

  useEffect(() => {
    function handleKey(event) {
      if (supervisor && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
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
    document.addEventListener('keydown', handleKey);
    document.addEventListener('pointerdown', handleOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('pointerdown', handleOutside);
    };
  }, [panel, sidebarOpen, supervisor]);

  useEffect(() => { setPanel(null); setQuery(''); }, [pathname]);
  useEffect(() => { if (sidebarOpen) setPanel(null); }, [sidebarOpen]);

  useEffect(() => {
    if (!supervisor) return;
    let active = true;
    const term = query.trim().toLowerCase();
    setResults([]);
    setSearchError('');
    setSearchLoading(term.length >= 2);
    if (term.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/supervisor/submissions', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Search is unavailable. Please try again.');
        const matches = (data.submissions || []).filter((record) => [
          record._id, buyerName(record), invoiceNumber(record), record.status,
          statusLabel(record.status), record.scenarioId, record.fbrEnvironment,
          record.taxPeriodMonth + '/' + record.taxPeriodYear,
        ].join(' ').toLowerCase().includes(term)).slice(0, 8);
        if (active) setResults(matches);
      } catch (error) {
        if (active) setSearchError(error?.message || 'Search is unavailable. Please try again.');
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, supervisor]);

  useEffect(() => {
    if (panel !== 'activity') return;
    let active = true;
    setActivityLoading(true);
    setActivityError('');
    async function loadActivity() {
      try {
        const response = await fetch('/api/' + portal + '/stats', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Activity is unavailable.');
        if (active) setActivity(data.recent || []);
      } catch (error) {
        if (active) setActivityError(error?.message || 'Activity is unavailable.');
      } finally {
        if (active) setActivityLoading(false);
      }
    }
    loadActivity();
    return () => { active = false; };
  }, [panel, portal, activityVersion]);

  function recordHref(id) {
    return recordsHref + '?record=' + encodeURIComponent(id);
  }

  function handleSearchKey(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      resultsRef.current?.querySelector('a')?.focus();
    }
    if (event.key === 'Enter' && results.length) {
      event.preventDefault();
      setPanel(null);
      router.push(recordHref(results[0]._id));
    }
  }

  const initial = user?.fullName?.trim().charAt(0).toUpperCase() || role.charAt(0);

  return (
    <header ref={headerRef} className={styles.topbar}>
      <div className={styles.heading}>
        <button id={portal + '-menu-button'} type="button" className={styles.iconButton + ' ' + styles.menuButton} aria-label="Open navigation" aria-expanded={sidebarOpen} aria-controls={portal + '-sidebar'} onClick={() => { setPanel(null); onOpenSidebar?.(); }}><AdminIcon name="menu" /></button>
        <p className={styles.title} title={leftTitle}>{leftTitle}</p>
      </div>
      {supervisor && <div className={styles.search} role="search" aria-label="Search company submissions">
        <AdminIcon name="search" size={19} />
        <input ref={inputRef} type="search" maxLength={100} value={query} onChange={(event) => { setQuery(event.target.value); setPanel('search'); }} onFocus={() => setPanel('search')} onKeyDown={handleSearchKey} aria-label="Search submissions, buyers and invoice numbers" aria-controls="supervisor-search-results" placeholder="Search submissions, buyers, invoice numbers…" autoComplete="off" />
        <kbd>Ctrl + K</kbd>
        {panel === 'search' && <div id="supervisor-search-results" ref={resultsRef} className={styles.popover + ' ' + styles.searchPopover}>
          <p className={styles.popoverHeading}>Search submissions</p>
          <p className={styles.searchStatus} role="status">{query.trim().length < 2 ? 'Type at least 2 characters to search.' : searchLoading ? 'Searching…' : searchError || (!results.length ? 'No matching submissions.' : results.length + ' results')}</p>
          {!!results.length && <ul className={styles.results}>{results.map((record) => <li key={record._id}><Link href={recordHref(record._id)} onClick={() => setPanel(null)}><span className={styles.resultIcon}><AdminIcon name="submissions" size={18} /></span><span><strong>{buyerName(record)}</strong><small>{invoiceNumber(record) || record.taxPeriodMonth + '/' + record.taxPeriodYear} · {statusLabel(record.status)}</small></span><AdminIcon name="chevron" size={14} /></Link></li>)}</ul>}
          {query.trim().length >= 2 && <Link className={styles.allResults} href={recordsHref + '?search=' + encodeURIComponent(query.trim())} onClick={() => setPanel(null)}>View all matching submissions <AdminIcon name="chevron" size={13} /></Link>}
        </div>}
      </div>}
      <div className={styles.tools}>
        <div className={styles.toolWrapper}>
          <button ref={activityButtonRef} type="button" className={styles.iconButton} aria-label="View submission activity" aria-expanded={panel === 'activity'} aria-controls={portal + '-activity'} onClick={() => setPanel(panel === 'activity' ? null : 'activity')}><AdminIcon name="bell" size={22} /></button>
          {panel === 'activity' && <section id={portal + '-activity'} className={styles.popover + ' ' + styles.activityPopover} aria-label="Recent submission activity">
            <div className={styles.popoverHeading}>Recent activity <Link href={recordsHref} onClick={() => setPanel(null)}>View all</Link></div>
            {activityLoading ? <p className={styles.searchStatus} role="status">Loading activity…</p> : activityError ? <div className={styles.searchStatus}><p role="alert">{activityError}</p><button type="button" className={styles.retryButton} onClick={() => setActivityVersion((value) => value + 1)}>Try again</button></div> : activity.length ? <ul className={styles.results}>{activity.map((record) => <li key={record.id}><Link href={recordHref(record.id)} onClick={() => setPanel(null)}><span className={styles.resultIcon}><AdminIcon name="submissions" size={18} /></span><span><strong>{record.buyer || 'Submission'}</strong><small>{record.period} · {statusLabel(record.status)}</small></span></Link></li>)}</ul> : <p className={styles.searchStatus}>No submission activity yet.</p>}
          </section>}
        </div>
        <div className={styles.accountWrapper}>
          <button ref={accountButtonRef} type="button" className={styles.accountButton} aria-label={'Account menu for ' + (user?.fullName || role)} aria-expanded={panel === 'account'} aria-controls={portal + '-account'} onClick={() => setPanel(panel === 'account' ? null : 'account')}>
            <span className={styles.avatar}>{initial}</span>
            <span className={styles.accountText}><strong>{user?.fullName || role}</strong><small title={supervisor ? role : user?.companyName}>{supervisor ? role : user?.companyName || role}</small></span>
            <AdminIcon name="chevron" className={styles.caret} size={15} />
          </button>
          {panel === 'account' && <section id={portal + '-account'} className={styles.popover + ' ' + styles.accountPopover} aria-label={role + ' account'}>
            <p className={styles.popoverHeading}>{user?.fullName || role}</p>
            <p className={styles.accountEmail}>{user?.email}</p>
            <Link href={'/' + portal + '/profile'} onClick={() => setPanel(null)}><AdminIcon name="user" size={17} />My profile</Link>
            <button type="button" onClick={logout}><AdminIcon name="logout" size={17} />Logout</button>
          </section>}
        </div>
      </div>
    </header>
  );
}
