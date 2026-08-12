export default function ValidationErrors({ errors }) {
  if (!errors || !errors.length) return null;

  const issueCount = errors.length;

  return (
    <div
      aria-live="polite"
      style={{
        marginTop: '1rem',
        marginBottom: '1rem',
        padding: '1rem 1.1rem',
        borderRadius: '12px',
        border: '1px solid rgba(220, 53, 69, 0.35)',
        background: 'linear-gradient(180deg, rgba(255, 245, 245, 1), rgba(255, 255, 255, 1))',
        boxShadow: '0 8px 18px rgba(220, 53, 69, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#dc3545', boxShadow: '0 0 0 4px rgba(220, 53, 69, 0.12)' }} />
        <strong style={{ fontSize: '0.96rem', color: '#a61b2d' }}>
          Please fix the following {issueCount} validation issue{issueCount > 1 ? 's' : ''} before submitting.
        </strong>
      </div>

      <div style={{ fontSize: '0.83rem', color: '#4b5563', marginBottom: '0.7rem' }}>
        Review the fields listed below and update the invoice details in the table above.
      </div>

      <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#1f2937' }}>
        {errors.map((e, i) => (
          <li key={i} style={{ marginBottom: '0.45rem', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>{e}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
