'use client';
import { useRouter } from 'next/navigation';
import CompanyForm from '../../../../components/admin/CompanyForm';

export default function NewCompanyPage() {
  const router = useRouter();

  async function handleSave(data) {
    const res = await fetch('/api/admin/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw json.errors || [json.error];
    router.push('/admin/companies');
  }

  return (
    <>
      <div className="page-content">
        <div className="breadcrumb">
          <a href="/admin/companies">Companies</a>
          <span>/</span>
          <span>Register New</span>
        </div>
        <div className="page-header">
          <h1 className="page-title">Register New Company</h1>
        </div>
        <CompanyForm onSave={handleSave} onCancel={() => router.push('/admin/companies')} />
      </div>
    </>
  );
}
