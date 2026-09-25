import { create } from "zustand";
import { buildMuseumTour } from "./tourSteps";

export const tourSteps = buildMuseumTour();

interface TourState {
  active: boolean;
  stepIndex: number;
  paused: boolean;
  start: () => void;
  stop: () => void;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  /** Advance only if the tour is still on `index` — guards late timer ticks. */
  advanceFrom: (index: number) => void;
  togglePause: () => void;
}

// A finite state machine over tourSteps (spec §16.1). The TourController reacts
// to stepIndex; nothing else sequences the tour.
export const useTourStore = create<TourState>((set, get) => ({
  active: false,
  stepIndex: 0,
  paused: false,
  start: () => set({ active: true, stepIndex: 0, paused: false }),
  stop: () => set({ active: false, paused: false }),
  goTo: (index) =>
    set({
      stepIndex: Math.max(0, Math.min(tourSteps.length - 1, index)),
    }),
  next: () => {
    const { stepIndex } = get();
    if (stepIndex >= tourSteps.length - 1) get().stop();
    else set({ stepIndex: stepIndex + 1 });
  },
  previous: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
  advanceFrom: (index) => {
    if (get().active && get().stepIndex === index) get().next();
  },
  togglePause: () => set((s) => ({ paused: !s.paused })),
}));
