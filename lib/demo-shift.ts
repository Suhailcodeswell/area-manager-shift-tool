import { SHIFT_LENGTH, TARGET_UPH } from "./calibration";
import { PATHS, type Associate, type PathId, type Scenario, type ShiftState } from "./types";

/**
 * How the sample Saturday was designed (not "AI invented a warehouse"):
 *
 * 1. Wrote constraints a floor leader would recognize.
 * 2. Calibrated magnitudes in lib/calibration.ts (wages, ESA, UPH bands).
 * 3. Built one inbound-heavy Peak Saturday so the TOOL has something to
 *    chew on — same as shipping a product with a sample file.
 *
 * Names and exact hours-this-week are filler. The constraints below are not.
 */
export const SAMPLE_SPEC = {
  site: "Inbound area, fictional Canadian 3PL warehouse",
  dateLabel: "Saturday 29 Aug 2026 · 06:00–18:00",
  roster: 36,
  processAssistants: 2,
  pitDesignated: 8,
  ramping: 6,
  packCallouts: ["Maya Chen", "Omar Haddad"],
  story: [
    "06:00 two pack call-outs. Volume unchanged.",
    "10:00 three trucks bunch; one damaged freight.",
    "Do not strip pack to save the dock if pick has surplus and PIT-trained people.",
  ],
};

const FIRST = [
  "Maya",
  "Omar",
  "Priya",
  "Liam",
  "Aisha",
  "Noah",
  "Sofia",
  "Ethan",
  "Leila",
  "Jamal",
  "Hannah",
  "Mateo",
  "Anika",
  "Owen",
  "Yara",
  "Declan",
  "Mei",
  "Hassan",
  "Clara",
  "Ravi",
  "Isla",
  "Theo",
  "Nadia",
  "Felix",
  "Amara",
  "Cole",
  "Sana",
  "Jonah",
  "Elena",
  "Kian",
  "Rosa",
  "Ben",
  "Tara",
  "Marcus",
  "Noor",
  "Samir",
];

const LAST = [
  "Chen",
  "Haddad",
  "Nair",
  "Walsh",
  "Khan",
  "Patel",
  "Rossi",
  "Nguyen",
  "Hassan",
  "Brooks",
  "Singh",
  "Okafor",
  "MacLeod",
  "Santos",
  "Ibrahim",
  "Park",
  "Gagnon",
  "Ali",
  "Fraser",
  "Costa",
  "Murphy",
  "Rahman",
  "Vogel",
  "Diallo",
  "Kowalski",
  "Bennett",
  "Qureshi",
  "Reid",
  "Silva",
  "Zhou",
  "Campbell",
  "Diaz",
  "Hughes",
  "Farah",
  "Lee",
  "Thompson",
];

function scale(base: number[], peak: boolean): number[] {
  const f = peak ? 1.28 : 1;
  return base.map((n) => Math.round(n * f));
}

/** Midweek-shaped inbound curve; Peak multiplies 1.28. */
const BASE_VOLUME: Record<PathId, number[]> = {
  dock: [40, 70, 110, 160, 220, 240, 190, 150, 110, 80, 50, 30],
  stow: [20, 50, 90, 140, 190, 220, 200, 160, 120, 90, 60, 35],
  pick: [50, 60, 70, 80, 90, 100, 130, 150, 140, 120, 90, 60],
  pack: [55, 65, 75, 85, 95, 105, 135, 155, 145, 125, 95, 65],
};

function buildRoster(): Associate[] {
  const people: Associate[] = FIRST.map((first, i) => {
    const name = `${first} ${LAST[i]}`;
    const tenureDays = [
      4, 6, 8, 9, 11, 12, 18, 22, 28, 35, 40, 55, 70, 90, 110, 140, 160, 180,
      200, 240, 280, 320, 360, 400, 450, 500, 520, 560, 600, 640, 700, 720,
      800, 850, 900, 980,
    ][i];
    const pitDesignated = i % 4 === 0 && i < 32;
    const pathsTrained: PathId[] = ["pick", "pack"];
    if (i % 3 === 0) pathsTrained.push("stow");
    if (pitDesignated) pathsTrained.push("dock", "stow");
    if (i % 5 === 0 && !pathsTrained.includes("stow")) pathsTrained.push("stow");
    const hoursThisWeek = i === 10 || i === 14 ? 38 : 30 + (i % 3);
    const isCallout = name === "Maya Chen" || name === "Omar Haddad";
    return {
      id: `a${i + 1}`,
      name,
      role: i >= 34 ? "pa" : "associate",
      tenureDays,
      pitDesignated: pitDesignated && !isCallout,
      whmis: i > 2,
      pathsTrained: isCallout ? ["pack", "pick"] : pathsTrained,
      hoursThisWeek: i === 10 || i === 14 ? 38 : hoursThisWeek,
      present: !isCallout,
      assigned: "unassigned",
      note:
        tenureDays < 14
          ? "Ramping: coach lift technique, no live PIT door."
          : i >= 34
            ? "Process Assistant: can float, still counts in a path if assigned."
            : undefined,
    };
  });

  // Guarantee 8 PIT-designated among people who showed up.
  let pit = people.filter((p) => p.pitDesignated && p.present).length;
  for (const p of people) {
    if (pit >= 8) break;
    if (!p.present || p.pitDesignated) continue;
    if (p.tenureDays < 14) continue;
    p.pitDesignated = true;
    if (!p.pathsTrained.includes("dock")) p.pathsTrained.push("dock");
    pit += 1;
  }
  return people;
}

