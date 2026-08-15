import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';
import { store, newId } from '../store.js';
import { EVENTS, NEAR_MISSES } from '../data/events.js';
import { formatDrive } from '../data/places.js';
import { formatLong, formatShort, formatRange, today, inWindow } from '../dates.js';

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

  /* ——— add-your-own-event disclosure ——— */

  .add-toggle {
    margin-bottom: 1.5rem;
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }

  .add-toggle summary {
    cursor: pointer;
    list-style: none;
    padding: 0.75rem 1rem;
    font-family: var(--display);
    font-weight: 700;
    font-size: 0.9375rem;
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .add-toggle summary::-webkit-details-marker {
    display: none;
  }

  .add-toggle summary::before {
    content: '+';
    display: inline-grid;
    place-items: center;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 50%;
    background: var(--kelp-wash);
    color: var(--kelp);
    font-size: 0.8rem;
  }

  .add-toggle[open] summary::before {
    content: '\2212';
  }

  .add-form {
    padding: 0.25rem 1rem 1.1rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    border-top: 1px solid var(--line-soft);
    padding-top: 1rem;
  }

  .add-form .field {
    flex: 1 1 12rem;
  }

  .add-form .field--wide {
    flex: 1 1 100%;
  }

  .add-form fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    flex: 1 1 100%;
  }

  .add-form legend {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--ink-soft);
    padding: 0;
    margin-bottom: 0.35rem;
  }

  .add-form .tags {
    display: flex;
    gap: 0.9rem;
    flex-wrap: wrap;
  }

  .add-form .tag-check {
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--ink-soft);
  }

  .add-form .tag-check input {
    width: auto;
  }

  .add-form .actions {
    flex: 1 1 100%;
    display: flex;
    justify-content: flex-end;
  }

  .yours {
    background: var(--tide-wash);
    color: var(--tide);
    margin-left: 0.4em;
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

const TAG_OPTIONS = ['coast', 'quirky', 'harvest', 'music'];

/** The calendar of things happening inside the window — curated events plus
 * anything you've added yourself. */
export class EventList extends HTMLElement {
  #saved = new Set();
  #custom = [];
  #filter = null;
  #unsubscribe = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.#renderShell();
    }
    this.#reloadSaved();
    this.#loadCustom();
    this.#unsubscribe.push(
      bus.on('events:restored', () => {
        this.#reloadSaved();
        this.#loadCustom();
      }),
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

      <details class="add-toggle" id="add-toggle">
        <summary>Add your own event</summary>
        <form class="add-form" id="add-form">
          <div class="field">
            <label for="ev-name">Name</label>
            <input type="text" id="ev-name" required placeholder="Low-tide beach walk">
          </div>
          <div class="field">
            <label for="ev-where">Where</label>
            <input type="text" id="ev-where" required placeholder="Yachats">
          </div>
          <div class="field">
            <label for="ev-start">Starts</label>
            <input type="date" id="ev-start" required>
          </div>
          <div class="field">
            <label for="ev-end">Ends <span class="mono">(optional, for multi-day)</span></label>
            <input type="date" id="ev-end">
          </div>
          <div class="field">
            <label for="ev-drive">Drive time in minutes <span class="mono">(optional)</span></label>
            <input type="number" id="ev-drive" min="0" step="5" placeholder="60">
          </div>
          <div class="field field--wide">
            <label for="ev-note">Note <span class="mono">(optional)</span></label>
            <input type="text" id="ev-note" placeholder="Anything worth remembering about it">
          </div>
          <fieldset>
            <legend>Tags <span class="mono">(optional, for the filters above)</span></legend>
            <div class="tags">
              ${TAG_OPTIONS.map(
                (tag) => `
                <label class="tag-check">
                  <input type="checkbox" value="${tag}"> ${tag}
                </label>`,
              ).join('')}
            </div>
          </fieldset>
          <div class="actions">
            <button class="btn btn--primary" type="submit">Add event</button>
          </div>
        </form>
      </details>

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

    this.shadowRoot.querySelector('#add-form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.#createCustom();
    });

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

      const remove = event.target.closest('[data-action="remove-custom"]');
      if (remove) this.#removeCustom(remove.dataset.id);
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

  /** Re-read hand-added events from IndexedDB — used on load and after a restore. */
  async #loadCustom() {
    this.#custom = (await store.all('customEvents')).map((item) => ({ ...item, custom: true }));
    this.#paint();
  }

  #toggleSave(id) {
    if (this.#saved.has(id)) this.#saved.delete(id);
    else this.#saved.add(id);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...this.#saved]));
    this.#paint();
    bus.emit('events:changed', { saved: this.#saved.size });
  }

  async #createCustom() {
    const root = this.shadowRoot;
    const name = root.querySelector('#ev-name').value.trim();
    const where = root.querySelector('#ev-where').value.trim();
    const start = root.querySelector('#ev-start').value;
    const end = root.querySelector('#ev-end').value;
    const drive = root.querySelector('#ev-drive').value;
    const note = root.querySelector('#ev-note').value.trim();
    const tags = [...root.querySelectorAll('.tag-check input:checked')].map((box) => box.value);

    if (!name || !where || !start) {
      bus.emit('layout:toast', 'Name, where, and a start date are required');
      return;
    }
    if (end && end < start) {
      bus.emit('layout:toast', 'End date is before the start date');
      return;
    }

    const record = {
      id: newId(),
      name,
      where,
      start,
      end: end || undefined,
      drive: drive ? Number(drive) : undefined,
      note: note || undefined,
      tags,
      created: Date.now(),
    };

    await store.put('customEvents', record);
    await this.#loadCustom();
    bus.emit('events:changed', { saved: this.#saved.size });
    bus.emit('layout:toast', `Added — ${name}`);

    const form = root.querySelector('#add-form');
    form.reset();
    root.querySelector('#add-toggle').open = false;

    if (!inWindow(start)) {
      bus.emit('layout:toast', `Heads up — ${formatShort(start)} falls outside Sep 8 – Oct 9`);
    }
  }

  async #removeCustom(id) {
    const item = this.#custom.find((row) => row.id === id);
    if (!item) return;
    if (!confirm(`Remove "${item.name}"? This can't be undone.`)) return;
    await store.remove('customEvents', id);
    await this.#loadCustom();
    bus.emit('events:changed', { saved: this.#saved.size });
  }

  #matches(item) {
    if (!this.#filter) return true;
    if (this.#filter === 'saved') return this.#saved.has(item.id) || item.custom;
    if (this.#filter === 'near') return item.drive != null && item.drive <= 90;
    return item.tags?.includes(this.#filter);
  }

  #paint() {
    const now = today();
    const combined = [...EVENTS, ...this.#custom].sort((a, b) => a.start.localeCompare(b.start));
    const visible = combined.filter((item) => this.#matches(item));
    const list = this.shadowRoot.querySelector('#list');

    list.innerHTML =
      visible.length === 0
        ? `<li class="empty"><strong>Nothing here with that filter</strong>Turn it off to see all ${combined.length}.</li>`
        : visible.map((item) => this.#row(item, now)).join('');

    this.shadowRoot.querySelector('#near-misses').innerHTML = NEAR_MISSES.map((item) =>
      this.#row({ ...item, tags: [] }, now, false),
    ).join('');
  }

  #row(item, now, actionable = true) {
    const past = (item.end ?? item.start) < now;
    const saved = this.#saved.has(item.id);

    return `
      <li class="event" data-past="${past}" data-saved="${saved}" data-custom="${Boolean(item.custom)}">
        <div class="when">
          ${formatRange(item.start, item.end)}
          <small>${weekday(item.start)}</small>
        </div>
        <div>
          <p class="name">${escapeHtml(item.name)}${item.custom ? '<span class="chip yours">yours</span>' : ''}</p>
          <p class="where">${escapeHtml(item.where)}${
            item.drive != null ? ` &middot; <b>${formatDrive(item.drive)} each way</b>` : ''
          }</p>
          ${item.verify ? '<p class="meta"><span class="chip chip--flag">check the date</span></p>' : ''}
          ${item.note ? `<p class="note">${escapeHtml(item.note)}</p>` : ''}
          ${
            actionable
              ? `<div class="meta">
                   ${
                     item.custom
                       ? `<button class="btn btn--quiet" type="button" data-action="remove-custom" data-id="${item.id}">Remove</button>`
                       : `<button class="btn" type="button" data-action="save" data-id="${item.id}"
                           aria-pressed="${saved}">${saved ? 'On my list' : 'Add to my list'}</button>`
                   }
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function weekday(key) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(
    new Date(...key.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n)))),
  );
}

customElements.define('event-list', EventList);
export { formatLong };
