'use client';
import { useRouter } from 'next/navigation';
import UserForm from '../../../../components/admin/UserForm';

export default function NewUserPage() {
  const router = useRouter();

  async function handleSave(data) {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw json.errors || [json.error];
    router.push('/admin/users');
  }

  return (
    <>
      <div className="page-content">
        <div className="breadcrumb">
          <a href="/admin/users">Users</a>
          <span>/</span>
          <span>Add Users</span>
        </div>
        <div className="page-header">
          <h1 className="page-title">Add Users</h1>
        </div>
        <UserForm onSave={handleSave} onCancel={() => router.push('/admin/users')} isNew />
      </div>
    </>
  );
}
