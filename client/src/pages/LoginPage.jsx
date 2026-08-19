import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  apiRequest,
  saveSession,
} from "../services/api";

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));

    setError("");
    setIsSubmitting(true);

    try {
      const session = await apiRequest("/auth/login", {
        method: "POST",
        body: {
          email,
          password,
        },
      });

      saveSession(session);
      navigate("/workspaces");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__brand">CollabBoard</div>

        <header className="auth-card__header">
          <p className="auth-card__eyebrow">Welcome back</p>
          <h1>Log in to your account</h1>
          <p>
            Continue managing your team’s workspaces,
            projects, and tasks.
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form__field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form__field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              minLength="8"
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging In..." : "Log In"}
          </button>
        </form>

        <p className="auth-card__footer">
          Don&apos;t have an account?{" "}
          <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;