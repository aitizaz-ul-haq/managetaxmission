import { Suspense } from 'react';
import SupervisorRecords from '../../../components/supervisor/SupervisorRecords';

export default function SupervisorFbrInvoicesPage() {
  return <Suspense fallback={<div className="page-content" role="status">Loading FBR invoices…</div>}><SupervisorRecords invoices /></Suspense>;
}
