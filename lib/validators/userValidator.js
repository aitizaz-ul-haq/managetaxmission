export function validateUser(data, isNew = false) {
  const errors = [];

  if (!data.fullName?.trim()) errors.push('Full name is required');
  if (!data.email?.trim()) errors.push('Email is required');

  const validRoles = ['super_admin', 'company_user'];
  if (!data.role || !validRoles.includes(data.role)) {
    errors.push('Valid role is required');
  }

  if (data.role === 'company_user') {
    if (!['accountant', 'supervisor'].includes(data.personnelType)) {
      errors.push('Personnel type (accountant or supervisor) is required');
    }
    if (!data.companyId) {
      errors.push('Company is required for company users');
    }
  }

  if (isNew && (typeof data.password !== 'string' || !data.password.trim())) {
    errors.push('Password is required');
  } else if (data.password && (typeof data.password !== 'string' || !data.password.trim() || data.password.length < 8)) {
    errors.push('Password must be at least 8 characters');
  }

  if (data.status && !['active', 'inactive'].includes(data.status)) {
    errors.push('Invalid status');
  }

  return errors;
}
