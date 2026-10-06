export default function Card({ title, subtitle, footer, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && (
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}