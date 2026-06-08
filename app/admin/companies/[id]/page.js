'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CompanyForm from '../../../../components/admin/CompanyForm';

export default function EditCompanyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/admin/companies/${id}`)
      .then((r) => r.json())
      .then((d) => setCompany(d.company))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(data) {
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw json.errors || [json.error];
    setSuccess('Company updated successfully');
    setCompany(json.company);
    setTimeout(() => setSuccess(''), 3000);
  }

  if (loading) return <div className="loading-spinner"><p>Loading…</p></div>;

  return (
    <>
      <div className="page-content">
        <div className="breadcrumb">
          <a href="/admin/companies">Companies</a>
          <span>/</span>
          <span>{company?.companyName}</span>
        </div>
        <div className="page-header">
          <h1 className="page-title">Edit Company</h1>
        </div>
        {success && <div className="alert alert-success">{success}</div>}
        {company && (
          <CompanyForm
            initialData={company}
            onSave={handleSave}
            onCancel={() => router.push('/admin/companies')}
          />
        )}
      </div>
    </>
  );
}
