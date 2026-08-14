import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';
import { store } from '../store.js';
import { EVENTS, NEAR_MISSES } from '../data/events.js';
import { formatDrive } from '../data/places.js';
import { formatLong, formatShort, today } from '../dates.js';

const css = String.raw;

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: block;
  }

  .intro {
    max-width: var(--measure);
    color: var(--ink-soft);
    font-size: 0.9375rem;
    margin-bottom: 1.5rem;
  }

  .controls {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    align-items: center;
  }

  .filter {
    padding: 0.28rem 0.65rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    font-size: 0.8125rem;
    color: var(--ink-soft);
    transition: all var(--transition);
  }

  .filter[aria-pressed='true'] {
    background: var(--kelp);
    border-color: var(--kelp);
    color: var(--paper);
  }

  ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  /* Each event hangs off a vertical rule, like a schedule pinned to a wall. */
  .event {
    display: grid;
    grid-template-columns: 5.5rem 1fr;
    gap: 1.25rem;
    padding: 1rem 0 1.05rem 0;
    border-top: 1px solid var(--line-soft);
    position: relative;
  }

  .event:first-child {
    border-top: 0;
  }

  .when {
    font-family: var(--mono);
    font-size: 0.8125rem;
    color: var(--ink);
    padding-top: 0.1rem;
    font-variant-numeric: tabular-nums;
  }

  .when small {
    display: block;
    font-size: 0.6875rem;
    color: var(--ink-faint);
    margin-top: 0.15rem;
  }

  .event[data-past='true'] {
    opacity: 0.45;
  }

  .event[data-saved='true'] .name {
    color: var(--kelp);
  }

  .name {
    font-family: var(--display);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0 0 0.2rem;
  }

  .where {
    font-size: 0.875rem;
    color: var(--ink-soft);
  }

  .where b {
    font-family: var(--mono);
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--ink-faint);
  }

  .note {
    font-size: 0.875rem;
    color: var(--ink-soft);
    margin-top: 0.4rem;
    max-width: var(--measure);
  }

  .meta {
    display: flex;
    gap: 0.45rem;
    align-items: center;
    flex-wrap: wrap;
    margin-top: 0.6rem;
  }

  .meta .btn {
    padding: 0.28rem 0.6rem;
    font-size: 0.8125rem;
  }

  .tail {
    margin-top: 2.75rem;
    padding-top: 1.25rem;
    border-top: 2px solid var(--line);
  }

  .tail h3 {
    font-size: 1rem;
    margin-bottom: 0.35rem;
  }

  .tail p {
    font-size: 0.875rem;
    color: var(--ink-soft);
    max-width: var(--measure);
    margin-bottom: 0.85rem;
  }

  @media (max-width: 560px) {
    .event {
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }
  }
`);

/* Must match SAVED_EVENTS_KEY in store.js — that's what exportAll/importAll
   read and write so a backup covers this too. */
const SAVED_KEY = 'sabbatical:events';

/** The fixed calendar of things happening inside the window. */
export class EventList extends HTMLElement {
  #saved = new Set();
  #filter = null;
  #unsubscribe = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.#renderShell();
    }
    this.#reloadSaved();
    this.#unsubscribe.push(
      bus.on('events:restored', () => this.#reloadSaved()),
    );
  }

  disconnectedCallback() {
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
  }

  #renderShell() {
    this.shadowRoot.innerHTML = `
      <p class="intro">
        Everything happening between Sep 8 and Oct 9 that is worth the drive.
        Dates came from Oregon Coast Weekend, the Oregon Coast Visitors
        Association and the Oregon Festival Guide — confirm with the organizer
        before you build a day around one.
      </p>

      <div class="controls">
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="coast">On the coast</button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="quirky">Quirky</button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="harvest">Harvest</button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="music">Music</button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="saved">Only my picks</button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="near">Under 90 min</button>
      </div>

      <ol id="list"></ol>

      <div class="tail">
        <h3>Just past the finish line</h3>
        <p>Two that fall a week or two after Oct 9, in case you want to stretch it.</p>
        <ol id="near-misses"></ol>
      </div>
    `;

    this.shadowRoot.addEventListener('click', (event) => {
      const filter = event.target.closest('.filter');
      if (filter) {
        const value = filter.dataset.filter;
        const on = filter.getAttribute('aria-pressed') === 'true';
        for (const other of this.shadowRoot.querySelectorAll('.filter')) {
          other.setAttribute('aria-pressed', 'false');
        }
        filter.setAttribute('aria-pressed', String(!on));
        this.#filter = on ? null : value;
        this.#paint();
        return;
      }

      const save = event.target.closest('[data-action="save"]');
      if (save) this.#toggleSave(save.dataset.id);

      const plan = event.target.closest('[data-action="plan"]');
      if (plan) {
        bus.emit('journal:open-day', { date: plan.dataset.date });
        bus.emit('layout:toast', 'Opened that day in Notes');
      }
    });
  }

  /** Re-read saved ids from localStorage — used on load and after a restore. */
  #reloadSaved() {
    try {
      this.#saved = new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]'));
    } catch {
      this.#saved = new Set();
    }
    this.#paint();
    bus.emit('events:changed', { saved: this.#saved.size });
  }

  #toggleSave(id) {
    if (this.#saved.has(id)) this.#saved.delete(id);
    else this.#saved.add(id);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...this.#saved]));
    this.#paint();
    bus.emit('events:changed', { saved: this.#saved.size });
  }

  #matches(item) {
    if (!this.#filter) return true;
    if (this.#filter === 'saved') return this.#saved.has(item.id);
    if (this.#filter === 'near') return item.drive <= 90;
    return item.tags?.includes(this.#filter);
  }

  #paint() {
    const now = today();
    const visible = EVENTS.filter((item) => this.#matches(item));
    const list = this.shadowRoot.querySelector('#list');

    list.innerHTML =
      visible.length === 0
        ? `<li class="empty"><strong>Nothing here with that filter</strong>Turn it off to see all ${EVENTS.length}.</li>`
        : visible.map((item) => this.#row(item, now)).join('');

    this.shadowRoot.querySelector('#near-misses').innerHTML = NEAR_MISSES.map((item) =>
      this.#row({ ...item, tags: [] }, now, false),
    ).join('');
  }

  #row(item, now, actionable = true) {
    const past = (item.end ?? item.start) < now;
    const saved = this.#saved.has(item.id);
    const span = item.end
      ? `${formatShort(item.start)} – ${formatShort(item.end)}`
      : formatShort(item.start);

    return `
      <li class="event" data-past="${past}" data-saved="${saved}">
        <div class="when">
          ${span}
          <small>${weekday(item.start)}</small>
        </div>
        <div>
          <p class="name">${item.name}</p>
          <p class="where">${item.where} &middot; <b>${formatDrive(item.drive)} each way</b></p>
          ${item.verify ? '<p class="meta"><span class="chip chip--flag">check the date</span></p>' : ''}
          ${item.note ? `<p class="note">${item.note}</p>` : ''}
          ${
            actionable
              ? `<div class="meta">
                   <button class="btn" type="button" data-action="save" data-id="${item.id}"
                           aria-pressed="${saved}">${saved ? 'On my list' : 'Add to my list'}</button>
                   <button class="btn btn--quiet" type="button" data-action="plan" data-date="${item.start}">
                     Open ${formatShort(item.start)} in Notes
                   </button>
                 </div>`
              : ''
          }
        </div>
      </li>`;
  }
}

function weekday(key) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
    new Date(...key.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n)))),
  );
}

customElements.define('event-list', EventList);
export { formatLong };
