/**
 * Entry point. Importing each component module is what registers it —
 * every file calls customElements.define() on load.
 */

import './components/app-layout.js';
import './components/app-tabs.js';
import './components/app-modal.js';
import './components/day-strip.js';
import './components/place-list.js';
import './components/event-list.js';
import './components/goal-board.js';
import './components/idea-picker.js';
import './components/journal-log.js';

import { bus } from './events/bus.js';
import { status } from './dates.js';

const layout = document.querySelector('app-layout');
const tabs = document.querySelector('app-tabs');

/* Restore the theme before first paint so there is no flash. */
layout.setAttribute('theme', localStorage.getItem('sabbatical:theme') ?? 'light');

/* Tab badges: each panel reports its own count over the bus. */
const TAB_INDEX = { places: 0, events: 1, goals: 2, ideas: 3, journal: 4 };

bus.on('places:count', ({ detail }) => tabs.setCount(TAB_INDEX.places, detail.saved));
bus.on('events:changed', ({ detail }) => tabs.setCount(TAB_INDEX.events, detail.saved));
bus.on('goals:count', ({ detail }) => tabs.setCount(TAB_INDEX.goals, detail.total));
bus.on('entries:count', ({ detail }) => tabs.setCount(TAB_INDEX.journal, detail.total));

/* Opening a day from the strip or the calendar jumps to Notes. */
bus.on('journal:open-day', () => tabs.select(TAB_INDEX.journal));

/* Remember which tab you were on. */
tabs.addEventListener('tabs:change', (event) => {
  localStorage.setItem('sabbatical:tab', String(event.detail.to));
});

customElements.whenDefined('app-tabs').then(() => {
  const saved = Number(localStorage.getItem('sabbatical:tab') ?? 0);
  if (saved > 0) tabs.select(saved);
});

bus.emit('app:ready', status());
