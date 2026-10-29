'use client';

import PortalSidebar from './PortalSidebar';

const navItems = [
  { href: '/company/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/company/submissions/new', label: 'New Submission', icon: 'submissions' },
  { href: '/company/invoice-items', label: 'Invoice Items', icon: 'company' },
  { href: '/company/records', label: 'Submissions', icon: 'submissions', matchPrefixes: ['/company/submissions/'] },
  { href: '/company/fbr-records', label: 'FBR Invoices', icon: 'database' },
  { href: '/company/profile', label: 'My Profile', icon: 'user' },
];

export default function CompanySidebar(props) {
  return <PortalSidebar items={navItems} {...props} />;
}
