export const SUBMISSION_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'var(--color-muted)' },
  { value: 'validated', label: 'Validated', color: 'var(--color-primary-light)' },
  { value: 'ready_for_submission', label: 'Ready for submission', color: 'var(--color-warning)' },
  { value: 'submitted', label: 'Submitted', color: 'var(--color-success)' },
  { value: 'failed', label: 'Failed', color: 'var(--color-accent)' },
];

export const number = (value) => Number(value) || 0;
export const money = (value) => number(value).toLocaleString('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const count = (value) => number(value).toLocaleString('en-PK');
export const statusLabel = (status) => SUBMISSION_STATUSES.find((entry) => entry.value === status)?.label || status || 'Unknown';
export const show = (value) => value === undefined || value === null || value === '' ? '—' : value;

export function date(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return new Date(value).toLocaleString('en-PK', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Karachi',
  });
}

export function environment(value) {
  const normalized = String(value || '').toLowerCase();
  return ['production', 'sandbox'].includes(normalized) ? normalized : 'unspecified';
}

export function environmentLabel(value) {
  const normalized = environment(value);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

// Quote every cell, escape quotes, and neutralize spreadsheet formulas in text.
// Numbers stay numeric so financial columns retain their spreadsheet behavior.
export function csvCell(value) {
  let text = String(value ?? '');
  if (typeof value !== 'number' && (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename, rows) {
  const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
