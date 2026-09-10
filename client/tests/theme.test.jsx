import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import ThemeToggle from "../src/components/ThemeToggle.jsx";
import { THEME_STORAGE_KEY } from "../src/hooks/useTheme.js";

function setSystemTheme(isDark) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn(() => ({
      matches: isDark,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

beforeEach(() => {
  setSystemTheme(false);
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "";
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = "";
});

test("uses the system color scheme when no preference is stored", async () => {
  setSystemTheme(true);
  render(<ThemeToggle />);

  expect(
    await screen.findByRole("button", { name: "Use light theme" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
});

test("toggles the theme and saves the explicit preference", () => {
  render(<ThemeToggle />);
  const toggle = screen.getByRole("button", { name: "Use dark theme" });

  fireEvent.click(toggle);

  expect(
    screen.getByRole("button", { name: "Use light theme" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
});

test("restores a saved theme preference", async () => {
  localStorage.setItem(THEME_STORAGE_KEY, "dark");
  render(<ThemeToggle compact />);

  expect(
    await screen.findByRole("button", { name: "Use light theme" }),
  ).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute("data-theme", "dark");
});
