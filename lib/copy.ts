import osha from "@/data/osha_patterns.json";
import { hourLabel, PATH_LABEL, TARGET_UPH } from "./calibration";
import type { Evaluation, ShiftState } from "./types";

export function safetyTheme(state: ShiftState): string {
  const hour = state.hourIndex;
  const inbound =
    (state.volume.dock[hour] ?? 0) + (state.volume.stow[hour] ?? 0);
  const outbound =
    (state.volume.pick[hour] ?? 0) + (state.volume.pack[hour] ?? 0);
  if (inbound >= outbound) return osha.huddle_defaults.inbound_heavy;
  return osha.huddle_defaults.floor;
}

export function buildHuddle(state: ShiftState, ev: Evaluation): string {
  const lines = [
    `SHIFT HUDDLE · ${state.dateLabel} · ${hourLabel(state.hourIndex)}`,
    state.siteNote,
    "",
    "SQDC (Safety, Quality, Delivery, Cost), in that order:",
    `  S ${ev.sqdc.S.tone.toUpperCase()}: ${ev.sqdc.S.why}`,
    `  Q ${ev.sqdc.Q.tone.toUpperCase()}: ${ev.sqdc.Q.why}`,
    `  D ${ev.sqdc.D.tone.toUpperCase()}: ${ev.sqdc.D.why}`,
    `  C ${ev.sqdc.C.tone.toUpperCase()}: ${ev.sqdc.C.why}`,
    "",
    `People: ${ev.presentCount} present. Call-outs: ${ev.absentNames.length ? ev.absentNames.join(", ") : "none"}.`,
    "",
    "Coverage this hour:",
    ...Object.values(ev.paths).map(
      (p) =>
        `  ${PATH_LABEL[p.path]}: need ${p.required}, have ${p.assigned}, volume ${p.volume} (site UPH ${TARGET_UPH[p.path]})`,
    ),
    "",
    "Safety theme (US OSHA warehousing patterns, NAICS 493110, industry context only):",
    `  ${safetyTheme(state)}`,
    "",
    ev.suggestion
      ? `Labor call: ${ev.suggestion.why}`
      : "Labor call: hold positions unless a path goes two people short.",
    "",
    "Open items:",
    ...(state.issues.filter((i) => i.open).length
      ? state.issues.filter((i) => i.open).map((i) => `  - ${i.title}: ${i.containment}`)
      : ["  - None. Leave the area cleaner than you found it."]),
    "",
    "Non-negotiables: no undesignated PIT on a live door. No damaged freight into stow. Stretch before first pallet.",
  ];
  return lines.join("\n");
}

export function buildHandoff(state: ShiftState, ev: Evaluation): string {
  const open = state.issues.filter((i) => i.open);
  const nextHour = Math.min(state.hourIndex + 1, 11);
  const nextDock = state.volume.dock[nextHour] ?? 0;
  return [
    `HANDOFF · ${state.siteName} · leaving ${hourLabel(state.hourIndex)}`,
    "",
    "What happened:",
    `  ${ev.presentCount} on the floor. Call-outs: ${ev.absentNames.join(", ") || "none"}.`,
    `  SQDC: S ${ev.sqdc.S.tone} / Q ${ev.sqdc.Q.tone} / D ${ev.sqdc.D.tone} / C ${ev.sqdc.C.tone}`,
    "",
    "Still open:",
    ...(open.length ? open.map((i) => `  - ${i.title}: ${i.containment}`) : ["  - Nothing open."]),
    "",
    "What the next shift should do first:",
    `  Dock volume next hour is ${nextDock}. ${ev.suggestion ? ev.suggestion.why : "Re-check PIT coverage before the next appointment."}`,
    "  Walk Door 4 / quality cage if inbound exceptions ran today.",
    "  Do not reset my labor move without looking at pack quality.",
    "",
    "Area condition: aisles and stretch wrap are your 5S (sort / set / shine / standardize / sustain) pass before you leave.",
  ].join("\n");
}
