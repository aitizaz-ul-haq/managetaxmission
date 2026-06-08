export default function PayloadPreview({ payload }) {
  if (!payload) return null;

  return (
    <div className="form-card">
      <h3 className="form-section-title">FBR Payload Preview</h3>
      <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
        This JSON will be sent to the FBR API when the endpoint is connected.
      </p>
      <pre style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1.25rem',
        borderRadius: 'var(--radius-sm)',
        overflowX: 'auto',
        fontSize: '0.8rem',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}>
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
}
