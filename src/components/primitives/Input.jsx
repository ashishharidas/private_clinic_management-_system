export default function Input({
  label,
  error,
  helperText,
  icon,
  type = "text",
  ...props
}) {
  const hasError = !!error;
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: "0.95rem" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-ink-soft)",
              fontSize: 18,
            }}
          >
            {icon}
          </span>
        )}
        <input
          type={type}
          className="form-input"
          style={{ paddingLeft: icon ? 36 : 12, paddingRight: 12 }}
          aria-describedby={helperText ? "input-help" : undefined}
          aria-invalid={hasError}
          {...props}
        />
      </div>
      {helperText && (
        <p id="input-help" style={{ fontSize: "0.8rem", marginTop: 4, color: "var(--color-ink-soft)" }}>
          {helperText}
        </p>
      )}
      {error && (
        <p style={{ fontSize: "0.8rem", marginTop: 4, color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}