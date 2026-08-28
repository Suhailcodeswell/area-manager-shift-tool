import osha from "@/data/osha_patterns.json";
import {
  BLS_WAREHOUSE_TRIR,
  ESA_OT_AFTER_HOURS,
  TARGET_UPH,
  WAGE_ASSOCIATE,
  WAGE_PIT,
} from "@/lib/calibration";
import { SAMPLE_SPEC } from "@/lib/demo-shift";
import { GLOSSARY, TOUR_STEPS } from "@/lib/glossary";

export function StartHerePanel({
  onTour,
  onSample,
  onLive,
}: {
  onTour: () => void;
  onSample: () => void;
  onLive: () => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="border border-[var(--safety)] bg-[var(--panel)] p-5">
        <h2 className="text-lg font-medium">What is this?</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          A shift tool for a warehouse Area Manager. You enter who showed up and
          how much volume is coming. It tells you if you are short on dock,
          stow, pick, or pack; blocks illegal forklift placements; warns on
          SQDC; and writes your huddle and handoff.
        </p>
        <p className="mt-3 text-sm leading-relaxed">
          Built for a <strong>fictional Canadian 3PL warehouse</strong>.{" "}
          <strong>Sample shift</strong> is a demo file with example numbers.{" "}
          <strong>New live shift</strong> is a blank board for your own inputs.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSample}
            className="border border-[var(--safety)] bg-[var(--safety)] px-3 py-2 text-xs font-medium text-[#1a1608]"
          >
            Load sample shift
          </button>
          <button
            type="button"
            onClick={onLive}
            className="border border-[var(--line)] px-3 py-2 text-xs"
          >
            New live shift
          </button>
          <button
            type="button"
            onClick={onTour}
            className="border border-[var(--line)] px-3 py-2 text-xs"
          >
            Jump to quick tour
          </button>
        </div>
      </section>
      <section className="border border-[var(--line)] bg-[var(--panel)] p-5">
        <h2 className="text-sm font-medium">If this looks confusing</h2>
        <p className="mt-2 text-xs text-[var(--muted)]">
          You are not reading a static dashboard. You are running one hour of a
          shift. Four things matter on the Floor tab:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm">
          <li>
            <strong>assigned/required:</strong> people on the path vs people
            needed for this hour&apos;s volume
          </li>
          <li>
            <strong>volume:</strong> units expected this hour (editable)
          </li>
          <li>
            <strong>warnings:</strong> right column, what will break if you
            ignore it
          </li>
          <li>
            <strong>suggested move:</strong> optional labor pull (you still
            decide)
          </li>
        </ol>
      </section>
    </div>
  );
}

export function TourPanel({ onGoFloor }: { onGoFloor: () => void }) {
  return (
    <section className="border border-[var(--line)] bg-[var(--panel)] p-5">
      <h2 className="text-lg font-medium">Quick tour</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Load the sample shift first, then follow these steps.
      </p>
      <ol className="mt-4 space-y-4">
        {TOUR_STEPS.map((step) => (
          <li key={step.title} className="border-l-2 border-[var(--safety)] pl-4">
            <p className="text-sm font-medium">{step.title}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{step.body}</p>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={onGoFloor}
        className="mt-5 border border-[var(--safety)] bg-[var(--safety)] px-3 py-2 text-xs font-medium text-[#1a1608]"
      >
        Go to Floor tab
      </button>
    </section>
  );
}

export function GlossaryPanel() {
  return (
    <section className="border border-[var(--line)] bg-[var(--panel)] p-5">
      <h2 className="text-lg font-medium">Terms on this screen</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Warehouse operations vocabulary used throughout the tool.
      </p>
      <dl className="mt-4 grid gap-3 md:grid-cols-2">
        {GLOSSARY.map((item) => (
          <div
            key={item.term}
            className="border border-[var(--line)] bg-[var(--bg-2)] px-3 py-2"
          >
            <dt className="text-sm font-medium text-[var(--safety)]">
              {item.term}
            </dt>
            <dd className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              {item.meaning}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function MadeWithPanel() {
  const topEvents = osha.events
    .filter((e) => e.label !== "(uncoded)")
    .slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="border border-[var(--line)] bg-[var(--panel)] p-5 text-sm leading-relaxed">
        <h2 className="text-lg font-medium">How this was made</h2>
        <p className="mt-2 text-[var(--muted)]">
          Live warehouse productivity and roster data are not public. This tool
          combines <strong>real public sources</strong> for rules and safety
          patterns with a <strong>labeled simulated shift</strong> for the demo.
        </p>
        <h3 className="mt-4 text-sm font-medium">Real data and public sources</h3>
        <ul className="mt-2 list-disc space-y-2 pl-4 text-xs text-[var(--muted)]">
          <li>
            <strong>OSHA ITA Case Detail 2024</strong> (NAICS 493110, US
            warehousing): {osha.case_count.toLocaleString()} incidents
            aggregated for safety huddle themes. No employer names.
          </li>
          <li>
            <strong>BLS SOII 2024</strong>: US warehousing TRIR benchmark{" "}
            {BLS_WAREHOUSE_TRIR} (industry context only).
          </li>
          <li>
            <strong>Job Bank / Ontario postings</strong>: associate $
            {WAGE_ASSOCIATE}/hr, PIT ${WAGE_PIT}/hr.
          </li>
          <li>
            <strong>Ontario ESA</strong>: overtime at 1.5x after{" "}
            {ESA_OT_AFTER_HOURS} hours per week.
          </li>
          <li>
            <strong>Published 3PL rate bands</strong>: pick target{" "}
            {TARGET_UPH.pick} UPH (mixed-SKU band, not single-client e-comm).
          </li>
        </ul>
        <h3 className="mt-4 text-sm font-medium">Simulated for the demo</h3>
        <ul className="mt-2 list-disc space-y-2 pl-4 text-xs text-[var(--muted)]">
          <li>
            Roster of {SAMPLE_SPEC.roster} associates ({SAMPLE_SPEC.pitDesignated}{" "}
            PIT-designated, {SAMPLE_SPEC.ramping} ramping).
          </li>
          <li>Hourly volume curve, dock appointments, call-outs, quality hold.</li>
          <li>
            Headcount requirements derived from volume divided by site UPH
            targets.
          </li>
        </ul>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Stack: Next.js, TypeScript, Tailwind. Decision logic in{" "}
          <code>lib/engine.ts</code> and <code>lib/calibration.ts</code>.
        </p>
      </section>
      <section className="border border-[var(--line)] bg-[var(--panel)] p-5 text-sm">
        <h2 className="text-sm font-medium">Top injury patterns (OSHA 2024)</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{osha.filter}</p>
        <ul className="mt-3 space-y-2 text-xs">
          {topEvents.map((e) => (
            <li key={e.label} className="flex justify-between gap-2">
              <span>{e.label}</span>
              <span className="tabular shrink-0 text-[var(--muted)]">
                {Math.round(e.share * 100)}%
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-[var(--muted)]">
          {osha.note} These patterns inform the safety theme in the huddle. They
          are not used to predict injuries for this shift.
        </p>
      </section>
    </div>
  );
}
