import { useEffect, useRef } from "react";

// Esc for overlays. The listener stays attached for the life of the overlay
// and reads the latest handler from a ref: if another Esc handler re-renders
// the app first, a listener re-subscribed mid-dispatch would never be called.
export function useEscape(handler: () => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") ref.current();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [enabled]);
}