function trucks(peak: boolean) {
  return [
    {
      id: "t1",
      door: 1,
      carrier: "Midland Freight",
      pallets: 22,
      etaHour: 8,
      delayMin: 0,
      status: "unloading" as const,
    },
    {
      id: "t2",
      door: 2,
      carrier: "Northstar",
      pallets: 18,
      etaHour: 10,
      delayMin: peak ? 25 : 0,
      status: peak ? ("on_yard" as const) : ("scheduled" as const),
    },
    {
      id: "t3",
      door: 3,
      carrier: "Humber Cartage",
      pallets: 24,
      etaHour: 10,
      delayMin: peak ? 40 : 5,
      status: peak ? ("on_yard" as const) : ("scheduled" as const),
    },
    {
      id: "t4",
      door: 4,
      carrier: "Lakeshore Line",
      pallets: 16,
      etaHour: 10,
      delayMin: peak ? 15 : 0,
      status: "exception" as const,
      exception: peak
        ? "Damaged freight on last four pallets. Do not stow. Quality hold."
        : undefined,
    },
    {
      id: "t5",
      door: 5,
      carrier: "Cedar Express",
      pallets: 20,
      etaHour: 13,
      delayMin: 0,
      status: "scheduled" as const,
    },
    {
      id: "t6",
      door: 6,
      carrier: "empty",
      pallets: 0,
      etaHour: 17,
      delayMin: 0,
      status: "empty" as const,
    },
  ];
}

export function makeShift(scenario: Scenario, sampleStory: boolean): ShiftState {
  const peak = scenario === "peak";
  const associates = buildRoster().map((a) => ({
    ...a,
    present: sampleStory ? a.present : true,
    assigned: "unassigned" as const,
  }));
  if (!sampleStory) {
    for (const a of associates) a.present = true;
  }
  return {
    siteName: "Inbound area",
    siteNote: "Fictional Canadian 3PL warehouse used for this demo.",
    dateLabel: sampleStory
      ? SAMPLE_SPEC.dateLabel
      : "Live shift: enter today's volume and who showed up",
    scenario,
    hourIndex: sampleStory ? 0 : 0,
    associates,
    volume: {
      dock: scale(BASE_VOLUME.dock, peak),
      stow: scale(BASE_VOLUME.stow, peak),
      pick: scale(BASE_VOLUME.pick, peak),
      pack: scale(BASE_VOLUME.pack, peak),
    },
    trucks: trucks(peak && sampleStory),
    issues:
      sampleStory && peak
        ? [
            {
              id: "open-1",
              hour: 6,
              kind: "labor",
              title: "Two pack call-outs at start of shift",
              containment:
                "Do not backfill pack from untrained dock PIT. Ask pick surplus first. Flag quality risk on the huddle.",
              open: true,
            },
            {
              id: "open-2",
              hour: 10,
              kind: "quality",
              title: "Damaged inbound freight at Door 4",
              containment:
                "Hold four pallets. Do not stow. Photo, carrier note, quality cage. Rest of trailer can receive.",
              open: true,
            },
          ]
        : [],
  };
}

export function samplePeakSaturday(): ShiftState {
  return makeShift("peak", true);
}

export function blankLiveShift(): ShiftState {
  return makeShift("normal", false);
}

export function requiredAtHour(state: ShiftState, hourIndex: number) {
  return Object.fromEntries(
    PATHS.map((p) => [
      p,
      Math.ceil((state.volume[p][hourIndex] ?? 0) / TARGET_UPH[p]),
    ]),
  );
}

export function sampleRca() {
  return {
    problem: "Door 4 damaged freight was going to be stowed into live pick locations.",
    whys: [
      "Unload wanted the door back before the next two late trucks.",
      "No hold lane was staged on the dock before peak arrivals.",
      "Quality was treated as a later-shift task, not a receive gate.",
      "The huddle named volume, not inbound quality containment.",
      "We did not pre-assign a PA to exceptions when the yard filled.",
    ],
    containment:
      "Four pallets in quality cage. Door 4 rest of trailer received. Stow lag accepted on purpose.",
    corrective:
      "Peak inbound SOP: exception lane set before 09:30. PA owns holds. Huddle includes ‘what we will not stow.’",
  };
}

export { SHIFT_LENGTH };
