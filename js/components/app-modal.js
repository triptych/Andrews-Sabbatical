import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';

const css = String.raw;

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: none;
  }

  :host([open]) {
    display: block;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgb(16 25 23 / 0.45);
    backdrop-filter: blur(2px);
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 1rem;
    animation: fade 160ms ease-out;
  }

  .dialog {
    width: min(46rem, 100%);
    max-height: 86dvh;
    overflow-y: auto;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lift);
    padding: 1.5rem;
    animation: rise 200ms cubic-bezier(0.2, 0.8, 0.3, 1);
  }

  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .head h2 {
    font-size: 1.4rem;
  }

  .close {
    border: 0;
    background: none;
    color: var(--ink-faint);
    font-size: 1.4rem;
    line-height: 1;
    padding: 0.2rem 0.4rem;
    border-radius: var(--radius);
  }

  .close:hover {
    color: var(--ink);
    background: var(--fog);
  }

  @keyframes fade {
    from { opacity: 0; }
  }

  @keyframes rise {
    from { opacity: 0; transform: translateY(8px); }
  }
`);

/**
 * A focus-trapping dialog. Open it directly with the `open` attribute, or
 * from anywhere via `bus.emit('modal:request-open', { title, html })`.
 */
export class AppModal extends HTMLElement {
  static get observedAttributes() {
    return ['open'];
  }

  #lastFocused = null;
  #unsubscribe = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.shadowRoot.innerHTML = `
        <div class="backdrop" part="backdrop">
          <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="head">
              <h2 id="modal-title"></h2>
              <button class="close" type="button" aria-label="Close">&times;</button>
            </div>
            <div class="body"><slot></slot></div>
          </div>
        </div>
      `;
      this.shadowRoot
        .querySelector('.close')
        .addEventListener('click', () => this.close());
      this.shadowRoot.querySelector('.backdrop').addEventListener('click', (event) => {
        if (event.target === event.currentTarget) this.close();
      });
    }

    this.#unsubscribe.push(
      bus.on('modal:request-open', (event) => this.open(event.detail)),
      bus.on('modal:request-close', () => this.close()),
    );
    document.addEventListener('keydown', this.#onKeydown);
  }

  disconnectedCallback() {
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
    document.removeEventListener('keydown', this.#onKeydown);
  }

  attributeChangedCallback(name, before, after) {
    if (name !== 'open' || before === after) return;
    if (after !== null) {
      this.#lastFocused = document.activeElement;
      requestAnimationFrame(() => this.#focusables()[0]?.focus());
      this.dispatchEvent(new CustomEvent('modal:open', { bubbles: true, composed: true }));
    } else {
      this.#lastFocused?.focus?.();
      this.dispatchEvent(new CustomEvent('modal:close', { bubbles: true, composed: true }));
    }
  }

  /**
   * Show the dialog.
   * @param {{ title?: string, node?: Node, html?: string }} [options]
   */
  open({ title = '', node = null, html = null } = {}) {
    this.shadowRoot.querySelector('#modal-title').textContent = title;
    if (node) this.replaceChildren(node);
    else if (html !== null) this.innerHTML = html;
    this.setAttribute('open', '');
  }

  close() {
    this.removeAttribute('open');
  }

  #focusables() {
    const selector =
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';
    return [
      ...this.shadowRoot.querySelectorAll(selector),
      ...this.querySelectorAll(selector),
    ].filter((element) => element.offsetParent !== null || element.getRootNode() !== document);
  }

  #onKeydown = (event) => {
    if (!this.hasAttribute('open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab') return;

    const items = this.#focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items.at(-1);
    const active = this.shadowRoot.activeElement ?? document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };
}

customElements.define('app-modal', AppModal);
