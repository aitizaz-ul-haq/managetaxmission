export function validateCompany(data) {
  const errors = [];

  if (!data.companyName?.trim()) errors.push('Company name is required');
  if (!data.legalName?.trim()) errors.push('Legal name is required');
  if (!data.ntn?.trim()) errors.push('NTN is required');
  if (!data.province?.trim()) errors.push('Province is required');
  if (!data.address?.trim()) errors.push('Address is required');

  const accountant = data.accountant || {};
  const supervisor = data.supervisor || {};

  if (!accountant.fullName?.trim()) errors.push('Accountant name is required');
  if (!accountant.email?.trim()) errors.push('Accountant email is required');

  if (!supervisor.fullName?.trim()) errors.push('Supervisor name is required');
  if (!supervisor.email?.trim()) errors.push('Supervisor email is required');

  if (
    accountant.email &&
    supervisor.email &&
    accountant.email.toLowerCase().trim() === supervisor.email.toLowerCase().trim()
  ) {
    errors.push('Accountant and supervisor must have different emails');
  }

  const validStatuses = ['active', 'inactive', 'suspended'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('Invalid status');
  }

  return errors;
}
