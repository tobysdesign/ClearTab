import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { addDays, addMonths, differenceInDays, startOfDay } from "@/lib/date-utils";
import styles from "./countdown-breakdown.module.css";
import countdownStyles from "./countdown-widget-main.module.css";

// Days-only dot grid for the narrow counter: one pink dot per remaining day (capped so
// a long countdown stays a tidy grid), auto-sized to fill its box like the main dot grid.
const MAX_DAY_DOTS = 49;
function DaysDotGrid({ count, gap = 6 }: { count: number; gap?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const n = Math.max(1, Math.min(count, MAX_DAY_DOTS));
    const ensure = () => {
      while (el.children.length < n) {
        const d = document.createElement("div");
        d.className = countdownStyles.dot;
        el.appendChild(d);
      }
      while (el.children.length > n) el.lastChild?.remove();
    };
    const bestGrid = (W: number, H: number, N: number, g: number) => {
      let best = { cols: N, size: 0 };
      for (let rows = 1; rows <= N; rows++) {
        const cols = Math.ceil(N / rows);
        const dotW = (W - g * (cols - 1)) / cols;
        const dotH = (H - g * (rows - 1)) / rows;
        const size = Math.floor(Math.min(dotW, dotH));
        if (size > best.size) best = { cols, size };
      }
      return best;
    };
    const layout = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      ensure();
      const { cols, size } = bestGrid(W, H, n, gap);
      const s = Math.max(2, size);
      el.style.gap = `${gap}px`;
      el.style.gridTemplateColumns = `repeat(${cols}, ${s}px)`;
      el.style.setProperty("--dot-size", `${s}px`);
    };
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    layout();
    return () => ro.disconnect();
  }, [count, gap]);
  return (
    <div
      ref={ref}
      className={countdownStyles.dotsGrid}
      style={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}
      aria-hidden="true"
    />
  );
}

/*
 * The counter's main view (Figma: ClearTab, node 1607:4396 + widget mock):
 * months / weeks / days as dot columns, "1 + 1 + 1" under them, then "Until <title>".
 * Each column fills pink from the end, one dot per unit left (11 month dots, 4 week
 * dots, 7 day dots). Each number sits under its column's pink dot.
 *
 * Numbers and labels keep their design size. When space is short the dot grids
 * reflow (4 rows -> 3 -> 2, getting wider). If the full grids would still have to
 * shrink, the "done" dots are dropped and only the remaining (pink) dots show, which
 * needs far less room. Dots shrink only as a last resort.
 */

const MONTH_DOTS = 11;
const WEEK_DOTS = 4;
const DAY_DOTS = 7;

// Below this many total days left, drop the grey "done" dots and show only the remaining
// pink dots (across whatever units are shown).
const REMAINING_ONLY_BELOW_DAYS = 30;

// Design sizes (px)
const DOT = 24.73;
const DOT_GAP = 4;
const LABEL_HEIGHT = 50; // number (36px) + gap + unit (14px)
const COLUMN_GAP = 10; // dots -> number
const BODY_GAP = 14; // columns -> title
const TITLE_HEIGHT = 22;
const UNTIL_HEIGHT = 18;
const PLUS_WIDTH = 28;
const LABEL_WIDTH = 52; // widest unit word ("Months") at 14px
const ROW_OPTIONS = [4, 3, 2] as const;
const COMPACT_ROW_OPTIONS = [4, 3, 2, 1] as const;

type Rows = (typeof COMPACT_ROW_OPTIONS)[number];

// Calendar months first, then whole weeks, then days, so the parts add up exactly
// to the target date
export function breakdownDaysLeft(daysLeft: number, from: Date = new Date()) {
  const today = startOfDay(from);
  const target = addDays(today, Math.max(0, daysLeft));
  let months = 0;
  while (addMonths(today, months + 1).getTime() <= target.getTime()) months += 1;
  const leftover = differenceInDays(target, addMonths(today, months));
  return { months, weeks: Math.floor(leftover / 7), days: leftover % 7 };
}

