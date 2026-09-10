import { useCallback, useEffect, useState } from "react";

export const THEME_STORAGE_KEY = "collaboard-theme";

const VALID_THEMES = new Set(["light", "dark"]);

function getStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return VALID_THEMES.has(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
}

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme() {
  const documentTheme = document.documentElement.dataset.theme;

  if (VALID_THEMES.has(documentTheme)) {
    return documentTheme;
  }

  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The selected theme still applies for this session if storage is blocked.
  }
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const colorScheme = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    );

    if (!colorScheme) {
      return undefined;
    }

    function handleSystemThemeChange(event) {
      if (!getStoredTheme()) {
        setTheme(event.matches ? "dark" : "light");
      }
    }

    colorScheme.addEventListener?.("change", handleSystemThemeChange);

    return () => {
      colorScheme.removeEventListener?.("change", handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    function handleStoredThemeChange(event) {
      if (
        event.key === THEME_STORAGE_KEY &&
        VALID_THEMES.has(event.newValue)
      ) {
        setTheme(event.newValue);
      }
    }

    window.addEventListener("storage", handleStoredThemeChange);
    return () => window.removeEventListener("storage", handleStoredThemeChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      saveTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  return { theme, toggleTheme };
}
