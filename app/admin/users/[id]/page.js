'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import UserForm from '../../../../components/admin/UserForm';

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(data) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        companyId: data.companyId?._id || data.companyId,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw json.errors || [json.error];
    setSuccess('User updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  }

  if (loading) return <div className="loading-spinner"><p>Loading…</p></div>;

  const formData = user
    ? { ...user, companyId: user.companyId?._id || user.companyId || '', password: '' }
    : null;

  return (
    <>
      <div className="page-content">
        <div className="breadcrumb">
          <a href="/admin/users">Users</a>
          <span>/</span>
          <span>{user?.fullName}</span>
        </div>
        <div className="page-header">
          <h1 className="page-title">Edit User</h1>
        </div>
        {success && <div className="alert alert-success">{success}</div>}
        {formData && (
          <UserForm
            initialData={formData}
            onSave={handleSave}
            onCancel={() => router.push('/admin/users')}
          />
        )}
      </div>
    </>
  );
}
