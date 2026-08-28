import {
  DEFECT_TARGET,
  ESA_OT_AFTER_HOURS,
  RAMP_DAYS,
  RAMP_SHARE_WARN,
  SHIFT_HOURS,
  SHIFT_LENGTH,
  TARGET_UPH,
  WAGE_ASSOCIATE,
  WAGE_PIT,
  hourLabel,
  otHoursIfWorkingShift,
} from "./calibration";
import {
  PATHS,
  type Associate,
  type Evaluation,
  type MoveSuggestion,
  type PathId,
  type PathSnapshot,
  type ShiftState,
  type SqdcTone,
  type Warning,
} from "./types";

export function requiredHeadcount(volume: number, uph: number): number {
  if (volume <= 0) return 0;
  return Math.ceil(volume / uph);
}

export function isRamping(a: Associate): boolean {
  return a.tenureDays < RAMP_DAYS;
}

function onPath(associates: Associate[], path: PathId): Associate[] {
  return associates.filter(
    (a) => a.present && a.assigned === path,
  );
}

function snapshot(
  state: ShiftState,
  path: PathId,
  hourIndex: number,
): PathSnapshot {
  const volume = state.volume[path][hourIndex] ?? 0;
  const people = onPath(state.associates, path);
  const rampingCount = people.filter(isRamping).length;
  return {
    path,
    volume,
    required: requiredHeadcount(volume, TARGET_UPH[path]),
    assigned: people.length,
    gap: requiredHeadcount(volume, TARGET_UPH[path]) - people.length,
    newHireShare: people.length ? rampingCount / people.length : 0,
    pitCount: people.filter((a) => a.pitDesignated).length,
    rampingCount,
  };
}