type Unit = {
  key: "months" | "weeks" | "days";
  value: number;
  total: number;
  singular: string;
  plural: string;
  spoken: string;
};

// Dots a unit draws: the whole grid, or only what's left in compact mode
function dotCount(unit: Unit, compact: boolean) {
  return compact ? unit.value : unit.total;
}

// Best row count for the biggest dots (design size max), preferring taller grids on a tie
function bestRows(width: number, height: number, units: Unit[], compact: boolean) {
  let best = { rows: 4 as Rows, dot: 0 };
  for (const rows of compact ? COMPACT_ROW_OPTIONS : ROW_OPTIONS) {
    const colsFor = (unit: Unit) => Math.max(1, Math.ceil(dotCount(unit, compact) / rows));
    const across = units.reduce((sum, unit) => sum + colsFor(unit), 0);
    const columnGaps = units.reduce((sum, unit) => sum + (colsFor(unit) - 1) * DOT_GAP, 0);
    // A column is as wide as its dots or its label, whichever is wider
    const widthFor = (dot: number) =>
      units.reduce((sum, unit) => {
        const cols = colsFor(unit);
        return sum + Math.max(cols * dot + (cols - 1) * DOT_GAP, LABEL_WIDTH);
      }, 0) + PLUS_WIDTH * (units.length - 1);
    const byHeight =
      (height - LABEL_HEIGHT - COLUMN_GAP - BODY_GAP - TITLE_HEIGHT - (rows - 1) * DOT_GAP) / rows;
    let dot = Math.max(4, Math.min(DOT, byHeight, (width - PLUS_WIDTH * (units.length - 1) - columnGaps) / across));
    // Narrow labels can still overflow: shrink until the whole row fits
    while (dot > 4 && widthFor(dot) > width) dot -= 0.5;
    if (dot > best.dot + 0.25) best = { rows, dot };
  }
  return best;
}

// Narrowest the side-by-side columns can get: each column is at least a unit
// word wide ("Months"), plus the "+" between them.
function minRowWidth(units: Unit[]) {
  return units.length * LABEL_WIDTH + PLUS_WIDTH * (units.length - 1);
}

// Full grids if they fit at design size; otherwise only the remaining dots.
// Too narrow for even the columns -> stack the numbers vertically, drop the dots.
function chooseLayout(width: number, height: number, units: Unit[], daysLeft: number) {
  // Use the days-only view (one dot per day + the total + "Days until <title>") whenever
  // the widget is short (< 180px tall), regardless of width, or too narrow for the
  // side-by-side months/weeks/days breakdown. The full breakdown needs more height than
  // that to read cleanly.
  if (height < 180 || width < minRowWidth(units)) {
    const daysHorizontal = height < 170;
    return {
      rows: 1 as Rows,
      dot: DOT,
      compact: true,
      stacked: true,
      daysHorizontal,
      showUntil: true,
    };
  }
  // Short countdowns (under REMAINING_ONLY_BELOW_DAYS): show just the remaining pink dots
  // rather than full grids with the past days greyed out.
  let compact = daysLeft < REMAINING_ONLY_BELOW_DAYS;
  let best = bestRows(width, height, units, compact);
  if (!compact && best.dot < DOT - 0.1) {
    compact = true;
    best = bestRows(width, height, units, true);
  }
  const used =
    best.rows * best.dot + (best.rows - 1) * DOT_GAP + LABEL_HEIGHT + COLUMN_GAP + BODY_GAP + TITLE_HEIGHT;
  return { ...best, compact, stacked: false, daysHorizontal: false, showUntil: height - used >= UNTIL_HEIGHT };
}

