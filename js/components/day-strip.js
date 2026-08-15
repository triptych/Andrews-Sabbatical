import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';
import { store } from '../store.js';
import { EVENTS } from '../data/events.js';
import { PLACES } from '../data/places.js';
import { DAYS, TOTAL_DAYS, formatLong, formatShort, formatRange, status, today, inWindow } from '../dates.js';

const css = String.raw;

/* Must match SAVED_EVENTS_KEY in store.js — the ids of events saved from
   What's On, read the same way event-list.js does. */
const SAVED_KEY = 'sabbatical:events';

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: block;
    position: relative;
    max-width: 1180px;
    margin: 2rem auto 2.5rem;
  }

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.6rem;
    flex-wrap: wrap;
  }

  .reading {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-soft);
    font-variant-numeric: tabular-nums;
  }

  .reading b {
    color: var(--ink);
    font-weight: 600;
  }

  .reading .focused {
    color: var(--cranberry);
    font-weight: 600;
  }

  /* The strip itself: one block per day, anchored to a baseline like a
     tally sheet. Height still carries the broad-strokes state (elapsed,
     written up, today); the small bars stacked inside each block carry
     the finer-grained detail — what's actually happening that day. */
  .strip {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 46px;
    padding: 0;
    margin: 0;
    border-bottom: 1px solid var(--line);
    list-style: none;
  }

  .tick {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 100%;
    transition: opacity var(--transition);
  }

  .tick[data-dim='true'] {
    opacity: 0.22;
  }

  .block {
    position: relative;
    width: 100%;
    height: 10px;
    padding: 0;
    border: 0;
    border-radius: 1px 1px 0 0;
    background: var(--line);
    transition: height var(--transition), background var(--transition);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 1px;
  }

  .block:hover,
  .block:focus-visible {
    background: var(--kelp-soft);
  }

  /* elapsed but empty */
  .tick[data-state='past'] .block {
    background: var(--kelp-soft);
    height: 16px;
  }

  /* something written */
  .tick[data-state='logged'] .block {
    background: var(--kelp);
    height: 34px;
  }

  /* planned ahead */
  .tick[data-state='planned'] .block {
    background: var(--cranberry);
    height: 22px;
  }

  .tick[data-today='true'] .block {
    background: var(--ink);
    height: 46px;
    border-radius: 1px;
  }

  /* The day currently focused (via the strip or the journal) — a ring
     around the block so it reads distinctly from "today" when the two
     diverge, and stacks visibly when they're the same day. */
  .tick[data-focused='true'] .block {
    box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--cranberry);
  }

  /* Small bars stacked inside the block — one per kind of thing on that
     day. Multiple can show at once: a day can be written up *and* have an
     event *and* sit inside a goal's date range. */
  .bars {
    position: absolute;
    left: 1px;
    right: 1px;
    bottom: 2px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    pointer-events: none;
  }

  .bar {
    height: 2px;
    border-radius: 1px;
    background: var(--paper);
    opacity: 0.9;
  }

  .bar--event { background: var(--tide); }
  .bar--goal { background: var(--sand); }
  .bar--planned { background: var(--cranberry); }
  .bar--logged { background: var(--kelp); }

  /* On the today/logged/planned blocks the block color already carries
     that meaning, so only show bars for the *other* kinds of thing to
     avoid a bar sitting invisibly on a same-colored block. */
  .tick[data-state='logged'] .bar--logged,
  .tick[data-state='planned'] .bar--planned,
  .tick[data-today='true'] .bar--logged,
  .tick[data-today='true'] .bar--planned {
    display: none;
  }

  .scale {
    display: flex;
    justify-content: space-between;
    margin-top: 0.4rem;
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-faint);
  }

  .legend {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.7rem;
  }

  .filter {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.22rem 0.6rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-soft);
    transition: all var(--transition);
  }

  .filter[aria-pressed='true'] {
    background: var(--fog);
    border-color: var(--ink-faint);
    color: var(--ink);
  }

  .filter--static {
    cursor: default;
  }

  .swatch {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--line);
    flex: none;
  }

  .swatch--logged { background: var(--kelp); }
  .swatch--planned { background: var(--cranberry); }
  .swatch--event { background: var(--tide); }
  .swatch--goal { background: var(--sand); }
  .swatch--today { background: var(--ink); }
  .swatch--focused {
    background: var(--paper);
    box-shadow: 0 0 0 2px var(--cranberry);
  }

  /* ——— tooltip ——— */

  .tooltip {
    position: fixed;
    z-index: 70;
    max-width: 15rem;
    padding: 0.55rem 0.7rem;
    background: var(--ink);
    color: var(--paper);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lift);
    font-size: 0.8125rem;
    line-height: 1.4;
    pointer-events: none;
    transform: translate(-50%, calc(-100% - 10px));
  }

  .tooltip[hidden] {
    display: none;
  }

  .tooltip strong {
    display: block;
    font-family: var(--display);
    font-size: 0.875rem;
    margin-bottom: 0.15rem;
  }

  .tooltip ul {
    list-style: none;
    margin: 0.2rem 0 0;
    padding: 0;
    display: grid;
    gap: 0.15rem;
  }

  .tooltip li {
    display: flex;
    align-items: baseline;
    gap: 0.4em;
  }

  .tooltip li i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex: none;
    background: var(--paper);
    opacity: 0.6;
  }

  .tooltip .empty {
    color: var(--fog);
    opacity: 0.8;
    padding: 0;
    border: 0;
    text-align: left;
  }

  @media (max-width: 480px) {
    :host {
      margin: 1.5rem auto 2rem;
    }

    .strip {
      gap: 1px;
      height: 38px;
    }

    .tick[data-today='true'] .block {
      height: 38px;
    }

    .legend {
      gap: 0.3rem;
    }

    .filter {
      font-size: 0.625rem;
      padding: 0.18rem 0.5rem;
    }
  }
