import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';
import { store } from '../store.js';
import { PLACES, REGIONS, FILTER_TAGS, formatDrive } from '../data/places.js';
import { START, END, formatShort } from '../dates.js';

const css = String.raw;

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: block;
  }

  .controls {
    display: grid;
    gap: 0.85rem;
    margin-bottom: 1.5rem;
  }

  .row {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .row > .eyebrow {
    flex: 0 0 5.5rem;
  }

  .search {
    max-width: 22rem;
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

  .filter:hover {
    border-color: var(--kelp-soft);
  }

  .filter[aria-pressed='true'] {
    background: var(--kelp);
    border-color: var(--kelp);
    color: var(--paper);
  }

  .tally {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-faint);
    margin-bottom: 0.9rem;
  }

  .list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr));
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .place {
    display: flex;
    flex-direction: column;
    padding: 1.1rem 1.15rem 1rem;
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-lg);
    transition: border-color var(--transition), box-shadow var(--transition);
  }

  .place:hover {
    border-color: var(--line);
    box-shadow: var(--shadow);
  }

  .place[data-status='been'] {
    border-left: 3px solid var(--kelp);
  }

  .place[data-status='want'] {
    border-left: 3px solid var(--cranberry);
  }

  .place-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .place h3 {
    font-size: 1.0625rem;
  }

  .drive {
    flex: 0 0 auto;
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-faint);
    text-align: right;
    padding-top: 0.15rem;
  }

  .region {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--kelp-soft);
    margin-bottom: 0.45rem;
  }

  .blurb {
    font-size: 0.9rem;
    line-height: 1.55;
    color: var(--ink-soft);
    margin-bottom: 0.8rem;
  }

  .access {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--ink-soft);
    padding: 0.6rem 0.7rem;
    border-radius: var(--radius);
    background: var(--fog);
    margin-bottom: 0.85rem;
  }

  .access .chip {
    margin-right: 0.4rem;
    vertical-align: 1px;
  }

  .chips {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
    margin-bottom: 0.9rem;
  }

  .actions {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
    margin-top: auto;
    padding-top: 0.65rem;
    border-top: 1px solid var(--line-soft);
  }

  .actions .btn {
    padding: 0.35rem 0.65rem;
    font-size: 0.8125rem;
  }

  .pin {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: auto;
    padding: 0.3rem 0.5rem;
    background: var(--fog);
    border-radius: var(--radius);
  }

  .pin label {
    margin: 0;
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.02em;
    color: var(--ink-faint);
    white-space: nowrap;
  }

  .pin[data-pinned='true'] {
    background: var(--cranberry-wash);
  }

  .pin[data-pinned='true'] label {
    color: var(--cranberry);
  }

  input[type='date'].when {
    width: auto;
    padding: 0.2rem 0.35rem;
    font-size: 0.8125rem;
    font-family: var(--mono);
    background: var(--surface);
  }

  .note {
    margin-top: 0.6rem;
    font-size: 0.8125rem;
  }
