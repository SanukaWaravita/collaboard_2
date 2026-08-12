import { Link, useNavigate } from "react-router";

function LoginPage() {
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    // Temporary M1 behaviour. Real authentication will be added in M2.
    navigate("/boards");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__brand">CollabBoard</div>

        <header className="auth-card__header">
          <p className="auth-card__eyebrow">Welcome back</p>
          <h1>Log in to your account</h1>
          <p>Continue managing your team’s boards and tasks.</p>
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
              minLength="6"
              required
            />
          </div>

          <button
            type="submit"
            className="button button--primary auth-form__submit"
          >
            Log In
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