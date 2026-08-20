export function getFbrInvoiceStatus(recordOrEnvelope) {
  const payload = recordOrEnvelope?.fbrResponse || recordOrEnvelope || {};
  if (!payload || typeof payload !== 'object') return '';

  const validation = payload.validationResponse || payload;

  const directStatus = validation?.status || payload?.status || '';
  if (typeof directStatus === 'string' && directStatus.trim()) {
    return directStatus.trim();
  }

  const statusCode = validation?.statusCode || payload?.statusCode || '';
  if (typeof statusCode === 'string' && statusCode.trim()) {
    return statusCode.trim();
  }

  const list = Array.isArray(validation?.invoiceStatuses)
    ? validation.invoiceStatuses
    : Array.isArray(payload?.invoiceStatuses)
      ? payload.invoiceStatuses
      : [];

  const firstItem = list.find((item) => item && (item.status || item.statusCode));
  if (firstItem) {
    if (typeof firstItem.status === 'string' && firstItem.status.trim()) return firstItem.status.trim();
    if (typeof firstItem.statusCode === 'string' && firstItem.statusCode.trim()) return firstItem.statusCode.trim();
  }

  return '';
}

export function getFbrStatusBadgeClass(status) {
  const normalized = String(status || '').trim().toLowerCase();

  if (['valid', 'success', 'submitted'].includes(normalized)) return 'submitted';
  if (['invalid', 'failed', 'rejected', 'error'].includes(normalized)) return 'failed';
  if (normalized === 'warning') return 'warning';
  return 'pending';
}

export function formatFbrStatusLabel(status) {
  const value = String(status || '').trim();
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
