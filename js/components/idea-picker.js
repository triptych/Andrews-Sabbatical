import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';
import { store, newId } from '../store.js';
import { IDEAS } from '../data/ideas.js';
import { PLACES, formatDrive } from '../data/places.js';
import { EVENTS } from '../data/events.js';
import { formatLong, today, inWindow } from '../dates.js';

/* Must match SAVED_EVENTS_KEY in store.js — the ids of events saved from
   What's On, read the same way day-strip.js and event-list.js do. */
const SAVED_KEY = 'sabbatical:events';

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

  /* ——— the machine ——— */

  .machine {
    display: grid;
    justify-items: center;
    gap: 1.1rem;
    padding: 2.25rem 1.5rem;
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    margin-bottom: 1.75rem;
  }

  .window {
    position: relative;
    width: 100%;
    max-width: 26rem;
    height: 6.5rem;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--fog);
  }

  .window::before,
  .window::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 1.6rem;
    pointer-events: none;
    z-index: 2;
  }

  .window::before {
    top: 0;
    background: linear-gradient(to bottom, var(--fog), transparent);
  }

  .window::after {
    bottom: 0;
    background: linear-gradient(to top, var(--fog), transparent);
  }

  .reel {
    display: grid;
    gap: 0;
  }

  .reel[data-spinning='true'] {
    animation: spin 0.12s linear infinite;
  }

  .slot {
    height: 6.5rem;
    display: grid;
    place-items: center;
    padding: 0 1.25rem;
    text-align: center;
  }

  .slot .name {
    font-family: var(--display);
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.015em;
    line-height: 1.2;
  }

  .slot .kind {
    display: block;
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-bottom: 0.3rem;
  }

  @keyframes spin {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-6.5rem);
    }
  }

  .result {
    width: 100%;
    max-width: 26rem;
    display: none;
    flex-direction: column;
    gap: 0.4rem;
    text-align: center;
  }

  .result[data-visible='true'] {
    display: flex;
  }

  .result .detail {
    font-size: 0.875rem;
    color: var(--ink-soft);
  }

  .result .chips {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 0.1rem;
  }

  .spin-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .spin-btn {
    padding: 0.75rem 1.75rem;
    font-size: 1rem;
    font-weight: 700;
  }

  .pool-note {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-faint);
  }

  .today-lists {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: 1.5rem;
  }

  .today-lists h2 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .today-lists ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.4rem;
  }

  .today-lists li {
    padding: 0.55rem 0.7rem;
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
    font-size: 0.875rem;
  }

  .today-lists .sub {
    display: block;
    font-size: 0.75rem;
    color: var(--ink-faint);
    margin-top: 0.1rem;
  }

  /* ——— add-your-own-idea disclosure ——— */

  .add-toggle {
    margin-bottom: 1.75rem;
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
    flex: 1 1 14rem;
  }

  .add-form .field--wide {
    flex: 1 1 100%;
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

  .your-ideas {
    margin-bottom: 1.75rem;
  }

  .your-ideas h2 {
    font-size: 1rem;
    margin-bottom: 0.6rem;
  }

  .your-ideas ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  .your-ideas .item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.7rem;
    align-items: start;
    padding: 0.75rem 0.85rem;
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
  }

  .your-ideas .text {
    font-size: 0.9375rem;
    line-height: 1.45;
  }

  .your-ideas .row-tools {
    display: flex;
    gap: 0.15rem;
    flex: none;
  }

  .icon {
    border: 0;
    background: none;
    color: var(--ink-faint);
    font-size: 0.75rem;
    padding: 0.2rem 0.35rem;
    border-radius: var(--radius);
  }

  .icon:hover {
    background: var(--fog);
    color: var(--ink);
  }

  .icon.remove:hover {
    background: var(--cranberry-wash);
    color: var(--cranberry);
  }

  @media (max-width: 480px) {
    .machine {
      padding: 1.5rem 1rem;
    }

    .slot .name {
      font-size: 1.15rem;
    }
  }
