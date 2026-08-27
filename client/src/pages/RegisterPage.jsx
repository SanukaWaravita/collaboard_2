import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiRequest, saveSession } from "../services/api";
import AuthVisual from "../components/AuthVisual";

const REGISTER_FEATURES = [
  "Simple Project organization",
  "Clear Task ownership",
  "Better team collaboration",
];

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name")).trim();
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirmPassword"));

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const session = await apiRequest("/auth/register", {
        method: "POST",
        body: {
          name,
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
      <section className="auth-layout">
        <AuthVisual
          heading={
            <>
              Build better.
              <br />
              Together.
            </>
          }
          description={
            <>
              Create a shared workspace where everyone knows what needs to
              happen next.
            </>
          }
          features={REGISTER_FEATURES}
        />

        <section className="auth-card">
          <div className="auth-card__brand">CollaBoard</div>

          <header className="auth-card__header">
            <p className="auth-card__eyebrow">Get started</p>

            <h1>Create your account</h1>

            <p>Set up your account and start collaborating with your team.</p>
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
                placeholder="you@example.com"
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
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength="8"
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
                placeholder="Repeat your password"
                autoComplete="new-password"
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
              className={"button button--primary " + "auth-form__submit"}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-card__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </section>
    </main>
  );
}

export default RegisterPage;