`);

/**
 * A 32-block tally of the sabbatical. Each block is one day; height and
 * color carry the broad state (elapsed, written up, today), and up to four
 * small bars inside the block carry finer detail: a journal entry, a
 * planned place visit, an event, or a goal whose date range includes that
 * day. Hovering or focusing a block shows a tooltip with the specifics.
 * Clicking a block asks the journal to open that day.
 */
export class DayStrip extends HTMLElement {
  #unsubscribe = [];
  #logged = new Set();
  /** @type {Map<string, string>} day -> place name */
  #planned = new Map();
  /** @type {Map<string, {name:string,start:string,end?:string}[]>} */
  #events = new Map();
  /** @type {Map<string, {text:string,start:string,end?:string}[]>} */
  #goals = new Map();
  #filter = null;
  #hideTimer = null;
  /** The day the app is currently pointed at — defaults to today on load
   * (clamped into the sabbatical window if today falls outside it), and
   * follows wherever the journal is asked to open. */
  #focused = inWindow(today()) ? today() : DAYS[0];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.#render();
    }

    this.refresh();

    this.#unsubscribe.push(
      bus.on('entries:changed', () => this.refresh()),
      bus.on('places:changed', () => this.refresh()),
      bus.on('goals:changed', () => this.refresh()),
      bus.on('events:changed', () => this.refresh()),
      bus.on('events:restored', () => this.refresh()),
      bus.on('journal:open-day', (event) => {
        this.#focused = event.detail.date;
        this.#paint();
      }),
    );
  }

  disconnectedCallback() {
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
  }

  /** Re-read stored data and repaint the strip. Uses allSettled rather than
   * all — one store failing to read shouldn't blank out the other three,
   * or leave the whole strip silently stuck showing stale data. */
  async refresh() {
    const results = await Promise.allSettled([
      store.all('entries'),
      store.all('placeState'),
      store.all('goals'),
      store.all('customEvents'),
    ]);
    const names = ['entries', 'places', 'goals', 'your events'];
    const [entries, placeState, goals, customEvents] = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      console.error(`day-strip: could not load ${names[i]}`, r.reason);
      return [];
    });
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) {
      bus.emit('layout:toast', `The day strip couldn't fully refresh (${failed} of 4 lists failed to load) — check the browser console`);
    }

    this.#logged = new Set(entries.map((entry) => entry.date));

    this.#planned = new Map();
    for (const place of placeState) {
      if (!place.plannedDate) continue;
      const found = PLACES.find((p) => p.id === place.id);
      this.#planned.set(place.plannedDate, found?.name ?? 'a place');
    }

    let saved = new Set();
    try {
      saved = new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]'));
    } catch {
      saved = new Set();
    }

    const yourEvents = [
      ...EVENTS.filter((event) => saved.has(event.id)),
      ...customEvents,
    ];

    this.#events = new Map();
    for (const event of yourEvents) {
      for (const day of daysInRange(event.start, event.end)) {
        const list = this.#events.get(day) ?? [];
        list.push({ name: event.name, start: event.start, end: event.end });
        this.#events.set(day, list);
      }
    }

    this.#goals = new Map();
    for (const goal of goals) {
      if (!goal.start) continue;
      for (const day of daysInRange(goal.start, goal.end)) {
        const list = this.#goals.get(day) ?? [];
        list.push({ text: goal.text, start: goal.start, end: goal.end });
        this.#goals.set(day, list);
      }
    }

    this.#paint();
  }

  #render() {
    const ticks = DAYS.map(
      (key, index) => `
        <li class="tick" data-day="${key}">
          <button type="button" class="block" data-day="${key}">
            <span class="visually-hidden">Day ${index + 1}, ${formatLong(key)}</span>
            <span class="bars"></span>
          </button>
        </li>`,
    ).join('');

    this.shadowRoot.innerHTML = `
      <div class="head">
        <span class="eyebrow">The count</span>
        <span class="reading" id="reading"></span>
      </div>
      <ol class="strip" id="strip">${ticks}</ol>
      <div class="scale">
        <span>Sep 8</span>
        <span>Sep 24</span>
        <span>Oct 9</span>
      </div>
      <div class="legend" id="legend">
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="busy">
          <i class="swatch"></i> anything
        </button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="logged">
          <i class="swatch swatch--logged"></i> written up
        </button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="planned">
          <i class="swatch swatch--planned"></i> booked
        </button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="event">
          <i class="swatch swatch--event"></i> event
        </button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="goal">
          <i class="swatch swatch--goal"></i> goal
        </button>
        <span class="filter filter--static">
          <i class="swatch swatch--today"></i> today
        </span>
        <span class="filter filter--static">
          <i class="swatch swatch--focused"></i> focused
        </span>
      </div>
      <div class="tooltip" id="tooltip" role="tooltip" hidden></div>
    `;

    const strip = this.shadowRoot.querySelector('#strip');
    strip.addEventListener('click', (event) => {
      const day = event.target.closest('button')?.dataset.day;
      if (day) bus.emit('journal:open-day', { date: day });
    });
    strip.addEventListener('mouseover', (event) => {
      const button = event.target.closest('.block');
      if (button) this.#showTooltip(button);
    });
    strip.addEventListener('mouseout', (event) => {
      const button = event.target.closest('.block');
      if (button && !button.contains(event.relatedTarget)) this.#hideTooltip();
    });
    strip.addEventListener('focusin', (event) => {
      const button = event.target.closest('.block');
      if (button) this.#showTooltip(button);
    });
    strip.addEventListener('focusout', (event) => {
      const button = event.target.closest('.block');
      if (button) this.#hideTooltip();
    });

    this.shadowRoot.querySelector('#legend').addEventListener('click', (event) => {
      const filter = event.target.closest('.filter[data-filter]');
      if (!filter) return;
      const on = filter.getAttribute('aria-pressed') === 'true';
      for (const other of this.shadowRoot.querySelectorAll('.filter[data-filter]')) {
        other.setAttribute('aria-pressed', 'false');
      }
      filter.setAttribute('aria-pressed', String(!on));
      this.#filter = on ? null : filter.dataset.filter;
      this.#applyFilter();
    });
  }

  #dayInfo(day) {
    return {
      logged: this.#logged.has(day),
      planned: this.#planned.get(day) ?? null,
      events: this.#events.get(day) ?? [],
      goals: this.#goals.get(day) ?? [],
    };
  }

  #showTooltip(button) {
    clearTimeout(this.#hideTimer);
    const day = button.dataset.day;
    const info = this.#dayInfo(day);
    const tooltip = this.shadowRoot.querySelector('#tooltip');

    const items = [];
    if (info.logged) items.push('<li><i></i> Written up</li>');
    if (info.planned) items.push(`<li><i></i> Planned — ${escapeHtml(info.planned)}</li>`);
    for (const event of info.events) {
      items.push(
        `<li><i></i> ${escapeHtml(event.name)}${
          event.end && event.end !== event.start ? ` (${escapeHtml(formatRange(event.start, event.end))})` : ''
        }</li>`,
      );
    }
    for (const goal of info.goals) {
      items.push(
        `<li><i></i> Goal — ${escapeHtml(goal.text)}${
          goal.end && goal.end !== goal.start ? ` (${escapeHtml(formatRange(goal.start, goal.end))})` : ''
        }</li>`,
      );
    }

    tooltip.innerHTML = `
      <strong>${escapeHtml(formatLong(day))}</strong>
      ${items.length > 0 ? `<ul>${items.join('')}</ul>` : '<p class="empty">Nothing here yet</p>'}
    `;

    const rect = button.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top}px`;
    tooltip.hidden = false;
  }

  #hideTooltip() {
    clearTimeout(this.#hideTimer);
    this.#hideTimer = setTimeout(() => {
      this.shadowRoot.querySelector('#tooltip').hidden = true;
    }, 60);
  }

  /** Dim ticks that don't match the active filter, without removing them —
   * position in the strip is part of what a tick communicates. */
  #applyFilter() {
    for (const tick of this.shadowRoot.querySelectorAll('.tick')) {
      const day = tick.dataset.day;
      const info = this.#dayInfo(day);
      const busy = info.logged || info.planned || info.events.length > 0 || info.goals.length > 0;

      let match = true;
      if (this.#filter === 'busy') match = busy;
      else if (this.#filter === 'logged') match = info.logged;
      else if (this.#filter === 'planned') match = Boolean(info.planned);
      else if (this.#filter === 'event') match = info.events.length > 0;
      else if (this.#filter === 'goal') match = info.goals.length > 0;

      tick.dataset.dim = String(this.#filter !== null && !match);
    }
  }

  #paint() {
    const now = today();
    const state = status();

    for (const tick of this.shadowRoot.querySelectorAll('.tick')) {
      const day = tick.dataset.day;
      const info = this.#dayInfo(day);

      let value = 'future';
      if (info.logged) value = 'logged';
      else if (info.planned) value = 'planned';
      else if (day < now) value = 'past';

      tick.dataset.state = value;
      tick.dataset.today = String(day === now);
      tick.dataset.focused = String(day === this.#focused);

      const bars = tick.querySelector('.bars');
      bars.innerHTML = [
        info.logged ? '<i class="bar bar--logged"></i>' : '',
        info.planned ? '<i class="bar bar--planned"></i>' : '',
        info.events.length > 0 ? '<i class="bar bar--event"></i>' : '',
        info.goals.length > 0 ? '<i class="bar bar--goal"></i>' : '',
      ].join('');

      const parts = [formatLong(day)];
      if (info.logged) parts.push('written up');
      if (info.planned) parts.push(`planned: ${info.planned}`);
      if (info.events.length) parts.push(`${info.events.length} event${info.events.length > 1 ? 's' : ''}`);
      if (info.goals.length) parts.push(`${info.goals.length} goal${info.goals.length > 1 ? 's' : ''}`);
      tick.querySelector('.block').setAttribute('aria-label', parts.join(' — '));
    }

    this.#applyFilter();

    const reading = this.shadowRoot.querySelector('#reading');
    const written = this.#logged.size;

    let text;
    if (state.phase === 'before') {
      text = `starts in <b>${state.untilStart}</b> days &middot; <b>${this.#planned.size}</b> planned`;
    } else if (state.phase === 'during') {
      text = `day <b>${state.dayNumber}</b> of ${TOTAL_DAYS} &middot; <b>${state.remaining}</b> left &middot; <b>${written}</b> written up`;
    } else {
      text = `finished &middot; <b>${written}</b> of ${TOTAL_DAYS} days written up`;
    }

    const focusLabel = formatShort(this.#focused);
    const focusNote = this.#focused === now
      ? `looking at <span class="focused">today</span>, ${escapeHtml(focusLabel)}`
      : `looking at <span class="focused">${escapeHtml(focusLabel)}</span>`;
    reading.innerHTML = `${text} &middot; ${focusNote}`;
  }
}

/** Every DAYS key from start to (end ?? start), inclusive, clipped to the window. */
function daysInRange(start, end) {
  const last = end ?? start;
  return DAYS.filter((day) => day >= start && day <= last);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

customElements.define('day-strip', DayStrip);
