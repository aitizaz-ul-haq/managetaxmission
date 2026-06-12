export function validateUser(data, isNew = false) {
  const errors = [];

  if (!data.fullName?.trim()) errors.push('Full name is required');
  if (!data.email?.trim()) errors.push('Email is required');

  const validRoles = ['super_admin', 'company_user'];
  if (!data.role || !validRoles.includes(data.role)) {
    errors.push('Valid role is required');
  }

  const isSupervisor = data.role === 'company_user' && data.personnelType === 'supervisor';

  if (data.role === 'company_user') {
    if (!['accountant', 'supervisor'].includes(data.personnelType)) {
      errors.push('Personnel type (accountant or supervisor) is required');
    }
    if (!data.companyId) {
      errors.push('Company is required for company users');
    }
  }

  // Supervisors are reporting-only contacts and do not log in, so no password needed.
  if (!isSupervisor) {
    if (isNew && !data.password?.trim()) errors.push('Password is required');
    if (isNew && data.password && data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
  }

  return errors;
}
