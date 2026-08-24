function AuthVisual({ heading, description, features }) {
  return (
    <aside className="auth-visual">
      <div className="auth-visual__brand">
        <span className="auth-visual__brand-mark" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />

            <rect x="14" y="3" width="7" height="7" rx="1.5" />

            <rect x="3" y="14" width="7" height="7" rx="1.5" />

            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        </span>

        <span>CollaBoard</span>
      </div>

      <div className="auth-visual__content">
        <h2>{heading}</h2>

        <p>{description}</p>

        <ul className="auth-visual__features">
          {features.map((feature) => (
            <li key={feature} className="auth-visual__feature">
              <span aria-hidden="true">✓</span>

              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div aria-hidden="true" />
    </aside>
  );
}

export default AuthVisual;
