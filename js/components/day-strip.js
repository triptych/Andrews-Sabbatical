import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';
import { store } from '../store.js';
import { DAYS, TOTAL_DAYS, formatLong, status, today } from '../dates.js';

const css = String.raw;

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: block;
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

  /* The strip itself: one tick per day, anchored to a baseline like a
     tally sheet. Tick height carries information — a day with something
     written on it stands taller than an empty one. */
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
  }

  .tick button {
    width: 100%;
    height: 10px;
    padding: 0;
    border: 0;
    border-radius: 1px 1px 0 0;
    background: var(--line);
    transition: height var(--transition), background var(--transition);
  }

  .tick button:hover {
    background: var(--kelp-soft);
  }

  /* elapsed but empty */
  .tick[data-state='past'] button {
    background: var(--kelp-soft);
    height: 16px;
  }

  /* something written */
  .tick[data-state='logged'] button {
    background: var(--kelp);
    height: 34px;
  }

  /* planned ahead */
  .tick[data-state='planned'] button {
    background: var(--cranberry);
    height: 22px;
  }

  .tick[data-today='true'] button {
    background: var(--ink);
    height: 46px;
    border-radius: 1px;
  }

  .tick[data-today='true']::after {
    content: '';
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
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 0.7rem;
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-faint);
  }

  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.35em;
  }

  .swatch {
    width: 3px;
    height: 11px;
    border-radius: 1px;
    background: var(--line);
  }

  .swatch--logged { background: var(--kelp); }
  .swatch--planned { background: var(--cranberry); }
  .swatch--today { background: var(--ink); }

  @media (max-width: 480px) {
    :host {
      margin: 1.5rem auto 2rem;
    }

    .strip {
      gap: 1px;
      height: 38px;
    }

    .tick[data-today='true'] button {
      height: 38px;
    }

    .legend {
      gap: 0.6rem;
      font-size: 0.625rem;
    }
  }

`);

/**
 * A 32-tick tally of the sabbatical. Each tick is one day; height encodes
 * whether that day has a journal entry, a planned outing, or nothing yet.
 * Clicking a tick asks the journal to open that day.
 */
export class DayStrip extends HTMLElement {
  #unsubscribe = [];
  #logged = new Set();
  #planned = new Set();

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
    );
  }

  disconnectedCallback() {
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
  }

  /** Re-read stored data and repaint the ticks. */
  async refresh() {
    const [entries, placeState] = await Promise.all([
      store.all('entries'),
      store.all('placeState'),
    ]);
    this.#logged = new Set(entries.map((entry) => entry.date));
    this.#planned = new Set(
      placeState.map((place) => place.plannedDate).filter(Boolean),
    );
    this.#paint();
  }

  #render() {
    const ticks = DAYS.map(
      (key, index) => `
        <li class="tick" data-day="${key}">
          <button type="button" data-day="${key}">
            <span class="visually-hidden">Day ${index + 1}, ${formatLong(key)}</span>
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
      <div class="legend">
        <span class="key"><i class="swatch"></i> ahead</span>
        <span class="key"><i class="swatch swatch--planned"></i> something booked</span>
        <span class="key"><i class="swatch swatch--logged"></i> written up</span>
        <span class="key"><i class="swatch swatch--today"></i> today</span>
      </div>
    `;

    this.shadowRoot.querySelector('#strip').addEventListener('click', (event) => {
      const day = event.target.closest('button')?.dataset.day;
      if (day) bus.emit('journal:open-day', { date: day });
    });
  }

  #paint() {
    const now = today();
    const state = status();

    for (const tick of this.shadowRoot.querySelectorAll('.tick')) {
      const day = tick.dataset.day;
      let value = 'future';
      if (this.#logged.has(day)) value = 'logged';
      else if (this.#planned.has(day)) value = 'planned';
      else if (day < now) value = 'past';

      tick.dataset.state = value;
      tick.dataset.today = String(day === now);
      tick.querySelector('button').title = `${formatLong(day)}${
        value === 'logged' ? ' — written up' : value === 'planned' ? ' — something booked' : ''
      }`;
    }

    const reading = this.shadowRoot.querySelector('#reading');
    const written = this.#logged.size;

    if (state.phase === 'before') {
      reading.innerHTML = `starts in <b>${state.untilStart}</b> days &middot; <b>${this.#planned.size}</b> planned`;
    } else if (state.phase === 'during') {
      reading.innerHTML = `day <b>${state.dayNumber}</b> of ${TOTAL_DAYS} &middot; <b>${state.remaining}</b> left &middot; <b>${written}</b> written up`;
    } else {
      reading.innerHTML = `finished &middot; <b>${written}</b> of ${TOTAL_DAYS} days written up`;
    }
  }
}

customElements.define('day-strip', DayStrip);
