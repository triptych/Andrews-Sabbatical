import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';
import { store, newId, exportAll, importAll } from '../store.js';
import { PLACES } from '../data/places.js';
import { START, END, formatLong, today, inWindow } from '../dates.js';

const css = String.raw;

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: block;
  }

  .split {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: 2.5rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .split {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }

  /* ——— composer ——— */

  form {
    position: sticky;
    top: 1.5rem;
    padding: 1.25rem;
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    display: grid;
    gap: 0.85rem;
  }

  @media (max-width: 900px) {
    form { position: static; }
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  /* Grid and flex children default to min-width:auto, so the widest
     <option> in the place picker was pushing the whole page sideways. */
  .split > *,
  .pair > * {
    min-width: 0;
  }

  select,
  input {
    max-width: 100%;
  }

  .drop {
    border: 1px dashed var(--line);
    border-radius: var(--radius);
    padding: 0.8rem;
    text-align: center;
    font-size: 0.8125rem;
    color: var(--ink-faint);
    transition: all var(--transition);
    cursor: pointer;
  }

  .drop:hover,
  .drop[data-over='true'] {
    border-color: var(--kelp);
    background: var(--kelp-wash);
    color: var(--kelp);
  }

  .drop input {
    display: none;
  }

  .queue {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .queue figure {
    margin: 0;
    position: relative;
  }

  .queue img {
    width: 3.25rem;
    height: 3.25rem;
    object-fit: cover;
    border-radius: var(--radius);
    display: block;
    border: 1px solid var(--line);
  }

  .queue button {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 1.1rem;
    height: 1.1rem;
    border: 0;
    border-radius: 50%;
    background: var(--ink);
    color: var(--paper);
    font-size: 0.7rem;
    line-height: 1;
    display: grid;
    place-items: center;
  }

  .form-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* ——— the log ——— */

  .log-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .log-head h2 {
    font-size: 1.15rem;
  }

  .backup {
    display: flex;
    gap: 0.35rem;
  }

  .backup .btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 1.5rem;
  }

  .entry {
    padding-left: 1rem;
    border-left: 2px solid var(--kelp-wash);
  }

  .entry-date {
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    color: var(--kelp);
    margin-bottom: 0.2rem;
  }

  .entry h3 {
    font-size: 1.1rem;
    margin-bottom: 0.4rem;
  }

  .entry .body {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: var(--ink-soft);
    white-space: pre-wrap;
    max-width: var(--measure);
  }

  .at {
    display: inline-block;
    margin-bottom: 0.45rem;
  }

  .shots {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.85rem;
  }

  .shots img {
    width: 8rem;
    height: 6rem;
    object-fit: cover;
    border-radius: var(--radius);
    border: 1px solid var(--line);
    cursor: zoom-in;
    transition: transform var(--transition);
  }

  .shots img:hover {
    transform: scale(1.02);
  }

  .entry-tools {
    display: flex;
    gap: 0.15rem;
    margin-top: 0.7rem;
  }

  .icon {
    border: 0;
    background: none;
    color: var(--ink-faint);
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
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
`);

/**
 * The record of what actually happened. One entry per day (or several),
 * with photos held as Blobs in IndexedDB and rendered through object URLs.
 */
export class JournalLog extends HTMLElement {
  #entries = [];
  #photos = [];
  #queue = [];
  #urls = [];
  #unsubscribe = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.#renderShell();
    }
    this.refresh();
    this.#unsubscribe.push(
      bus.on('entries:changed', () => this.refresh()),
      bus.on('journal:open-day', (event) => this.focusDay(event.detail.date)),
    );
  }

  disconnectedCallback() {
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
    this.#revokeAll();
  }

  /** Point the composer at a specific day and scroll it into view. */
  focusDay(date) {
    const field = this.shadowRoot.querySelector('#date');
    field.value = inWindow(date) ? date : today();
    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.shadowRoot.querySelector('#title').focus();
  }

  /** Reload entries and photos and repaint the log. */
  async refresh() {
    [this.#entries, this.#photos] = await Promise.all([
      store.all('entries'),
      store.all('photos'),
    ]);
    this.#paint();
  }

  #renderShell() {
    const options = PLACES.map(
      (place) => `<option value="${place.id}">${place.name}</option>`,
    ).join('');

    this.shadowRoot.innerHTML = `
      <div class="split">
        <form id="composer">
          <div>
            <label for="title">What happened</label>
            <input type="text" id="title" required placeholder="Thor's Well at the wrong tide">
          </div>

          <div class="pair">
            <div>
              <label for="date">Day</label>
              <input type="date" id="date" min="${START}" max="${END}" required>
            </div>
            <div>
              <label for="place">Where</label>
              <select id="place">
                <option value="">Nowhere in particular</option>
                ${options}
              </select>
            </div>
          </div>

          <div>
            <label for="body">Notes</label>
            <textarea id="body" placeholder="What you saw, who you met, what it cost, whether you'd go back."></textarea>
          </div>

          <label class="drop" id="drop" for="files">
            Drop photos here, or click to choose
            <input type="file" id="files" accept="image/*" multiple>
          </label>
          <div class="queue" id="queue"></div>

          <div class="form-foot">
            <span class="eyebrow" id="hint"></span>
            <button class="btn btn--primary" type="submit">Save entry</button>
          </div>
        </form>

        <div>
          <div class="log-head">
            <h2 id="log-title">The log</h2>
            <div class="backup">
              <button class="btn" type="button" id="export">Back up</button>
              <button class="btn" type="button" id="import">Restore</button>
              <input type="file" id="restore-file" accept="application/json" hidden>
            </div>
          </div>
          <ol id="log"></ol>
        </div>
      </div>
    `;

    const root = this.shadowRoot;
    root.querySelector('#date').value = inWindow(today()) ? today() : START;

    root.querySelector('#composer').addEventListener('submit', (event) => {
      event.preventDefault();
      this.#save();
    });

    root.querySelector('#files').addEventListener('change', (event) => {
      this.#enqueue([...event.target.files]);
      event.target.value = '';
    });

    const drop = root.querySelector('#drop');
    drop.addEventListener('dragover', (event) => {
      event.preventDefault();
      drop.dataset.over = 'true';
    });
    drop.addEventListener('dragleave', () => {
      drop.dataset.over = 'false';
    });
    drop.addEventListener('drop', (event) => {
      event.preventDefault();
      drop.dataset.over = 'false';
      this.#enqueue([...event.dataTransfer.files].filter((f) => f.type.startsWith('image/')));
    });

    root.querySelector('#export').addEventListener('click', () => this.#export());
    root.querySelector('#import').addEventListener('click', () =>
      root.querySelector('#restore-file').click(),
    );
    root.querySelector('#restore-file').addEventListener('change', (event) => {
      const [file] = event.target.files;
      if (file) this.#import(file);
      event.target.value = '';
    });

    root.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-drop]');
      if (remove) {
        this.#queue.splice(Number(remove.dataset.drop), 1);
        this.#paintQueue();
        return;
      }

      const action = event.target.closest('[data-action]');
      if (action) this.#handle(action.dataset.action, action.dataset.id);

      const shot = event.target.closest('.shots img');
      if (shot) {
        const figure = document.createElement('img');
        figure.src = shot.src;
        figure.style.cssText = 'width:100%;height:auto;border-radius:4px;display:block';
        bus.emit('modal:request-open', { title: shot.alt || 'Photo', node: figure });
      }
    });
  }

  #enqueue(files) {
    this.#queue.push(...files);
    this.#paintQueue();
  }

  #paintQueue() {
    const container = this.shadowRoot.querySelector('#queue');
    container.innerHTML = this.#queue
      .map(
        (file, index) => `
        <figure>
          <img src="${URL.createObjectURL(file)}" alt="">
          <button type="button" data-drop="${index}" aria-label="Remove photo">&times;</button>
        </figure>`,
      )
      .join('');
    this.shadowRoot.querySelector('#hint').textContent =
      this.#queue.length > 0 ? `${this.#queue.length} photo(s) attached` : '';
  }

  async #save() {
    const root = this.shadowRoot;
    const entry = {
      id: newId(),
      date: root.querySelector('#date').value,
      title: root.querySelector('#title').value.trim(),
      body: root.querySelector('#body').value.trim(),
      placeId: root.querySelector('#place').value || null,
      created: Date.now(),
      updated: Date.now(),
    };

    try {
      await store.put('entries', entry);

      for (const file of this.#queue) {
        await store.put('photos', {
          id: newId(),
          entryId: entry.id,
          date: entry.date,
          blob: file,
          caption: file.name,
          created: Date.now(),
        });
      }
    } catch {
      // store.put already raised a toast describing the failure.
      return;
    }

    this.#queue = [];
    root.querySelector('#title').value = '';
    root.querySelector('#body').value = '';
    this.#paintQueue();

    bus.emit('entries:changed');
    bus.emit('layout:toast', `Saved — ${formatLong(entry.date)}`);
  }

  async #handle(action, id) {
    const entry = this.#entries.find((row) => row.id === id);
    if (!entry) return;

    if (action === 'edit-entry') {
      const body = prompt('Edit the notes', entry.body ?? '');
      if (body === null) return;
      await store.put('entries', { ...entry, body: body.trim(), updated: Date.now() });
    } else if (action === 'remove-entry') {
      if (!confirm(`Delete "${entry.title}" and its photos?`)) return;
      for (const photo of this.#photos.filter((p) => p.entryId === id)) {
        await store.remove('photos', photo.id);
      }
      await store.remove('entries', id);
    }
    bus.emit('entries:changed');
  }

  async #export() {
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sabbatical-backup-${today()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      bus.emit('layout:toast', 'Backup downloaded');
    } catch {
      bus.emit('layout:toast', 'Backup failed. Check the browser console.');
    }
  }

  async #import(file) {
    if (!confirm('Restoring replaces everything currently saved. Continue?')) return;
    try {
      const counts = await importAll(JSON.parse(await file.text()));
      bus.emit('entries:changed');
      bus.emit('goals:changed');
      bus.emit('places:changed');
      bus.emit('events:restored');
      bus.emit(
        'layout:toast',
        `Restored ${counts.entries} entries, ${counts.photos} photos, ${counts.goals} goals, ${counts.events} saved events`,
      );
    } catch (error) {
      bus.emit('layout:toast', error.message ?? 'That file could not be read.');
    }
  }

  #revokeAll() {
    this.#urls.forEach((url) => URL.revokeObjectURL(url));
    this.#urls = [];
  }

  #paint() {
    this.#revokeAll();
    const log = this.shadowRoot.querySelector('#log');
    const sorted = this.#entries.slice().sort((a, b) => b.date.localeCompare(a.date));

    this.shadowRoot.querySelector('#log-title').textContent =
      sorted.length > 0 ? `The log — ${sorted.length} entries` : 'The log';

    if (sorted.length === 0) {
      log.innerHTML = `
        <li class="empty">
          <strong>Nothing written yet</strong>
          Write the first one before you leave — what you hope this month does.
        </li>`;
      bus.emit('entries:count', { total: 0 });
      return;
    }

    log.innerHTML = sorted
      .map((entry) => {
        const place = PLACES.find((p) => p.id === entry.placeId);
        const shots = this.#photos
          .filter((photo) => photo.entryId === entry.id)
          .map((photo) => {
            const url = URL.createObjectURL(photo.blob);
            this.#urls.push(url);
            return `<img src="${url}" alt="${escapeAttr(photo.caption ?? '')}" loading="lazy">`;
          })
          .join('');

        return `
          <li class="entry">
            <p class="entry-date">${formatLong(entry.date)}</p>
            <h3>${escapeHtml(entry.title)}</h3>
            ${place ? `<span class="chip at">${escapeHtml(place.name)}</span>` : ''}
            ${entry.body ? `<p class="body">${escapeHtml(entry.body)}</p>` : ''}
            ${shots ? `<div class="shots">${shots}</div>` : ''}
            <div class="entry-tools">
              <button class="icon" type="button" data-action="edit-entry" data-id="${entry.id}">edit</button>
              <button class="icon remove" type="button" data-action="remove-entry" data-id="${entry.id}">delete</button>
            </div>
          </li>`;
      })
      .join('');

    bus.emit('entries:count', { total: sorted.length });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/"/g, '&quot;');
}

customElements.define('journal-log', JournalLog);
