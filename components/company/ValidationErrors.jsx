export default function ValidationErrors({ errors }) {
  if (!errors || !errors.length) return null;

  return (
    <div className="alert alert-error">
      <strong>Validation Errors:</strong>
      <ul style={{ marginTop: '0.5rem' }}>
        {errors.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}