`);

const KIND_LABEL = {
  idea: 'Something to do',
  place: 'A place to go',
  event: "What's on today",
};

/**
 * The Ideas tab. Builds a pool of candidates for "what to do today" — the
 * curated at-home ideas list plus any you've added yourself, every place
 * worth the drive, and anything on the calendar (saved or hand-added) that
 * falls on today's date — and spins through them slot-machine style before
 * settling on one. Ideas you add are saved to IndexedDB (`customIdeas`), so
 * they persist across sessions and are folded into every future spin.
 */
export class IdeaPicker extends HTMLElement {
  #pool = [];
  #custom = [];
  #filter = null;
  #spinning = false;
  #spinTimer = null;
  #settled = null;
  #unsubscribe = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.#renderShell();
    }
    this.refresh();
    this.#unsubscribe.push(
      bus.on('events:changed', () => this.refresh()),
      bus.on('events:restored', () => this.refresh()),
    );
  }

  disconnectedCallback() {
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
    clearInterval(this.#spinTimer);
  }

  /** Rebuild today's candidate pool from ideas (curated + your own), places, and what's on. */
  async refresh() {
    const now = today();

    let saved = new Set();
    try {
      saved = new Set(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]'));
    } catch {
      saved = new Set();
    }

    const [customEvents, customIdeas] = await Promise.allSettled([
      store.all('customEvents'),
      store.all('customIdeas'),
    ]).then((results) =>
      results.map((result, index) => {
        if (result.status === 'fulfilled') return result.value;
        console.error(`idea-picker: could not load ${index === 0 ? 'your events' : 'your ideas'}`, result.reason);
        return [];
      }),
    );

    this.#custom = customIdeas;

    const todaysEvents = [...EVENTS.filter((event) => saved.has(event.id)), ...customEvents].filter(
      (event) => inWindow(now) && now >= event.start && now <= (event.end ?? event.start),
    );

    const ideaCandidates = [
      ...IDEAS.map((idea) => ({
        kind: 'idea',
        id: idea.id,
        text: idea.text,
        detail: '',
        tags: idea.tags,
        custom: false,
      })),
      ...customIdeas.map((idea) => ({
        kind: 'idea',
        id: idea.id,
        text: idea.text,
        detail: '',
        tags: idea.tags?.length ? idea.tags : ['yours'],
        custom: true,
      })),
    ];

    const placeCandidates = PLACES.map((place) => ({
      kind: 'place',
      id: place.id,
      text: `Go to ${place.name}`,
      detail: `${formatDrive(place.drive)} drive · ${place.region}`,
      tags: ['place', ...place.tags],
    }));

    const eventCandidates = todaysEvents.map((event) => ({
      kind: 'event',
      id: event.id,
      text: event.name,
      detail: event.where,
      tags: ['event', ...(event.tags ?? [])],
    }));

    this.#pool = [...ideaCandidates, ...placeCandidates, ...eventCandidates];
    this.#settled = null;
    this.#paint();
  }

  #renderShell() {
    this.shadowRoot.innerHTML = `
      <p class="intro">
        Not sure what today is for? Spin it. The pool mixes low-key things
        to do at home with every place worth the drive and anything on the
        calendar for today.
      </p>

      <details class="add-toggle" id="add-toggle">
        <summary>Add your own idea</summary>
        <form class="add-form" id="add-form">
          <div class="field field--wide">
            <label for="idea-text">What's the idea?</label>
            <input type="text" id="idea-text" required placeholder="Build a blanket fort">
          </div>
          <div class="field">
            <label for="idea-tags">Tags <span class="mono">(optional, comma separated)</span></label>
            <input type="text" id="idea-tags" placeholder="home, make, quiet">
          </div>
          <div class="actions">
            <button class="btn btn--primary" type="submit">Add idea</button>
          </div>
        </form>
      </details>

      <div class="your-ideas" id="your-ideas-section" hidden>
        <h2>Your ideas</h2>
        <ul id="your-ideas"></ul>
      </div>

      <div class="controls" id="controls">
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="idea">At home</button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="place">A place</button>
        <button class="filter" type="button" role="switch" aria-pressed="false" data-filter="event">What's on today</button>
      </div>

      <div class="machine">
        <div class="window">
          <div class="reel" id="reel">
            <div class="slot"><span class="name">Pull the lever</span></div>
          </div>
        </div>

        <div class="result" id="result">
          <span class="kind" id="result-kind"></span>
          <span class="detail" id="result-detail"></span>
          <div class="chips" id="result-chips"></div>
        </div>

        <div class="spin-row">
          <button class="btn btn--primary spin-btn" type="button" id="spin">Spin</button>
          <button class="btn" type="button" id="log" hidden>Send to today's notes</button>
        </div>

        <p class="pool-note" id="pool-note"></p>
      </div>

      <div class="today-lists">
        <section>
          <h2>Happening today</h2>
          <ul id="today-events"></ul>
        </section>
      </div>
    `;

    this.shadowRoot.querySelector('#spin').addEventListener('click', () => this.#spin());
    this.shadowRoot.querySelector('#log').addEventListener('click', () => this.#logToday());

    this.shadowRoot.querySelector('#controls').addEventListener('click', (event) => {
      const filter = event.target.closest('.filter');
      if (!filter) return;
      const on = filter.getAttribute('aria-pressed') === 'true';
      for (const other of this.shadowRoot.querySelectorAll('.filter')) {
        other.setAttribute('aria-pressed', 'false');
      }
      filter.setAttribute('aria-pressed', String(!on));
      this.#filter = on ? null : filter.dataset.filter;
      this.#paint();
    });

    this.shadowRoot.querySelector('#add-form').addEventListener('submit', (event) => {
      event.preventDefault();
      this.#createCustom();
    });

    this.shadowRoot.querySelector('#your-ideas').addEventListener('click', (event) => {
      const edit = event.target.closest('[data-action="edit"]');
      if (edit) this.#editCustom(edit.dataset.id);

      const remove = event.target.closest('[data-action="remove"]');
      if (remove) this.#removeCustom(remove.dataset.id);
    });
  }

  async #createCustom() {
    const root = this.shadowRoot;
    const text = root.querySelector('#idea-text').value.trim();
    const tags = root
      .querySelector('#idea-tags')
      .value.split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!text) {
      bus.emit('layout:toast', 'Give the idea some text first');
      return;
    }

    const record = { id: newId(), text, tags, created: Date.now() };
    await store.put('customIdeas', record);
    await this.refresh();
    bus.emit('layout:toast', `Added — ${text}`);

    const form = root.querySelector('#add-form');
    form.reset();
    root.querySelector('#add-toggle').open = false;
  }

  async #editCustom(id) {
    const idea = this.#custom.find((row) => row.id === id);
    if (!idea) return;
    const text = prompt('Reword it', idea.text);
    if (text === null || !text.trim()) return;
    const tagsInput = prompt('Tags, comma separated (blank for none)', (idea.tags ?? []).join(', '));
    if (tagsInput === null) return;
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    await store.put('customIdeas', { ...idea, text: text.trim(), tags });
    await this.refresh();
  }

  async #removeCustom(id) {
    const idea = this.#custom.find((row) => row.id === id);
    if (!idea) return;
    if (!confirm(`Remove "${idea.text}"? This can't be undone.`)) return;
    await store.remove('customIdeas', id);
    await this.refresh();
  }

  #candidates() {
    if (!this.#filter) return this.#pool;
    return this.#pool.filter((item) => item.kind === this.#filter);
  }

  #spin() {
    if (this.#spinning) return;
    const candidates = this.#candidates();
    if (candidates.length === 0) {
      bus.emit('layout:toast', 'Nothing in that pool — try a different filter');
      return;
    }

    this.#spinning = true;
    this.#settled = null;
    const spinButton = this.shadowRoot.querySelector('#spin');
    const logButton = this.shadowRoot.querySelector('#log');
    const reel = this.shadowRoot.querySelector('#reel');
    const result = this.shadowRoot.querySelector('#result');
    spinButton.disabled = true;
    logButton.hidden = true;
    result.dataset.visible = 'false';
    reel.dataset.spinning = 'true';

    let ticks = 0;
    const totalTicks = 18 + Math.floor(Math.random() * 8);
    this.#spinTimer = setInterval(() => {
      ticks += 1;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      this.#renderSlot(pick);
      if (ticks >= totalTicks) {
        clearInterval(this.#spinTimer);
        this.#settleOn(candidates[Math.floor(Math.random() * candidates.length)]);
      }
    }, 90);
  }

  #renderSlot(item) {
    const reel = this.shadowRoot.querySelector('#reel');
    reel.innerHTML = `
      <div class="slot">
        <span class="kind">${KIND_LABEL[item.kind]}</span>
        <span class="name">${escapeHtml(item.text)}</span>
      </div>
    `;
  }

  #settleOn(item) {
    this.#spinning = false;
    this.#settled = item;
    const reel = this.shadowRoot.querySelector('#reel');
    reel.dataset.spinning = 'false';
    this.#renderSlot(item);

    const result = this.shadowRoot.querySelector('#result');
    result.dataset.visible = 'true';
    this.shadowRoot.querySelector('#result-kind').textContent = KIND_LABEL[item.kind];
    this.shadowRoot.querySelector('#result-detail').textContent = item.detail;
    this.shadowRoot.querySelector('#result-chips').innerHTML = item.tags
      .filter((tag) => !['place', 'event'].includes(tag))
      .map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`)
      .join('');

    this.shadowRoot.querySelector('#spin').disabled = false;
    this.shadowRoot.querySelector('#spin').textContent = 'Spin again';
    this.shadowRoot.querySelector('#log').hidden = false;

    bus.emit('layout:toast', `Today: ${item.text}`);
  }

  #logToday() {
    if (!this.#settled) return;
    const now = today();
    if (!inWindow(now)) {
      bus.emit('layout:toast', "Today falls outside Sep 8 – Oct 9, so there's no notes page for it");
      return;
    }
    bus.emit('journal:open-day', { date: now, draft: this.#settled.text });
    bus.emit('layout:toast', `Opened ${formatLong(now)} in Notes`);
  }

  #paint() {
    const spinButton = this.shadowRoot.querySelector('#spin');
    const candidates = this.#candidates();
    this.shadowRoot.querySelector('#pool-note').textContent =
      candidates.length > 0
        ? `${candidates.length} option${candidates.length === 1 ? '' : 's'} in the pool`
        : 'Nothing in that pool yet';
    spinButton.disabled = candidates.length === 0;

    const todaysEvents = this.#pool.filter((item) => item.kind === 'event');
    const list = this.shadowRoot.querySelector('#today-events');
    list.innerHTML =
      todaysEvents.length === 0
        ? `<li class="empty">${inWindow(today()) ? 'Nothing on the calendar for today.' : 'Today falls outside the sabbatical window.'}</li>`
        : todaysEvents
            .map(
              (item) => `
          <li>${escapeHtml(item.text)}<span class="sub">${escapeHtml(item.detail)}</span></li>`,
            )
            .join('');

    const section = this.shadowRoot.querySelector('#your-ideas-section');
    section.hidden = this.#custom.length === 0;
    this.shadowRoot.querySelector('#your-ideas').innerHTML = this.#custom
      .map(
        (idea) => `
        <li class="item">
          <span class="text">${escapeHtml(idea.text)}<span class="chip yours">yours</span></span>
          <div class="row-tools">
            <button class="icon" type="button" data-action="edit" data-id="${idea.id}" aria-label="Reword">edit</button>
            <button class="icon remove" type="button" data-action="remove" data-id="${idea.id}" aria-label="Remove">&times;</button>
          </div>
        </li>`,
      )
      .join('');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

customElements.define('idea-picker', IdeaPicker);
