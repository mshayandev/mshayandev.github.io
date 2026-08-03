export type Tier = "high" | "low" | "off";

/**
 * Decides how much GPU work this device gets. "off" means the caller should
 * keep the static CSS backdrop and never load the three.js bundle at all —
 * so this module deliberately imports nothing.
 */
export function detectTier(): Tier {
  if (typeof window === "undefined") return "off";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "off";

  try {
    const probe = document.createElement("canvas");
    const gl =
      probe.getContext("webgl2") ??
      probe.getContext("webgl") ??
      probe.getContext("experimental-webgl");
    if (!gl) return "off";
  } catch {
    return "off";
  }

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 900;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (coarse || narrow || cores <= 4 || memory <= 4) return "low";
  return "high";
}