function worse(a: SqdcTone, b: SqdcTone): SqdcTone {
  const rank = { green: 0, amber: 1, red: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function evaluateShift(state: ShiftState): Evaluation {
  const hourIndex = state.hourIndex;
  const paths = Object.fromEntries(
    PATHS.map((p) => [p, snapshot(state, p, hourIndex)]),
  ) as Record<PathId, PathSnapshot>;

  const warnings: Warning[] = [];
  const absent = state.associates.filter((a) => !a.present);

  if (absent.length) {
    warnings.push({
      id: "callouts",
      tone: absent.length >= 2 ? "red" : "amber",
      text: `Call-outs (${absent.length}): ${absent.map((a) => a.name).join(", ")}. Volume did not change.`,
    });
  }

  for (const a of state.associates) {
    if (!a.present || a.assigned === "unassigned") continue;
    if (a.assigned === "dock" && !a.pitDesignated) {
      warnings.push({
        id: `pit-${a.id}`,
        tone: "red",
        text: `${a.name} is on dock without PIT designation (forklift / powered pallet equipment). Move them or they stay a floor helper only. They cannot take a live door.`,
      });
    }
    if (!a.pathsTrained.includes(a.assigned)) {
      warnings.push({
        id: `skill-${a.id}`,
        tone: "red",
        text: `${a.name} is not trained on ${a.assigned}. That is a quality and safety miss. Reassign.`,
      });
    }
    if (a.assigned === "dock" && !a.whmis) {
      warnings.push({
        id: `whmis-${a.id}`,
        tone: "amber",
        text: `${a.name} is on dock without WHMIS (chemical hazard training). Keep them off damaged/unknown freight.`,
      });
    }
    const ot = otHoursIfWorkingShift(a.hoursThisWeek);
    if (ot > 0) {
      warnings.push({
        id: `ot-${a.id}`,
        tone: "amber",
        text: `${a.name} is already at ${a.hoursThisWeek}h this week. This 12h shift puts them ${ot}h over the ESA 44h overtime line (1.5× pay).`,
      });
    }
  }

  for (const p of PATHS) {
    const s = paths[p];
    if (s.gap > 0) {
      warnings.push({
        id: `gap-${p}`,
        tone: s.gap >= 2 ? "red" : "amber",
        text: `${p} needs ${s.required}, has ${s.assigned} (short ${s.gap}) at ${hourLabel(hourIndex)}.`,
      });
    }
    if (s.assigned > 0 && s.newHireShare >= RAMP_SHARE_WARN) {
      warnings.push({
        id: `ramp-${p}`,
        tone: "amber",
        text: `${p} is ${Math.round(s.newHireShare * 100)}% ramping (<${RAMP_DAYS} days). Slow the rate before you chase UPH.`,
      });
    }
  }

  const liveTrucks = state.trucks.filter(
    (t) =>
      t.etaHour <= SHIFT_HOURS[hourIndex] &&
      t.status !== "empty" &&
      t.delayMin > 0,
  );
  if (liveTrucks.length) {
    warnings.push({
      id: "dwell",
      tone: liveTrucks.length >= 2 ? "red" : "amber",
      text: `${liveTrucks.length} truck(s) late or bunching. Dock dwell will eat stow and outbound later.`,
    });
  }

  const exception = state.trucks.find(
    (t) =>
      t.status === "exception" &&
      t.etaHour <= (SHIFT_HOURS[hourIndex] ?? 6),
  );
  if (exception) {
    warnings.push({
      id: "freight",
      tone: "red",
      text: `Door ${exception.door}: ${exception.exception ?? "freight exception"}. Contain quality before you unload into stock.`,
    });
  }

  const dock = paths.dock;
  const pack = paths.pack;
  const pick = paths.pick;

  let suggestion: MoveSuggestion | null = null;
  const neediest = PATHS.map((p) => paths[p]).sort((a, b) => b.gap - a.gap)[0];
  const fattest = PATHS.map((p) => paths[p]).sort(
    (a, b) => a.gap - b.gap,
  )[0];
  if (neediest && fattest && neediest.gap > 0 && fattest.gap < 0) {
    const count = Math.min(neediest.gap, Math.abs(fattest.gap));
    suggestion = {
      from: fattest.path,
      to: neediest.path,
      count,
      why: `${neediest.path} is short ${neediest.gap}. ${fattest.path} has a surplus of ${Math.abs(fattest.gap)}. Move ${count} only if they are trained on ${neediest.path}.`,
    };
  } else if (dock.gap > 0 && pick.assigned > pick.required) {
    suggestion = {
      from: "pick",
      to: "dock",
      count: Math.min(dock.gap, pick.assigned - pick.required),
      why: "Inbound is the constraint. Pull from pick surplus, not from pack. Pack is already the customer-quality path.",
    };
  }

  if (pack.gap > 0 && suggestion?.from === "pack") {
    suggestion = {
      ...suggestion,
      why: `${suggestion.why} Pack is already short. Pulling it further will raise defects. Prefer pick if anyone there is dock-trained.`,
    };
  }

  const safetyTone: SqdcTone = warnings.some(
    (w) => w.id.startsWith("pit-") || w.id.startsWith("skill-") || w.id === "freight",
  )
    ? "red"
    : warnings.some((w) => w.id.startsWith("ramp-") || w.id === "dwell")
      ? "amber"
      : "green";

  const qualityTone: SqdcTone =
    pack.gap >= 2 || pack.newHireShare >= RAMP_SHARE_WARN || exception
      ? "red"
      : pack.gap > 0
        ? "amber"
        : "green";

  const deliveryTone: SqdcTone = PATHS.some((p) => paths[p].gap >= 2)
    ? "red"
    : PATHS.some((p) => paths[p].gap > 0)
      ? "amber"
      : "green";

  const otPeople = state.associates.filter(
    (a) => a.present && otHoursIfWorkingShift(a.hoursThisWeek) > 0,
  ).length;
  const costTone: SqdcTone =
    otPeople >= 4 ? "red" : otPeople > 0 ? "amber" : "green";

  const sqdc = {
    S: {
      tone: safetyTone,
      why:
        safetyTone === "green"
          ? "No illegal placements. Keep the Gemba walk on lifting and floor clutter."
          : "Fix PIT, training, or freight containment before you chase rate.",
    },
    Q: {
      tone: qualityTone,
      why:
        qualityTone === "green"
          ? `Defect target ${DEFECT_TARGET * 100}% still realistic if pack stays staffed.`
          : "Pack coverage or ramping share is the quality risk, not a mystery defect rate.",
    },
    D: {
      tone: deliveryTone,
      why:
        deliveryTone === "green"
          ? "Headcount covers planned volume at site UPH standards."
          : "At least one path cannot hit plan at the posted UPH. Move people or cut a lower-priority path on purpose.",
    },
    C: {
      tone: costTone,
      why:
        costTone === "green"
          ? `Labor still inside ESA ${ESA_OT_AFTER_HOURS}h regular time.`
          : `${otPeople} people will cross weekly overtime if they work this whole shift.`,
    },
  };

  return {
    hour: SHIFT_HOURS[hourIndex] ?? 6,
    paths,
    sqdc,
    warnings,
    suggestion,
    presentCount: state.associates.filter((a) => a.present).length,
    absentNames: absent.map((a) => a.name),
  };
}

export function overallTone(evaln: Evaluation): SqdcTone {
  return PATHS.reduce(
    (acc, p) => (evaln.paths[p].gap >= 2 ? worse(acc, "red") : acc),
    (Object.values(evaln.sqdc).some((s) => s.tone === "red")
      ? "red"
      : Object.values(evaln.sqdc).some((s) => s.tone === "amber")
        ? "amber"
        : "green") as SqdcTone,
  );
}

export function laborCostThisShift(state: ShiftState): {
  regular: number;
  overtime: number;
  total: number;
} {
  let regular = 0;
  let overtime = 0;
  for (const a of state.associates) {
    if (!a.present) continue;
    const wage = a.pitDesignated ? WAGE_PIT : WAGE_ASSOCIATE;
    const ot = otHoursIfWorkingShift(a.hoursThisWeek);
    const regHours = SHIFT_LENGTH - ot;
    regular += wage * regHours;
    overtime += wage * 1.5 * ot;
  }
  return { regular, overtime, total: regular + overtime };
}

export function assignTo(
  state: ShiftState,
  associateId: string,
  path: PathId | "unassigned",
): ShiftState {
  return {
    ...state,
    associates: state.associates.map((a) =>
      a.id === associateId ? { ...a, assigned: path } : a,
    ),
  };
}

export function applySuggestion(state: ShiftState, move: MoveSuggestion): ShiftState {
  let left = move.count;
  const next = state.associates.map((a) => ({ ...a }));
  for (const a of next) {
    if (left <= 0) break;
    if (
      a.present &&
      a.assigned === move.from &&
      (move.to === "dock" ? a.pitDesignated && a.pathsTrained.includes("dock") : a.pathsTrained.includes(move.to))
    ) {
      a.assigned = move.to;
      left -= 1;
    }
  }
  return { ...state, associates: next };
}

export function setHour(state: ShiftState, hourIndex: number): ShiftState {
  return { ...state, hourIndex };
}

export function setVolume(
  state: ShiftState,
  path: PathId,
  hourIndex: number,
  volume: number,
): ShiftState {
  const copy = { ...state.volume, [path]: [...state.volume[path]] };
  copy[path][hourIndex] = Math.max(0, Math.round(volume));
  return { ...state, volume: copy };
}

export function addIssue(
  state: ShiftState,
  title: string,
  kind: ShiftState["issues"][number]["kind"],
  containment: string,
): ShiftState {
  return {
    ...state,
    issues: [
      ...state.issues,
      {
        id: `iss-${Date.now()}`,
        hour: SHIFT_HOURS[state.hourIndex] ?? 6,
        kind,
        title,
        containment,
        open: true,
      },
    ],
  };
}

export function toggleIssue(state: ShiftState, id: string): ShiftState {
  return {
    ...state,
    issues: state.issues.map((i) =>
      i.id === id ? { ...i, open: !i.open } : i,
    ),
  };
}

export function autoFill(state: ShiftState): ShiftState {
  const evaln = evaluateShift({
    ...state,
    associates: state.associates.map((a) => ({
      ...a,
      assigned: a.present ? "unassigned" : a.assigned,
    })),
  });
  const next = state.associates.map((a) => ({
    ...a,
    assigned: a.present ? ("unassigned" as const) : a.assigned,
  }));

  const fill = (path: PathId, need: number, pred: (a: Associate) => boolean) => {
    let n = 0;
    for (const a of next) {
      if (n >= need) break;
      if (!a.present || a.assigned !== "unassigned") continue;
      if (!pred(a)) continue;
      a.assigned = path;
      n += 1;
    }
  };

  fill(
    "dock",
    evaln.paths.dock.required,
    (a) => a.pitDesignated && a.pathsTrained.includes("dock") && !isRamping(a),
  );
  fill("stow", evaln.paths.stow.required, (a) => a.pathsTrained.includes("stow"));
  fill("pack", evaln.paths.pack.required, (a) => a.pathsTrained.includes("pack"));
  fill("pick", evaln.paths.pick.required, (a) => a.pathsTrained.includes("pick"));

  return { ...state, associates: next };
}
