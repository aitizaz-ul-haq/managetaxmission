export function validateUser(data, isNew = false) {
  const errors = [];

  if (!data.fullName?.trim()) errors.push('Full name is required');
  if (!data.email?.trim()) errors.push('Email is required');
  if (isNew && !data.password?.trim()) errors.push('Password is required');
  if (isNew && data.password && data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  const validRoles = ['super_admin', 'company_user'];
  if (!data.role || !validRoles.includes(data.role)) {
    errors.push('Valid role is required');
  }

  if (data.role === 'company_user' && !data.companyId) {
    errors.push('Company is required for company users');
  }

  return errors;
}
