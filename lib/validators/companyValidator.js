export function validateCompany(data) {
  const errors = [];

  if (!data.companyName?.trim()) errors.push('Company name is required');
  if (!data.legalName?.trim()) errors.push('Legal name is required');
  if (!data.ntn?.trim()) errors.push('NTN is required');
  if (!data.province?.trim()) errors.push('Province is required');
  if (!data.address?.trim()) errors.push('Address is required');
  if (!data.contactPersonName?.trim()) errors.push('Contact person name is required');
  if (!data.contactPersonEmail?.trim()) errors.push('Contact person email is required');

  const validStatuses = ['active', 'inactive', 'suspended'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('Invalid status');
  }

  return errors;
}
