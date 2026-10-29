export default function AdminIcon({ name, size = 22, ...props }) {
  const paths = {
    dashboard: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z" />,
    company: <><path d="M4 21V3h12v18M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4M9 21v-3h2v3" /></>,
    users: <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v2M2 21h14" /></>,
    submissions: <path d="M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h6" />,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0M4 17c0 4 16 4 16 0" /></>,
    logout: <path d="M9 4H4v16h5M9 12h12m-4-4 4 4-4 4" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>,
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10M10 21h4" />,
    check: <><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z" /><path d="m8 12 3 3 5-6" /></>,
    send: <path d="m2 10 20-8-6 20-5-8ZM11 14 22 2" />,
    failed: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    verified: <><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z" fill="currentColor" stroke="none" /><path d="m8 12 3 3 5-6" stroke="#126a61" strokeWidth="2.3" /></>,
    paperPlane: <><path d="m2 10 20-8-6 20-5-8Z" fill="currentColor" stroke="none" /><path d="M11 14 22 2" stroke="#3058aa" /></>,
    failedUser: <><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><circle cx="10.5" cy="8.5" r="3" fill="#86415e" stroke="none" /><path d="M5 18a5.5 5.5 0 0 1 9-4" stroke="#86415e" strokeWidth="2.5" /><path d="m14 13 5 5m0-5-5 5" stroke="#86415e" strokeWidth="2" /></>,
    coins: <><ellipse cx="11" cy="5" rx="8" ry="3" fill="currentColor" fillOpacity=".4" /><path d="M3 5v12c0 4 16 4 16 0V5M3 10c0 4 16 4 16 0M3 15c0 4 16 4 16 0M17 12h4v9h-4" /><path d="M15 19h6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6M17 2v6M3 10h18M7 14h2M15 14h2M7 18h2M15 18h2" /></>,
    bars: <><rect x="3" y="12" width="4" height="9" rx=".5" fill="currentColor" fillOpacity=".35" /><rect x="10" y="4" width="4" height="17" rx=".5" fill="currentColor" fillOpacity=".65" /><rect x="17" y="8" width="4" height="13" rx=".5" fill="currentColor" fillOpacity=".4" /></>,
    receipt: <><path d="M5 3h14v19l-3-2-4 2-4-2-3 2ZM8 7h8M8 11h2M14 11h2M8 15h2M14 15h2" /></>,
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 22v-3a8 8 0 0 1 16 0v3Z" /></>,
    arrowUp: <path d="M12 20V4m-6 6 6-6 6 6" />,
    arrowDown: <path d="M12 4v16m-6-6 6 6 6-6" />,
  };

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.submissions}</svg>;
}
