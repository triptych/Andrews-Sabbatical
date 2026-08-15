import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';
import { store, newId } from '../store.js';
import { formatRange } from '../dates.js';

const css = String.raw;

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: block;
  }

  .add {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
    flex-wrap: wrap;
    padding: 1rem 1.1rem;
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-lg);
    margin-bottom: 2rem;
  }

  .add .field {
    flex: 1 1 18rem;
  }

  .add select,
  .add input[type='date'] {
    width: auto;
  }

  .when {
    display: block;
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-faint);
    margin-top: 0.3rem;
  }

  .columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr));
    gap: 2rem;
  }

  section h2 {
    font-size: 1.15rem;
    margin-bottom: 0.2rem;
  }

  .lede {
    font-size: 0.875rem;
    color: var(--ink-soft);
    margin-bottom: 1rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  .item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0.7rem;
    align-items: start;
    padding: 0.75rem 0.85rem;
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius);
  }

  .item[data-done='true'] .text {
    color: var(--ink-faint);
    text-decoration: line-through;
    text-decoration-color: var(--kelp-soft);
  }

  .tick {
    width: 1.1rem;
    height: 1.1rem;
    margin-top: 0.2rem;
    border: 1.5px solid var(--line);
    border-radius: 2px;
    background: var(--surface);
    padding: 0;
    display: grid;
    place-items: center;
    transition: all var(--transition);
  }

  .tick:hover {
    border-color: var(--kelp);
  }

  .item[data-done='true'] .tick {
    background: var(--kelp);
    border-color: var(--kelp);
  }

  .tick svg {
    width: 0.7rem;
    height: 0.7rem;
    stroke: var(--paper);
    stroke-width: 2.5;
    fill: none;
    opacity: 0;
  }

  .item[data-done='true'] .tick svg {
    opacity: 1;
  }

  .text {
    font-size: 0.9375rem;
    line-height: 1.45;
  }

  .progress {
    display: block;
    font-size: 0.8125rem;
    color: var(--ink-soft);
    margin-top: 0.3rem;
    white-space: pre-wrap;
  }

  .row-tools {
    display: flex;
    gap: 0.15rem;
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

  .summary {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-faint);
    margin-top: 0.8rem;
  }
