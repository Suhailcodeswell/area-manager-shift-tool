/** Paths on the inbound-heavy area. */
export type PathId = "dock" | "stow" | "pick" | "pack";

export const PATHS: PathId[] = ["dock", "stow", "pick", "pack"];

export type Associate = {
  id: string;
  name: string;
  role: "associate" | "pa";
  tenureDays: number;
  pitDesignated: boolean;
  whmis: boolean;
  pathsTrained: PathId[];
  hoursThisWeek: number;
  present: boolean;
  assigned: PathId | "unassigned";
  note?: string;
};

export type Truck = {
  id: string;
  door: number;
  carrier: string;
  pallets: number;
  etaHour: number;
  delayMin: number;
  status: "scheduled" | "on_yard" | "unloading" | "empty" | "exception";
  exception?: string;
};

export type Issue = {
  id: string;
  hour: number;
  kind: "safety" | "quality" | "system" | "labor" | "customer";
  title: string;
  containment: string;
  open: boolean;
};

export type Scenario = "normal" | "peak";

export type ShiftState = {
  siteName: string;
  siteNote: string;
  dateLabel: string;
  scenario: Scenario;
  hourIndex: number;
  associates: Associate[];
  volume: Record<PathId, number[]>;
  trucks: Truck[];
  issues: Issue[];
};

export type SqdcTone = "green" | "amber" | "red";

export type PathSnapshot = {
  path: PathId;
  volume: number;
  required: number;
  assigned: number;
  gap: number;
  newHireShare: number;
  pitCount: number;
  rampingCount: number;
};

export type Warning = {
  id: string;
  tone: SqdcTone;
  text: string;
};

export type MoveSuggestion = {
  from: PathId;
  to: PathId;
  count: number;
  why: string;
};

export type Evaluation = {
  hour: number;
  paths: Record<PathId, PathSnapshot>;
  sqdc: Record<"S" | "Q" | "D" | "C", { tone: SqdcTone; why: string }>;
  warnings: Warning[];
  suggestion: MoveSuggestion | null;
  presentCount: number;
  absentNames: string[];
};

export type RcaDraft = {
  problem: string;
  whys: string[];
  containment: string;
  corrective: string;
};
