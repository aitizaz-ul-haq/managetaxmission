'use client';

import PortalSidebar from './PortalSidebar';

const navItems = [
  { href: '/supervisor/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/supervisor/submissions', label: 'Submissions', icon: 'submissions' },
  { href: '/supervisor/fbr-invoices', label: 'FBR Invoices', icon: 'submissions' },
  { href: '/supervisor/profile', label: 'My Profile', icon: 'user' },
];

export default function SupervisorSidebar(props) {
  return <PortalSidebar supervisor items={navItems} {...props} />;
}
