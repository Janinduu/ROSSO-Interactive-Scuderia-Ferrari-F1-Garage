import { useEffect } from "react";
import { useMuseumStore } from "../../stores/museumStore";
import { useTourStore } from "../../features/guided-tour/tourStore";
import { useCameraStore } from "./cameraStore";
import { poses } from "./poses";

// Maps where the visitor is in the museum to a camera pose. While the guided
// tour runs it owns the camera instead; when it ends this restores the framing.
export function useMuseumCamera() {
  const entered = useMuseumStore((s) => s.entered);
  const bay = useMuseumStore((s) => s.driverIndex);
  const section = useMuseumStore((s) => s.section);
  const viewResets = useMuseumStore((s) => s.viewResets);
  const touring = useTourStore((s) => s.active);
  useEffect(() => {
    if (touring) return;
    const pose = !entered
      ? poses.landing(bay)
      : section === "engineering"
        ? poses.engineering(bay)
        : poses.bay(bay);
    useCameraStore.getState().go(pose);
  }, [entered, bay, section, viewResets, touring]);
}
