import useTheme from "../hooks/useTheme";

function ThemeIcon({ isDark }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {isDark ? (
        <>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      ) : (
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.6 8.6 0 1 0 20.5 14.2Z" />
      )}
    </svg>
  );
}

function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const actionLabel = isDark ? "Use light theme" : "Use dark theme";

  return (
    <button
      type="button"
      className={
        `theme-toggle theme-toggle--${theme}` +
        (compact ? " theme-toggle--compact" : "")
      }
      onClick={toggleTheme}
      aria-label={actionLabel}
      aria-pressed={isDark}
      title={actionLabel}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        <ThemeIcon isDark={isDark} />
      </span>

      {!compact && (
        <span className="theme-toggle__label">
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
