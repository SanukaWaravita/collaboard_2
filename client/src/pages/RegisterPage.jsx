import { useState } from "react";
import { Link, useNavigate } from "react-router";

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setError("");

    // Temporary M1 behaviour. Account creation will use the API in M2.
    navigate("/boards");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__brand">CollabBoard</div>

        <header className="auth-card__header">
          <p className="auth-card__eyebrow">Get started</p>
          <h1>Create an account</h1>
          <p>Create an account to collaborate with your team.</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength="6"
              required
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="register-confirm-password">
              Confirm password
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Enter the password again"
              autoComplete="new-password"
              minLength="6"
              required
            />
          </div>

          {error && (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="button button--primary auth-form__submit"
          >
            Create Account
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;