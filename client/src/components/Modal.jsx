import { useEffect, useEffectEvent, useRef } from "react";
import { createPortal } from "react-dom";

// Keep modal behavior shared across task, workspace, project and workflow forms.
export default function Modal({ children, onClose, busy = false }) {
  const container = useRef(null);
  const requestClose = useEffectEvent(() => {
    if (!busy) onClose();
  });

  useEffect(() => {
    const previousFocus = document.activeElement;
    const root = document.getElementById("root");
    const wasInert = root?.inert;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    const surface = container.current.querySelector('[role="dialog"]');
    surface?.setAttribute("tabindex", "-1");
    const focusable = () => [...container.current.querySelectorAll(
      'a[href], button, input, select, textarea, summary, [tabindex="0"]',
    )].filter((el) => !el.matches(":disabled") && !el.closest("[hidden]") &&
      (!el.closest("details:not([open])") || el.tagName === "SUMMARY"));
    (container.current.querySelector('[autofocus]:not(:disabled)') ??
      focusable().find((el) => el.matches("input, textarea, select")) ?? surface)?.focus();

    function handleKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (!first) { event.preventDefault(); surface?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (root) root.inert = wasInert;
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  // Explicit close controls avoid losing work through accidental backdrop taps.
  return createPortal(<div className="modal-backdrop" ref={container}>{children}</div>, document.body);
}
