import { useEffect, useState } from "react";

// Full screen for the whole museum. Entering from the landing page asks for it
// (a click is required by browsers); Esc returns to a normal window, and once
// the visitor has left full screen themselves it is not forced on them again.
const KEY = "rosso.fullscreen";
let leftByVisitor = false;
let requested = false;

export const canFullscreen = () =>
  typeof document !== "undefined" && !!document.fullscreenEnabled;

export function autoFullscreenOn() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setAutoFullscreen(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}

export function enterFullscreen() {
  if (!canFullscreen() || document.fullscreenElement) return;
  requested = true;
  document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {
    requested = false;
  });
}

export function exitFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
}

/** Call from the click that takes the visitor into the museum. */
export function autoFullscreen() {
  // Laptops and desktops only (the staged layout): phones have no Esc key.
  const desktop = document.documentElement.classList.contains("staged");
  if (!desktop || leftByVisitor || !autoFullscreenOn()) return;
  enterFullscreen();
}

if (typeof document !== "undefined")
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && requested) leftByVisitor = true;
  });

export function useFullscreen() {
  const [on, setOn] = useState(() => typeof document !== "undefined" && !!document.fullscreenElement);
  useEffect(() => {
    const update = () => setOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  return on;
}
