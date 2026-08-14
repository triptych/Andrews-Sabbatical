/**
 * One constructed stylesheet, adopted by every shadow root.
 *
 * Shadow DOM blocks stylesheets but not inherited custom properties, so the
 * tokens in styles/main.css still reach in. This file carries the shapes that
 * would otherwise be copy-pasted into a dozen components.
 */

const css = String.raw;

const sheet = new CSSStyleSheet();
sheet.replaceSync(css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    font-family: var(--body);
    color: var(--ink);
  }

  :focus-visible {
    outline: 2px solid var(--kelp);
    outline-offset: 2px;
    border-radius: 2px;
  }

  /* Shadow roots don't inherit document classes, so this has to live here
     too — without it, screen-reader-only labels render on screen. */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .eyebrow {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }

  .mono {
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
  }

  h1,
  h2,
  h3 {
    font-family: var(--display);
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.015em;
    margin: 0;
  }

  p {
    margin: 0;
  }

  /* ——— buttons ——— */

  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.5rem 0.9rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font-size: 0.875rem;
    font-weight: 500;
    transition: background var(--transition), border-color var(--transition),
      transform var(--transition);
  }

  .btn:hover {
    border-color: var(--kelp-soft);
    background: var(--kelp-wash);
  }

  .btn:active {
    transform: translateY(1px);
  }

  .btn--primary {
    background: var(--kelp);
    border-color: var(--kelp);
    color: var(--paper);
  }

  .btn--primary:hover {
    background: var(--kelp);
    border-color: var(--kelp);
    filter: brightness(1.12);
  }

  .btn--quiet {
    border-color: transparent;
    background: transparent;
    color: var(--ink-soft);
    padding-inline: 0.5rem;
  }

  .btn--danger:hover {
    border-color: var(--cranberry);
    background: var(--cranberry-wash);
    color: var(--cranberry);
  }

  .btn[aria-pressed='true'] {
    background: var(--kelp);
    border-color: var(--kelp);
    color: var(--paper);
  }

  /* ——— form fields ——— */

  input[type='text'],
  input[type='date'],
  input[type='search'],
  textarea,
  select {
    font: inherit;
    width: 100%;
    padding: 0.55rem 0.7rem;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    transition: border-color var(--transition);
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--ink-faint);
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: var(--kelp);
  }

  textarea {
    min-height: 7rem;
    resize: vertical;
    line-height: 1.6;
  }

  label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--ink-soft);
    margin-bottom: 0.3rem;
  }

  /* ——— cards ——— */

  .card {
    background: var(--surface);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
  }

  /* ——— access + tag chips ——— */

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
    background: var(--fog);
    color: var(--ink-soft);
  }

  .chip--easy {
    background: var(--kelp-wash);
    color: var(--kelp);
  }

  .chip--partial {
    background: var(--sand-wash);
    color: var(--sand);
  }

  .chip--hard {
    background: var(--cranberry-wash);
    color: var(--cranberry);
  }

  .chip--flag {
    background: var(--tide-wash);
    color: var(--tide);
  }

  /* ——— empty states ——— */

  .empty {
    padding: 3rem 1.5rem;
    text-align: center;
    color: var(--ink-faint);
    border: 1px dashed var(--line);
    border-radius: var(--radius-lg);
  }

  .empty strong {
    display: block;
    font-family: var(--display);
    font-size: 1.05rem;
    color: var(--ink-soft);
    margin-bottom: 0.35rem;
  }
`);

export default sheet;
