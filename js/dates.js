/**
 * Date handling for a fixed 32-day window.
 *
 * Everything is stored and compared as a plain YYYY-MM-DD string so a trip
 * across a timezone boundary can't shift which day an entry belongs to.
 */

export const START = '2026-09-08';
export const END = '2026-10-09';

/** YYYY-MM-DD for a Date, in local time. */
export function toKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse a YYYY-MM-DD key into a local-midnight Date. */
export function fromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days between two keys; negative if `b` is before `a`. */
export function daysBetween(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86_400_000);
}

/** Every day in the window, oldest first. */
export const DAYS = (() => {
  const out = [];
  const total = daysBetween(START, END);
  for (let i = 0; i <= total; i += 1) {
    const date = fromKey(START);
    date.setDate(date.getDate() + i);
    out.push(toKey(date));
  }
  return out;
})();

export const TOTAL_DAYS = DAYS.length;

/** Today as a key. */
export function today() {
  return toKey(new Date());
}

/** True if a key falls inside the sabbatical. */
export function inWindow(key) {
  return key >= START && key <= END;
}

const LONG = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** "Tuesday, September 8" */
export function formatLong(key) {
  return LONG.format(fromKey(key));
}

/** "Sep 8" */
export function formatShort(key) {
  return SHORT.format(fromKey(key));
}

/** "Sep 12 – 13" for a range, "Sep 12" for a single day. */
export function formatRange(start, end) {
  if (!end || end === start) return formatShort(start);
  return `${formatShort(start)} – ${formatShort(end).replace(/^\w+ /, (m) =>
    fromKey(start).getMonth() === fromKey(end).getMonth() ? '' : m,
  )}`;
}

/**
 * Where the sabbatical stands relative to today.
 * @returns {{phase:'before'|'during'|'after', dayNumber:number, remaining:number, untilStart:number}}
 */
export function status() {
  const now = today();
  const untilStart = daysBetween(now, START);
  if (untilStart > 0) {
    return { phase: 'before', dayNumber: 0, remaining: TOTAL_DAYS, untilStart };
  }
  const past = daysBetween(END, now);
  if (past > 0) {
    return { phase: 'after', dayNumber: TOTAL_DAYS, remaining: 0, untilStart: 0 };
  }
  const dayNumber = daysBetween(START, now) + 1;
  return {
    phase: 'during',
    dayNumber,
    remaining: TOTAL_DAYS - dayNumber,
    untilStart: 0,
  };
}
