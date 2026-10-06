export default function Table({ columns, data, loading, error, emptyMessage = "No data available", onRowClick }) {
  if (loading) {
    return (
      <div className="card">
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 100 }} className="skeleton skeleton-text" />
            <div style={{ width: 120 }} className="skeleton skeleton-text" />
            <div style={{ width: 80 }} className="skeleton skeleton-text" />
            <div style={{ width: 120 }} className="skeleton skeleton-text" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--color-danger)" }}>
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3 className="empty-state-title">{emptyMessage}</h3>
      </div>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={row._id || i} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((col) => (
              <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}