// ── Playful dot animations ────────────────────────────────────────────────
// A random variant plays on hover and ~once a minute, rippling out from a random
// dot with a little per-dot variance so no two runs look the same. Transform/opacity
// only (compositor-friendly); WAAPI with the default fill reverts cleanly, so there's
// no state to tear down. Respects prefers-reduced-motion.
const DOT_ANIM_VARIANTS = ["ripple", "wave", "pop", "jitter", "breathe"] as const;
type DotAnimVariant = (typeof DOT_ANIM_VARIANTS)[number];
const DOT_ANIM_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // ease-out-quint

function dotKeyframes(variant: DotAnimVariant): Keyframe[] {
  const j3 = () => `${(Math.random() * 2 - 1) * 3}px`;
  switch (variant) {
    case "ripple":
      return [{ transform: "scale(1)" }, { transform: "scale(1.4)" }, { transform: "scale(1)" }];
    case "wave":
      return [{ transform: "translateY(0)" }, { transform: "translateY(-7px)" }, { transform: "translateY(0)" }];
    case "pop":
      return [
        { transform: "scale(1)", offset: 0 },
        { transform: "scale(1.5)", offset: 0.4 },
        { transform: "scale(0.9)", offset: 0.7 },
        { transform: "scale(1)", offset: 1 },
      ];
    case "jitter":
      return [
        { transform: "translate(0,0)" },
        { transform: `translate(${j3()}, ${j3()})` },
        { transform: `translate(${j3()}, ${j3()})` },
        { transform: `translate(${j3()}, ${j3()})` },
        { transform: "translate(0,0)" },
      ];
    case "breathe":
      return [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(1.18)", opacity: 0.8 },
        { transform: "scale(1)", opacity: 1 },
      ];
  }
}

function playDotAnimation(container: HTMLElement) {
  const dots = Array.from(container.querySelectorAll<HTMLElement>("[data-filled]"));
  if (!dots.length) return;
  const variant = DOT_ANIM_VARIANTS[Math.floor(Math.random() * DOT_ANIM_VARIANTS.length)];
  const origin = Math.floor(Math.random() * dots.length); // ripple out from a random dot
  const perDot = variant === "breathe" ? 0 : 65; // breathe pulses together
  const baseDur = variant === "jitter" ? 480 : variant === "breathe" ? 900 : 640;
  for (let i = 0; i < dots.length; i++) {
    const order = Math.abs(i - origin);
    dots[i].animate(dotKeyframes(variant), {
      duration: baseDur + Math.random() * 160,
      delay: order * perDot + Math.random() * 40,
      easing: DOT_ANIM_EASE,
    });
  }
}

function Dots({ unit, rows, compact }: { unit: Unit; rows: Rows; compact: boolean }) {
  const total = Math.min(dotCount(unit, compact), unit.total);
  const firstFilled = total - Math.min(unit.value, total);
  const cols = Math.max(1, Math.ceil(total / rows));
  return (
    <div
      className={`${styles.dots} ${styles[`${unit.key}Dots`]}`}
      data-cols={cols}
      aria-hidden="true"
    >
      {Array.from({ length: total }, (_, i) => {
        const filled = i >= firstFilled;
        return (
          <span
            key={i}
            className={filled ? styles.dotFilled : styles.dot}
            {...(filled ? { "data-filled": "" } : {})}
          />
        );
      })}
    </div>
  );
}