`);

const ACCESS_LABEL = {
  easy: 'Paved & level',
  partial: 'Partly accessible',
  hard: 'Stairs or steep grade',
};

/**
 * Browse everywhere worth going. Filters by region, tag, drive time and
 * accessibility; each place can be marked as wanted, scheduled, or visited.
 */
export class PlaceList extends HTMLElement {
  #state = new Map();
  #filters = { region: null, tag: null, access: null, maxDrive: null, query: '' };
  #unsubscribe = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.#renderShell();
    }
    this.refresh();
    this.#unsubscribe.push(bus.on('places:changed', () => this.refresh()));
  }

  disconnectedCallback() {
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
  }

  /** Reload saved place state from storage and repaint. */
  async refresh() {
    const rows = await store.all('placeState');
    this.#state = new Map(rows.map((row) => [row.id, row]));
    this.#paint();
  }

  #renderShell() {
    const pill = (group, value, label) =>
      `<button class="filter" type="button" role="switch" aria-pressed="false"
               data-group="${group}" data-value="${value}">${label}</button>`;

    this.shadowRoot.innerHTML = `
      <div class="controls">
        <input class="search" type="search" id="q"
               placeholder="Search places, tags, notes…"
               aria-label="Search places">

        <div class="row">
          <span class="eyebrow">Region</span>
          ${REGIONS.map((r) => pill('region', r, r)).join('')}
        </div>

        <div class="row">
          <span class="eyebrow">Drive</span>
          ${pill('maxDrive', '60', 'under 1 hr')}
          ${pill('maxDrive', '120', 'under 2 hr')}
          ${pill('maxDrive', '180', 'under 3 hr')}
        </div>

        <div class="row">
          <span class="eyebrow">Access</span>
          ${pill('access', 'easy', 'Paved &amp; level')}
          ${pill('access', 'partial', 'Partly accessible')}
        </div>

        <div class="row">
          <span class="eyebrow">Kind</span>
          ${FILTER_TAGS.map((t) => pill("tag", t, t.replace(/-/g, " "))).join("")}
        </div>
      </div>

      <p class="tally" id="tally"></p>
      <ul class="list" id="list"></ul>
    `;

    this.shadowRoot.querySelector('#q').addEventListener('input', (event) => {
      this.#filters.query = event.target.value.trim().toLowerCase();
      this.#paint();
    });

    this.shadowRoot.addEventListener('click', (event) => {
      const pillButton = event.target.closest('.filter');
      if (pillButton) return this.#toggleFilter(pillButton);

      const action = event.target.closest('[data-action]');
      if (action) this.#handleAction(action);
    });

    this.shadowRoot.addEventListener('change', (event) => {
      const when = event.target.closest('.when');
      if (when) this.#save(when.dataset.id, { plannedDate: when.value || null });
    });
  }

  #toggleFilter(button) {
    const { group, value } = button.dataset;
    const on = button.getAttribute('aria-pressed') === 'true';

    for (const other of this.shadowRoot.querySelectorAll(
      `.filter[data-group="${group}"]`,
    )) {
      other.setAttribute('aria-pressed', 'false');
    }
    button.setAttribute('aria-pressed', String(!on));
    this.#filters[group] = on ? null : value;
    this.#paint();
  }

  async #handleAction(element) {
    const { action, id } = element.dataset;
    const current = this.#state.get(id)?.status ?? 'none';

    if (action === 'want') {
      await this.#save(id, { status: current === 'want' ? 'none' : 'want' });
    } else if (action === 'been') {
      await this.#save(id, { status: current === 'been' ? 'none' : 'been' });
    } else if (action === 'note') {
      const place = PLACES.find((p) => p.id === id);
      const existing = this.#state.get(id)?.note ?? '';
      const text = prompt(`A note about ${place.name}`, existing);
      if (text !== null) await this.#save(id, { note: text.trim() });
    }
  }

  async #save(id, patch) {
    const existing = this.#state.get(id) ?? {
      id,
      status: 'none',
      note: '',
      plannedDate: null,
    };
    const next = { ...existing, ...patch };
    this.#state.set(id, next);
    await store.put('placeState', next);
    bus.emit('places:changed', { id });

    const name = PLACES.find((p) => p.id === id).name;
    if ('plannedDate' in patch) {
      bus.emit(
        'layout:toast',
        patch.plannedDate
          ? `Pinned ${name} to ${formatShort(patch.plannedDate)} — it'll show up on that day in the strip and in Notes`
          : `Unpinned ${name}`,
      );
    } else {
      bus.emit('layout:toast', `Saved — ${name}`);
    }
  }

  #matches(place) {
    const f = this.#filters;
    if (f.region && place.region !== f.region) return false;
    if (f.tag && !place.tags.includes(f.tag)) return false;
    if (f.access && place.accessLevel !== f.access) return false;
    if (f.maxDrive && place.drive > Number(f.maxDrive)) return false;
    if (f.query) {
      const haystack = [
        place.name,
        place.region,
        place.blurb,
        place.access,
        place.tags.join(' '),
        this.#state.get(place.id)?.note ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(f.query)) return false;
    }
    return true;
  }

  #paint() {
    const visible = PLACES.filter((place) => this.#matches(place)).sort(
      (a, b) => a.drive - b.drive,
    );

    const saved = [...this.#state.values()].filter((s) => s.status !== 'none').length;
    this.shadowRoot.querySelector('#tally').textContent =
      `${visible.length} of ${PLACES.length} places · ${saved} on your list · sorted by drive time`;

    const list = this.shadowRoot.querySelector('#list');

    if (visible.length === 0) {
      list.innerHTML = `
        <li class="empty" style="grid-column: 1 / -1">
          <strong>Nothing matches those filters</strong>
          Clear one and try again.
        </li>`;
      return;
    }

    list.innerHTML = visible.map((place) => this.#card(place)).join('');
    bus.emit('places:count', { total: PLACES.length, saved });
  }

  #card(place) {
    const state = this.#state.get(place.id) ?? {};
    const status = state.status ?? 'none';

    return `
      <li class="place" data-status="${status}">
        <div class="place-head">
          <div>
            <p class="region">${place.region}</p>
            <h3>${place.name}</h3>
          </div>
          <span class="drive">${formatDrive(place.drive)}</span>
        </div>

        <p class="blurb">${place.blurb}</p>

        <p class="access">
          <span class="chip chip--${place.accessLevel}">${ACCESS_LABEL[place.accessLevel]}</span>
          ${place.access}
        </p>

        <div class="chips">
          ${place.tags.map((tag) => `<span class="chip">${tag.replace(/-/g, ' ')}</span>`).join('')}
        </div>

        ${state.note ? `<p class="note">${escapeHtml(state.note)}</p>` : ''}

        <div class="actions">
          <button class="btn" type="button" data-action="want" data-id="${place.id}"
                  aria-pressed="${status === 'want'}">Want to go</button>
          <button class="btn" type="button" data-action="been" data-id="${place.id}"
                  aria-pressed="${status === 'been'}">Been</button>
          <button class="btn btn--quiet" type="button" data-action="note" data-id="${place.id}">
            ${state.note ? 'Edit note' : 'Add note'}
          </button>
          <div class="pin" data-pinned="${Boolean(state.plannedDate)}">
            <label for="when-${place.id}">${state.plannedDate ? `Pinned — ${formatShort(state.plannedDate)}` : 'Pin to a date'}</label>
            <input class="when" type="date" id="when-${place.id}" data-id="${place.id}"
                   min="${START}" max="${END}" value="${state.plannedDate ?? ''}"
                   aria-label="Date planned for ${place.name}">
          </div>
        </div>
      </li>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

customElements.define('place-list', PlaceList);
