import { useEffect, useState } from "react";
export function usePreferences() {
  const [quality, setQuality] = useState<"performance" | "high">(() => {
    try {
      return localStorage.getItem("rosso-quality") === "high"
        ? "high"
        : "performance";
    } catch {
      return "performance";
    }
  });
  const [flat, setFlat] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  useEffect(() => {
    try {
      localStorage.setItem("rosso-quality", quality);
    } catch {
      /* Private browsing may disable storage. */
    }
  }, [quality]);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 760px)"),
      r = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setMobile(m.matches);
      setReduced(r.matches);
    };
    m.addEventListener("change", update);
    r.addEventListener("change", update);
    return () => {
      m.removeEventListener("change", update);
      r.removeEventListener("change", update);
    };
  }, []);
  return { quality, setQuality, flat, setFlat, reduced, mobile };
}