export function CountdownBreakdown({ daysLeft, title }: { daysLeft: number; title: string }) {
  const { months, weeks, days } = breakdownDaysLeft(daysLeft);
  const allUnits: Unit[] = [
    { key: "months", value: months, total: MONTH_DOTS, singular: "Month", plural: "Months", spoken: "month" },
    { key: "weeks", value: weeks, total: WEEK_DOTS, singular: "Week", plural: "Weeks", spoken: "week" },
    { key: "days", value: days, total: DAY_DOTS, singular: "Day", plural: "Days", spoken: "day" },
  ];
  // Drop leading zero units ("1 Week + 3 Days", "3 Days"); days always shows
  const firstShown = allUnits.findIndex((unit) => unit.value > 0 || unit.key === "days");
  const units = allUnits.slice(firstShown);
  const unitKeys = units.map((unit) => unit.key).join(",");

  const spoken = units
    .filter((unit) => unit.value > 0)
    .map((unit) => `${unit.value} ${unit.spoken}${unit.value === 1 ? "" : "s"}`)
    .join(", ");

  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ rows: Rows; dot: number; compact: boolean; stacked: boolean; daysHorizontal: boolean; showUntil: boolean }>({
    rows: 4,
    dot: DOT,
    compact: false,
    stacked: false,
    daysHorizontal: false,
    showUntil: true,
  });

  // Measure before paint (and on resize) so the first frame already has the final layout
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { clientWidth, clientHeight } = el;
      if (!clientWidth || !clientHeight) return;
      const next = chooseLayout(clientWidth, clientHeight, units, daysLeft);
      setLayout((prev) =>
        prev.rows === next.rows &&
        prev.compact === next.compact &&
        prev.stacked === next.stacked &&
        prev.daysHorizontal === next.daysHorizontal &&
        Math.abs(prev.dot - next.dot) < 0.1 &&
        prev.showUntil === next.showUntil
          ? prev
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // units only change with which columns are shown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitKeys, months, weeks, days, daysLeft]);

  // The dot size is the one value CSS can't derive, so it's passed as a custom property
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--dot", `${layout.dot}px`);
  }, [layout.dot]);

  // Play a random dot animation on hover and, as ambient life, roughly once a minute.
  // Cooldown prevents a hover from retriggering mid-run; reduced-motion opts out.
  const lastPlayRef = useRef(0);
  const playDots = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const now = Date.now();
    if (now - lastPlayRef.current < 1500) return;
    lastPlayRef.current = now;
    playDotAnimation(el);
  }, []);

  useEffect(() => {
    const id = window.setInterval(playDots, 60_000);
    return () => window.clearInterval(id);
  }, [playDots]);

  // Too narrow for the side-by-side breakdown: show the total days left as a single
  // number with a dot grid on top (chosen over stacking the months/weeks/days).
  if (layout.stacked) {
    return (
      <div ref={ref} className={styles.breakdown} onMouseEnter={playDots}>
        <div
          className={styles.daysOnly}
          role="img"
          aria-label={`${daysLeft} day${daysLeft === 1 ? "" : "s"} until ${title}`}
        >
          <DaysDotGrid count={daysLeft} />
          {/* number on the left, "Days until <title>" on the right */}
          <div className={styles.daysFooter}>
            <div className={styles.daysNumber}>{daysLeft}</div>
            <p className={styles.daysCaption}>
              <span className={styles.untilLabel}>Day{daysLeft === 1 ? "" : "s"} until</span>
              <span className={styles.title}>{title}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={styles.breakdown} onMouseEnter={playDots}>
      <div
        className={styles.body}
        data-rows={layout.rows}
        data-compact={layout.compact}
        data-stacked={layout.stacked}
        data-units={units.length}
        role="img"
        aria-label={`${spoken || "0 days"} until ${title}`}
      >
        <div className={styles.columns}>
          {units.map((unit, i) => (
            <Fragment key={unit.key}>
              {i > 0 && (
                <span className={styles.plus} aria-hidden="true">
                  +
                </span>
              )}
              <div className={`${styles.column} ${styles[`${unit.key}Column`]}`}>
                <Dots unit={unit} rows={layout.rows} compact={layout.compact} />
                <div className={styles.label} aria-hidden="true">
                  <span className={styles.value}>{unit.value}</span>
                  <span className={styles.unit}>{unit.value === 1 ? unit.singular : unit.plural}</span>
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        {/* Stacked "Until / title" when there's room, otherwise one line: "until title" */}
        <p className={styles.until} data-inline={!layout.showUntil}>
          <span className={styles.untilLabel}>{layout.showUntil ? "Until" : "until"}</span>
          <span className={styles.title}>{title}</span>
        </p>
      </div>
    </div>
  );
}
