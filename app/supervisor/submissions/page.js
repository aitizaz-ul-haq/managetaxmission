import { Suspense } from 'react';
import SupervisorRecords from '../../../components/supervisor/SupervisorRecords';

export default function SupervisorSubmissionsPage() {
  return <Suspense fallback={<div className="page-content" role="status">Loading submissions…</div>}><SupervisorRecords /></Suspense>;
}
