export default function ReferenceDataTable({ data, onEdit, onDelete }) {
  if (!data.length) {
    return (
      <div className="table-wrapper">
        <div className="table-empty"><h3>No items found</h3><p>Add reference data to populate dropdowns.</p></div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Label</th>
            <th>Value</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item._id}>
              <td><span style={{ textTransform: 'capitalize' }}>{item.type?.replace(/_/g, ' ')}</span></td>
              <td>{item.label}</td>
              <td>{String(item.value)}</td>
              <td><span className={`status-badge ${item.status}`}>{item.status}</span></td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="button button-sm button-secondary" onClick={() => onEdit(item)}>Edit</button>
                  <button className="button button-sm button-danger" onClick={() => onDelete(item._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
