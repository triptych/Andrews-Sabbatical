import sheet from '../shared-styles.js';
import { bus } from '../events/bus.js';

const css = String.raw;

const local = new CSSStyleSheet();
local.replaceSync(css`
  :host {
    display: block;
    min-height: 100dvh;
  }

  .shell {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100dvh;
  }

  header {
    padding: var(--gutter) var(--gutter) 0;
  }

  .masthead {
    max-width: 1180px;
    margin-inline: auto;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .title {
    font-family: var(--display);
    font-size: clamp(2rem, 6vw, 3.25rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 0.95;
    margin: 0;
  }

  .title em {
    font-style: normal;
    color: var(--kelp);
  }

  .dates {
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    margin-top: 0.6rem;
  }

  .tools {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    padding-bottom: 0.25rem;
  }

  main {
    padding: 0 var(--gutter) 4rem;
  }

  .inner {
    max-width: 1180px;
    margin-inline: auto;
  }

  footer {
    padding: 1.25rem var(--gutter) 2rem;
    border-top: 1px solid var(--line-soft);
  }

  .foot-inner {
    max-width: 1180px;
    margin-inline: auto;
    font-size: 0.75rem;
    color: var(--ink-faint);
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  @media (max-width: 640px) {
    .masthead {
      align-items: flex-start;
    }
  }
`);

/**
 * The application shell: masthead, slotted body, footer.
 * Reflects a `theme` attribute of `light` or `dark` onto the document.
 */
export class AppLayout extends HTMLElement {
  static get observedAttributes() {
    return ['theme'];
  }

  #unsubscribe = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.adoptedStyleSheets = [sheet, local];
      this.#render();
    }

    this.#applyTheme();

    const toggle = this.shadowRoot.querySelector('#theme-toggle');
    this.#onThemeClick = () => {
      const next = this.getAttribute('theme') === 'dark' ? 'light' : 'dark';
      this.setAttribute('theme', next);
      localStorage.setItem('sabbatical:theme', next);
    };
    toggle.addEventListener('click', this.#onThemeClick);

    this.#unsubscribe.push(
      bus.on('layout:toast', (event) => this.#toast(event.detail)),
    );

    bus.emit('layout:ready', { theme: this.getAttribute('theme') });
  }

  disconnectedCallback() {
    this.shadowRoot
      ?.querySelector('#theme-toggle')
      ?.removeEventListener('click', this.#onThemeClick);
    this.#unsubscribe.forEach((off) => off());
    this.#unsubscribe = [];
  }

  attributeChangedCallback(name) {
    if (name === 'theme' && this.shadowRoot) this.#applyTheme();
  }

  #onThemeClick = null;

  #applyTheme() {
    const theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    const button = this.shadowRoot?.querySelector('#theme-toggle');
    if (button) {
      button.textContent = theme === 'dark' ? 'Daylight' : 'Dusk';
      button.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme',
      );
    }
  }

  /** Briefly show a status line in the footer. */
  #toast(message) {
    const slot = this.shadowRoot.querySelector('#status');
    slot.textContent = message;
    clearTimeout(this.#toastTimer);
    this.#toastTimer = setTimeout(() => {
      slot.textContent = '';
    }, 4000);
  }

  #toastTimer = null;

  #render() {
    this.shadowRoot.innerHTML = `
      <div class="shell">
        <header>
          <div class="masthead">
            <div>
              <h1 class="title">Off the <em>clock</em></h1>
              <p class="dates">Sep 8 &ndash; Oct 9, 2026 &middot; from Cottage Grove</p>
            </div>
            <div class="tools">
              <slot name="tools"></slot>
              <button class="btn btn--quiet" id="theme-toggle" type="button">Dusk</button>
            </div>
          </div>
          <slot name="strip"></slot>
        </header>

        <main>
          <div class="inner"><slot></slot></div>
        </main>

        <footer>
          <div class="foot-inner">
            <span id="status" role="status" aria-live="polite"></span>
            <span>Everything you write stays in this browser. Back it up from Notes.</span>
          </div>
        </footer>
      </div>
    `;
  }
}

customElements.define('app-layout', AppLayout);
