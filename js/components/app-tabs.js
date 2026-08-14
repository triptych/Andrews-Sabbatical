import sheet from '../shared-styles.js';

const css = String.raw;

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: block;
  }

  .bar {
    display: flex;
    gap: 0.25rem;
    border-bottom: 1px solid var(--line);
    margin-bottom: 1.75rem;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .bar::-webkit-scrollbar {
    display: none;
  }

  .tab {
    position: relative;
    flex: 0 0 auto;
    padding: 0.7rem 0.9rem 0.85rem;
    border: 0;
    background: none;
    font-family: var(--display);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--ink-faint);
    transition: color var(--transition);
  }

  .tab:hover {
    color: var(--ink-soft);
  }

  .tab[aria-selected='true'] {
    color: var(--ink);
  }

  .tab[aria-selected='true']::after {
    content: '';
    position: absolute;
    left: 0.9rem;
    right: 0.9rem;
    bottom: -1px;
    height: 2px;
    background: var(--kelp);
  }

  .count {
    font-family: var(--mono);
    font-size: 0.6875rem;
    font-weight: 400;
    color: var(--ink-faint);
    margin-left: 0.35em;
    vertical-align: 0.15em;
  }

  ::slotted(tab-panel) {
    display: none;
  }

  ::slotted(tab-panel[active]) {
    display: block;
  }

  @media (max-width: 430px) {
    .tab {
      padding-inline: 0.5rem;
      font-size: 0.9375rem;
    }

    .tab[aria-selected='true']::after {
      left: 0.5rem;
      right: 0.5rem;
    }
  }
`);

/**
 * A tab bar over slotted `<tab-panel label="..." count="...">` children.
 * Emits `tabs:change` with `{ from, to }` on itself.
 */
export class AppTabs extends HTMLElement {
  #panels = [];
  #buttons = [];
  #active = 0;

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.shadowRoot.innerHTML = `
        <div class="bar" role="tablist"></div>
        <slot></slot>
      `;
      this.shadowRoot
        .querySelector('slot')
        .addEventListener('slotchange', this.#build);
    }
    this.addEventListener('keydown', this.#onKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this.#onKeydown);
    this.shadowRoot
      ?.querySelector('slot')
      ?.removeEventListener('slotchange', this.#build);
  }

  /** Index of the visible panel. */
  get active() {
    return this.#active;
  }

  set active(index) {
    this.select(index);
  }

  /**
   * Show a panel by index and announce the change.
   * @param {number} index
   */
  select(index) {
    if (index === this.#active || index < 0 || index >= this.#panels.length) return;
    const from = this.#active;
    this.#active = index;
    this.#paint();
    this.dispatchEvent(
      new CustomEvent('tabs:change', {
        detail: { from, to: index, label: this.#panels[index]?.getAttribute('label') },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /** Update the small number badge on a tab. */
  setCount(index, value) {
    const badge = this.#buttons[index]?.querySelector('.count');
    if (badge) badge.textContent = value > 0 ? value : '';
  }

  #build = () => {
    this.#panels = [...this.querySelectorAll('tab-panel')];
    const bar = this.shadowRoot.querySelector('.bar');
    bar.innerHTML = '';
    this.#buttons = this.#panels.map((panel, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tab';
      button.id = `tab-${index}`;
      button.setAttribute('role', 'tab');
      button.innerHTML = `${panel.getAttribute('label') ?? `Panel ${index + 1}`}<span class="count"></span>`;
      button.addEventListener('click', () => this.select(index));
      bar.append(button);
      panel.id ||= `panel-${index}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      return button;
    });
    this.#paint();
  };

  #paint() {
    this.#buttons.forEach((button, index) => {
      const selected = index === this.#active;
      button.setAttribute('aria-selected', String(selected));
      button.setAttribute('tabindex', selected ? '0' : '-1');
      button.setAttribute('aria-controls', this.#panels[index].id);
      this.#panels[index].toggleAttribute('active', selected);
    });
  }

  #onKeydown = (event) => {
    if (!event.composedPath().some((node) => node?.getAttribute?.('role') === 'tab')) return;
    const last = this.#panels.length - 1;
    const moves = {
      ArrowRight: this.#active === last ? 0 : this.#active + 1,
      ArrowLeft: this.#active === 0 ? last : this.#active - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    this.select(moves[event.key]);
    this.#buttons[this.#active].focus();
  };
}

customElements.define('app-tabs', AppTabs);

/** A slotted panel. Visibility is driven by the `active` attribute. */
export class TabPanel extends HTMLElement {}
customElements.define('tab-panel', TabPanel);
