import { create } from "zustand";
import { setSoundEnabled, stopAmbience, stopEngine, unlockAudio } from "./soundEngine";

const KEY = "rosso-sound";
const initial = (() => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
})();
setSoundEnabled(initial);

interface SoundState {
  /** On by default; the visitor's choice is remembered on this device. */
  enabled: boolean;
  toggle: () => void;
}

export const useSoundStore = create<SoundState>((set, get) => ({
  enabled: initial,
  toggle: () => {
    const enabled = !get().enabled;
    try {
      localStorage.setItem(KEY, enabled ? "on" : "off");
    } catch {
      /* Private browsing may disable storage. */
    }
    setSoundEnabled(enabled);
    if (enabled) unlockAudio();
    else stopEngine();
    set({ enabled });
  },
}));

export { stopAmbience };
