import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { addDays, addMonths, differenceInDays, startOfDay } from "@/lib/date-utils";
import styles from "./countdown-breakdown.module.css";

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

// Full grids if they fit at design size; otherwise only the remaining dots
function chooseLayout(width: number, height: number, units: Unit[]) {
  let compact = false;
  let best = bestRows(width, height, units, false);
  if (best.dot < DOT - 0.1) {
    compact = true;
    best = bestRows(width, height, units, true);
  }
  const used =
    best.rows * best.dot + (best.rows - 1) * DOT_GAP + LABEL_HEIGHT + COLUMN_GAP + BODY_GAP + TITLE_HEIGHT;
  return { ...best, compact, showUntil: height - used >= UNTIL_HEIGHT };
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
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i >= firstFilled ? styles.dotFilled : styles.dot} />
      ))}
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
  const [layout, setLayout] = useState<{ rows: Rows; dot: number; compact: boolean; showUntil: boolean }>({
    rows: 4,
    dot: DOT,
    compact: false,
    showUntil: true,
  });

  // Measure before paint (and on resize) so the first frame already has the final layout
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { clientWidth, clientHeight } = el;
      if (!clientWidth || !clientHeight) return;
      const next = chooseLayout(clientWidth, clientHeight, units);
      setLayout((prev) =>
        prev.rows === next.rows &&
        prev.compact === next.compact &&
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
  }, [unitKeys, months, weeks, days]);

  // The dot size is the one value CSS can't derive, so it's passed as a custom property
  useLayoutEffect(() => {
    ref.current?.style.setProperty("--dot", `${layout.dot}px`);
  }, [layout.dot]);

  return (
    <div ref={ref} className={styles.breakdown}>
      <div
        className={styles.body}
        data-rows={layout.rows}
        data-compact={layout.compact}
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
