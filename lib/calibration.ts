/**
 * Calibration you can defend in an interview.
 *
 * These are not Amazon internal numbers. They are published bands and Ontario
 * rules, written down so the sample shift and the live calculator use the
 * same physics. If a hiring manager asks "how did you design this?", this
 * file is the answer.
 */
import type { PathId } from "./types";

export const SHIFT_START_HOUR = 6;
export const SHIFT_LENGTH = 12;
export const SHIFT_HOURS = Array.from(
  { length: SHIFT_LENGTH },
  (_, i) => SHIFT_START_HOUR + i,
);

/** Ontario ESA: most warehouse employees get 1.5× after 44 hours in the week. */
export const ESA_OT_AFTER_HOURS = 44;
export const OT_MULTIPLIER = 1.5;

/**
 * Job Bank / GTA-Milton postings (2025–26): material handler median ~$21.71;
 * Milton PIT postings $21–$24; GTA picker $19–$21.
 */
export const WAGE_ASSOCIATE = 21;
export const WAGE_PIT = 23;

/**
 * Units per hour targets for THIS site (mixed 3PL, case receive + each-pick).
 * Piece-pick 3PL published band is about 60–90 UPH, not the 120+ figure that
 * describes a single-client e-commerce building. Dock/receive is slower
 * physical work. Pack sits in a common DC band.
 */
export const TARGET_UPH: Record<PathId, number> = {
  dock: 50,
  stow: 55,
  pick: 75,
  pack: 80,
};

/** If more than this share of a path is still ramping, quality/safety soften. */
export const RAMP_DAYS = 14;
export const RAMP_SHARE_WARN = 0.3;

/** Quality: defects as a share of units. Site standard, in line with common DC KPIs. */
export const DEFECT_TARGET = 0.005;

/** Optional industry caption only — BLS SOII Table 1, 2024, NAICS 493. */
export const BLS_WAREHOUSE_TRIR = 4.8;

export const PATH_LABEL: Record<PathId, string> = {
  dock: "Dock / receive",
  stow: "Stow",
  pick: "Pick",
  pack: "Pack",
};

export function hourLabel(hourIndex: number): string {
  const h = SHIFT_HOURS[hourIndex] ?? SHIFT_START_HOUR;
  return `${String(h).padStart(2, "0")}:00`;
}

export function wageFor(pitDesignated: boolean): number {
  return pitDesignated ? WAGE_PIT : WAGE_ASSOCIATE;
}

export function otHoursIfWorkingShift(hoursThisWeek: number): number {
  const projected = hoursThisWeek + SHIFT_LENGTH;
  return Math.max(0, projected - ESA_OT_AFTER_HOURS);
}
