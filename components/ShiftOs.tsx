"use client";

import {
  GlossaryPanel,
  MadeWithPanel,
  StartHerePanel,
  TourPanel,
} from "@/components/ExplainPanels";
import {
  ESA_OT_AFTER_HOURS,
  PATH_LABEL,
  TARGET_UPH,
  hourLabel,
} from "@/lib/calibration";
import { PATHS } from "@/lib/types";
import { buildHandoff, buildHuddle } from "@/lib/copy";
import {
  blankLiveShift,
  samplePeakSaturday,
  sampleRca,
} from "@/lib/demo-shift";
import {
  addIssue,
  applySuggestion,
  assignTo,
  autoFill,
  evaluateShift,
  laborCostThisShift,
  setHour,
  setVolume,
  toggleIssue,
} from "@/lib/engine";
import type { PathId, ShiftState, SqdcTone } from "@/lib/types";
import { useMemo, useState } from "react";

type Panel =
  | "start"
  | "tour"
  | "glossary"
  | "floor"
  | "huddle"
  | "handoff"
  | "issues"
  | "about";

function toneColor(t: SqdcTone): string {
  if (t === "green") return "var(--ok)";
  if (t === "amber") return "var(--warn)";
  return "var(--bad)";
}

export function ShiftOs() {
  const [shift, setShift] = useState<ShiftState>(() =>
    autoFill(samplePeakSaturday()),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("start");
  const [issueTitle, setIssueTitle] = useState("");

  const ev = useMemo(() => evaluateShift(shift), [shift]);
  const cost = useMemo(() => laborCostThisShift(shift), [shift]);
  const selected = shift.associates.find((a) => a.id === selectedId) ?? null;
  const huddle = useMemo(() => buildHuddle(shift, ev), [shift, ev]);
  const handoff = useMemo(() => buildHandoff(shift, ev), [shift, ev]);
  const rca = sampleRca();

  function loadSample() {
    setShift(autoFill(samplePeakSaturday()));
    setSelectedId(null);
    setPanel("floor");
  }

  function loadLive() {
    setShift(autoFill(blankLiveShift()));
    setSelectedId(null);
    setPanel("floor");
  }

  function place(path: PathId | "unassigned") {
    if (!selectedId) return;
    setShift((s) => assignTo(s, selectedId, path));
  }

  return (
    <div className="min-h-full px-4 py-4 md:px-6 md:py-5">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <p
            className="text-sm tracking-wide text-[var(--safety)]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            A project by Suhail Ahmed
          </p>
          <h1
            className="text-4xl leading-none tracking-tight text-[var(--ink)] md:text-5xl"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            AREA MANAGER SHIFT TOOL
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            {shift.siteName}. {shift.siteNote} Put today&apos;s numbers in, or
            load the sample shift to explore the demo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadSample}
            className="border border-[var(--safety)] bg-[var(--safety)] px-3 py-2 text-xs font-medium tracking-wide text-[#1a1608]"
          >
            Load sample shift
          </button>
          <button
            type="button"
            onClick={loadLive}
            className="border border-[var(--line)] px-3 py-2 text-xs tracking-wide text-[var(--ink)]"
          >
            New live shift
          </button>
        </div>
      </header>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {(["S", "Q", "D", "C"] as const).map((k) => (
          <div
            key={k}
            className="border border-[var(--line)] bg-[var(--panel)] px-3 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.18em] text-[var(--muted)]">
                {k === "S"
                  ? "Safety"
                  : k === "Q"
                    ? "Quality"
                    : k === "D"
                      ? "Delivery"
                      : "Cost"}
              </span>
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: toneColor(ev.sqdc[k].tone) }}
              />
            </div>
            <p className="mt-2 text-sm leading-snug text-[var(--ink)]">
              {ev.sqdc[k].why}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4 border border-[var(--line)] bg-[var(--bg-2)] px-3 py-3">
        <label className="flex items-center gap-3 text-sm">
          <span className="text-[var(--muted)]">Hour</span>
          <input
            type="range"
            min={0}
            max={11}
            value={shift.hourIndex}
            onChange={(e) =>
              setShift((s) => setHour(s, Number(e.target.value)))
            }
            className="w-48 accent-[var(--safety)]"
          />
          <span className="tabular font-medium">{hourLabel(shift.hourIndex)}</span>
        </label>
        <span className="text-sm text-[var(--muted)]">
          {shift.scenario === "peak" ? "Peak volume (+28%)" : "Normal volume"}
        </span>
        <span className="text-sm text-[var(--muted)]">
          {ev.presentCount} present · {ev.absentNames.length} call-outs
        </span>
        <span className="tabular text-sm text-[var(--muted)]">
          Labor this shift ${Math.round(cost.total).toLocaleString()} (OT $
          {Math.round(cost.overtime).toLocaleString()})
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            ["start", "Start here"],
            ["tour", "5-min tour"],
            ["glossary", "Glossary"],
            ["floor", "Floor"],
            ["huddle", "Huddle"],
            ["handoff", "Handoff"],
            ["issues", "Issues / 5-why"],
            ["about", "How it was made"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setPanel(id)}
            className={`px-3 py-1.5 text-xs tracking-wide ${
              panel === id
                ? "bg-[var(--safety)] text-[#1a1608]"
                : "border border-[var(--line)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === "start" && (
        <StartHerePanel
          onTour={() => setPanel("tour")}
          onSample={loadSample}
          onLive={loadLive}
        />
      )}

      {panel === "tour" && (
        <TourPanel onGoFloor={() => setPanel("floor")} />
      )}

      {panel === "glossary" && <GlossaryPanel />}

      {panel === "floor" && (
        <p className="mb-3 border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2 text-xs text-[var(--muted)]">
          <strong className="text-[var(--ink)]">How to use this tab:</strong>{" "}
          click a person, then click a path header to move them. Edit volume if
          the plan changes. Red assigned/required = short for this hour.
          Warnings on the right = your Gemba walk (floor walk) list.
        </p>
      )}

      {panel === "floor" && (
        <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
          <div>
            {ev.suggestion && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-[var(--safety)] bg-[var(--panel)] px-3 py-2 text-sm">
                <p>
                  Suggested move: {ev.suggestion.count} from {ev.suggestion.from}{" "}
                  → {ev.suggestion.to}. {ev.suggestion.why}
                </p>
                <button
                  type="button"
                  className="border border-[var(--safety)] px-2 py-1 text-xs"
                  onClick={() =>
                    setShift((s) => applySuggestion(s, ev.suggestion!))
                  }
                >
                  Apply move
                </button>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {PATHS.map((path) => {
                const p = ev.paths[path];
                const people = shift.associates.filter(
                  (a) => a.present && a.assigned === path,
                );
                return (
                  <section
                    key={path}
                    className="border border-[var(--line)] bg-[var(--panel)]"
                  >
                    <button
                      type="button"
                      onClick={() => place(path)}
                      className="flex w-full items-baseline justify-between border-b border-[var(--line)] px-3 py-2 text-left"
                    >
                      <span className="text-sm font-medium">
                        {PATH_LABEL[path]}
                      </span>
                      <span
                        className="tabular text-xs"
                        style={{
                          color: p.gap > 0 ? "var(--bad)" : "var(--ok)",
                        }}
                      >
                        {p.assigned}/{p.required} · {p.volume} u
                      </span>
                    </button>
                    <p className="px-3 pt-2 text-[11px] text-[var(--muted)]">
                      Target {TARGET_UPH[path]} UPH. Click header to place
                      selected person.
                    </p>
                    <label className="flex items-center gap-2 px-3 py-2 text-[11px] text-[var(--muted)]">
                      Volume this hour
                      <input
                        type="number"
                        className="w-20 border border-[var(--line)] bg-[var(--bg)] px-1 py-0.5 tabular text-[var(--ink)]"
                        value={p.volume}
                        onChange={(e) =>
                          setShift((s) =>
                            setVolume(
                              s,
                              path,
                              s.hourIndex,
                              Number(e.target.value),
                            ),
                          )
                        }
                      />
                    </label>
                    <ul className="max-h-64 overflow-auto px-2 pb-2">
                      {people.map((a) => (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(a.id)}
                            className={`mb-1 w-full px-2 py-1 text-left text-xs ${
                              selectedId === a.id
                                ? "bg-[var(--safety)] text-[#1a1608]"
                                : "bg-[var(--bg-2)]"
                            }`}
                          >
                            {a.name}
                            {a.pitDesignated ? " · PIT" : ""}
                            {a.tenureDays < 14 ? " · ramp" : ""}
                            {a.role === "pa" ? " · PA" : ""}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <section className="border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-medium">Unassigned / absent</h2>
                  <button
                    type="button"
                    className="text-xs text-[var(--muted)]"
                    onClick={() => place("unassigned")}
                  >
                    Park selected
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {shift.associates
                    .filter(
                      (a) => !a.present || a.assigned === "unassigned",
                    )
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedId(a.id)}
                        className={`px-2 py-1 text-xs ${
                          !a.present
                            ? "border border-[var(--bad)] text-[var(--bad)]"
                            : selectedId === a.id
                              ? "bg-[var(--safety)] text-[#1a1608]"
                              : "border border-[var(--line)]"
                        }`}
                      >
                        {a.name}
                        {!a.present ? " (out)" : ""}
                      </button>
                    ))}
                </div>
              </section>
              <section className="border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
                <h2 className="mb-2 text-sm font-medium">Dock doors</h2>
                <ul className="space-y-1 text-xs">
                  {shift.trucks.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between gap-2 border-b border-[var(--line)] py-1"
                    >
                      <span>
                        Door {t.door} · {t.carrier}
                        {t.exception ? `: ${t.exception}` : ""}
                      </span>
                      <span className="shrink-0 text-[var(--muted)]">
                        {t.status}
                        {t.delayMin ? ` +${t.delayMin}m` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <aside className="border border-[var(--line)] bg-[var(--panel)] px-3 py-3">
            <h2 className="text-sm font-medium">Warnings</h2>
            <ul className="mt-2 space-y-2 text-xs leading-snug">
              {ev.warnings.slice(0, 10).map((w) => (
                <li key={w.id} style={{ color: toneColor(w.tone) }}>
                  {w.text}
                </li>
              ))}
            </ul>
            {selected && (
              <div className="mt-4 border-t border-[var(--line)] pt-3 text-xs">
                <p className="font-medium">{selected.name}</p>
                <p className="text-[var(--muted)]">
                  {selected.role === "pa" ? "Process Assistant" : "Associate"} ·{" "}
                  {selected.tenureDays} days ·{" "}
                  {selected.pitDesignated ? "PIT designated" : "no PIT"} · WHMIS{" "}
                  {selected.whmis ? "yes" : "no"}
                </p>
                <p className="mt-1 text-[var(--muted)]">
                  Trained: {selected.pathsTrained.join(", ")}
                </p>
                <p className="text-[var(--muted)]">
                  Hours this week: {selected.hoursThisWeek} (ESA OT after{" "}
                  {ESA_OT_AFTER_HOURS})
                </p>
                {selected.note && (
                  <p className="mt-2 text-[var(--ink)]">{selected.note}</p>
                )}
              </div>
            )}
          </aside>
        </div>
      )}

      {panel === "huddle" && (
        <PreBlock
          title="Start-of-shift huddle (Min 15)"
          hint="Read this on the floor. It is generated from the current board, not from a canned speech."
          text={huddle}
        />
      )}

      {panel === "handoff" && (
        <PreBlock
          title="End-of-shift handoff"
          hint="What the next Area Manager should see. Close issues on the Issues tab before you leave if they are actually done."
          text={handoff}
        />
      )}

      {panel === "issues" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="border border-[var(--line)] bg-[var(--panel)] p-4">
            <h2 className="text-sm font-medium">Open / closed items</h2>
            <ul className="mt-3 space-y-2">
              {shift.issues.map((i) => (
                <li
                  key={i.id}
                  className="border border-[var(--line)] px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {i.kind} · {i.title}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-[var(--safety)]"
                      onClick={() => setShift((s) => toggleIssue(s, i.id))}
                    >
                      {i.open ? "Close" : "Reopen"}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {i.containment}
                  </p>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!issueTitle.trim()) return;
                setShift((s) =>
                  addIssue(s, issueTitle.trim(), "labor", "Logged from the floor."),
                );
                setIssueTitle("");
              }}
            >
              <input
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Log an issue…"
                className="flex-1 border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="border border-[var(--line)] px-3 py-1 text-xs"
              >
                Add
              </button>
            </form>
          </section>
          <section className="border border-[var(--line)] bg-[var(--panel)] p-4 text-sm">
            <h2 className="text-sm font-medium">Packed 5-why (sample shift)</h2>
            <p className="mt-2 text-[var(--muted)]">{rca.problem}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs">
              {rca.whys.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ol>
            <p className="mt-3 text-xs">
              <span className="text-[var(--muted)]">Containment: </span>
              {rca.containment}
            </p>
            <p className="mt-2 text-xs">
              <span className="text-[var(--muted)]">Corrective: </span>
              {rca.corrective}
            </p>
          </section>
        </div>
      )}

      {panel === "about" && <MadeWithPanel />}
    </div>
  );
}

function PreBlock({
  title,
  hint,
  text,
}: {
  title: string;
  hint: string;
  text: string;
}) {
  return (
    <section className="border border-[var(--line)] bg-[var(--panel)] p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
      <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[var(--ink)]">
        {text}
      </pre>
      <button
        type="button"
        className="mt-3 border border-[var(--line)] px-3 py-1 text-xs"
        onClick={() => void navigator.clipboard.writeText(text)}
      >
        Copy
      </button>
    </section>
  );
}