`);

const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><polyline points="3,8.5 6.5,12 13,4"/></svg>';

/**
 * Two lists: things to finish (projects) and ways to be (goals).
 * The split matters — a project has a done state, a goal is a direction.
 */
export class GoalBoard extends HTMLElement {
  #items = [];
  #unsubscribe = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.#renderShell();
    }
    this.refresh();
    this.#unsubscribe.push(bus.on('goals:changed', () => this.refresh()));
  }

  disconnectedCallback() {
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
  }

  /** Reload from storage and repaint. */
  async refresh() {
    this.#items = await store.all('goals');
    this.#paint();
  }

  #renderShell() {
    this.shadowRoot.innerHTML = `
      <form class="add" id="add">
        <div class="field">
          <label for="text">What do you want out of this month?</label>
          <input type="text" id="text" required
                 placeholder="Finish the shed roof — or — swim in the ocean once a week">
        </div>
        <div>
          <label for="kind">Kind</label>
          <select id="kind">
            <option value="project">Project — has an end</option>
            <option value="goal">Goal — a way to spend the time</option>
          </select>
        </div>
        <div>
          <label for="start">Starts <span class="mono">(optional)</span></label>
          <input type="date" id="start">
        </div>
        <div>
          <label for="end">Ends <span class="mono">(optional)</span></label>
          <input type="date" id="end">
        </div>
        <button class="btn btn--primary" type="submit">Add</button>
      </form>

      <div class="columns">
        <section>
          <h2>Projects</h2>
          <p class="lede">Things with a finish line. Check them off.</p>
          <ul id="projects"></ul>
          <p class="summary" id="project-summary"></p>
        </section>
        <section>
          <h2>Goals</h2>
          <p class="lede">Ways you want the month to go. Add a line whenever you make progress.</p>
          <ul id="goals"></ul>
          <p class="summary" id="goal-summary"></p>
        </section>
      </div>
    `;

    this.shadowRoot.querySelector('#add').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = this.shadowRoot;
      const input = form.querySelector('#text');
      const text = input.value.trim();
      if (!text) return;
      const start = form.querySelector('#start').value || undefined;
      const end = form.querySelector('#end').value || undefined;
      if (end && start && end < start) {
        bus.emit('layout:toast', 'End date is before the start date');
        return;
      }
      this.#create(text, form.querySelector('#kind').value, start, end);
      input.value = '';
      form.querySelector('#start').value = '';
      form.querySelector('#end').value = '';
      input.focus();
    });

    this.shadowRoot.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) this.#handle(button.dataset.action, button.dataset.id);
    });
  }

  async #create(text, kind, start, end) {
    const item = {
      id: newId(),
      text,
      kind,
      done: false,
      notes: '',
      start,
      end,
      created: Date.now(),
    };
    await store.put('goals', item);
    bus.emit('goals:changed');
    bus.emit('layout:toast', `Added — ${text}`);
  }

  async #handle(action, id) {
    const item = this.#items.find((row) => row.id === id);
    if (!item) return;

    if (action === 'toggle') {
      await store.put('goals', { ...item, done: !item.done });
    } else if (action === 'note') {
      const text = prompt('Progress note', item.notes ?? '');
      if (text === null) return;
      await store.put('goals', { ...item, notes: text.trim() });
    } else if (action === 'dates') {
      const start = prompt('Starts (YYYY-MM-DD, blank to clear)', item.start ?? '');
      if (start === null) return;
      const end = prompt('Ends (YYYY-MM-DD, blank for a single day / no date)', item.end ?? '');
      if (end === null) return;
      const cleanStart = start.trim() || undefined;
      const cleanEnd = end.trim() || undefined;
      if (cleanStart && !/^\d{4}-\d{2}-\d{2}$/.test(cleanStart)) {
        bus.emit('layout:toast', 'Start date should look like YYYY-MM-DD');
        return;
      }
      if (cleanEnd && !/^\d{4}-\d{2}-\d{2}$/.test(cleanEnd)) {
        bus.emit('layout:toast', 'End date should look like YYYY-MM-DD');
        return;
      }
      if (cleanEnd && cleanStart && cleanEnd < cleanStart) {
        bus.emit('layout:toast', 'End date is before the start date');
        return;
      }
      await store.put('goals', { ...item, start: cleanStart, end: cleanEnd });
    } else if (action === 'edit') {
      const text = prompt('Reword it', item.text);
      if (text === null || !text.trim()) return;
      await store.put('goals', { ...item, text: text.trim() });
    } else if (action === 'remove') {
      if (!confirm(`Remove "${item.text}"? This can't be undone.`)) return;
      await store.remove('goals', id);
    }
    bus.emit('goals:changed');
  }

  #paint() {
    const projects = this.#items.filter((item) => item.kind === 'project');
    const goals = this.#items.filter((item) => item.kind === 'goal');

    this.#fill('#projects', projects, {
      heading: 'No projects yet',
      hint: 'Add the one thing you would be sorry not to have finished.',
    });
    this.#fill('#goals', goals, {
      heading: 'No goals yet',
      hint: 'Add something that has no finish line — a habit, a pace, a feeling.',
    });

    const done = projects.filter((item) => item.done).length;
    this.shadowRoot.querySelector('#project-summary').textContent =
      projects.length > 0 ? `${done} of ${projects.length} finished` : '';
    this.shadowRoot.querySelector('#goal-summary').textContent =
      goals.length > 0 ? `${goals.length} in play` : '';

    bus.emit('goals:count', { total: this.#items.length });
  }

  #fill(selector, items, empty) {
    const list = this.shadowRoot.querySelector(selector);
    if (items.length === 0) {
      list.innerHTML = `<li class="empty"><strong>${empty.heading}</strong>${empty.hint}</li>`;
      return;
    }
    list.innerHTML = items
      .slice()
      .sort((a, b) => Number(a.done) - Number(b.done) || a.created - b.created)
      .map(
        (item) => `
        <li class="item" data-done="${item.done}">
          <button class="tick" type="button" data-action="toggle" data-id="${item.id}"
                  role="checkbox" aria-checked="${item.done}"
                  aria-label="Mark ${escapeAttr(item.text)} ${item.done ? 'unfinished' : 'finished'}">
            ${CHECK}
          </button>
          <div>
            <span class="text">${escapeHtml(item.text)}</span>
            ${item.start ? `<span class="when">${escapeHtml(formatRange(item.start, item.end))}</span>` : ''}
            ${item.notes ? `<span class="progress">${escapeHtml(item.notes)}</span>` : ''}
          </div>
          <div class="row-tools">
            <button class="icon" type="button" data-action="note" data-id="${item.id}"
                    aria-label="Progress note">note</button>
            <button class="icon" type="button" data-action="dates" data-id="${item.id}"
                    aria-label="Set dates">dates</button>
            <button class="icon" type="button" data-action="edit" data-id="${item.id}"
                    aria-label="Reword">edit</button>
            <button class="icon remove" type="button" data-action="remove" data-id="${item.id}"
                    aria-label="Remove">&times;</button>
          </div>
        </li>`,
      )
      .join('');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

customElements.define('goal-board', GoalBoard);
