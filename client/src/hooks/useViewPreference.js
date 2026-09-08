import { useState } from "react";

export default function useViewPreference(key, fallback, allowed) {
  const [view, setView] = useState(() => {
    try {
      const stored = localStorage.getItem(`collaboard_view_${key}`);
      return allowed.includes(stored) ? stored : fallback;
    } catch { return fallback; }
  });
  function changeView(next) {
    if (!allowed.includes(next)) return;
    setView(next);
    try { localStorage.setItem(`collaboard_view_${key}`, next); } catch { /* Storage is optional. */ }
  }
  return [view, changeView];
}
