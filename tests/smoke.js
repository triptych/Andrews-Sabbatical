/**
 * Smoke tests for the date math and the storage layer.
 *
 * No test runner, no dependency — just assertions run in the browser and
 * rendered to the page. Open tests/index.html through the same static
 * server used for the app (ES modules need one either way).
 *
 * Deliberately does NOT exercise `importAll()`'s destructive restore path
 * (it clears every IndexedDB store before repopulating) or anything else
 * that would touch real journal data. What it does cover:
 *   - the 32-day window and its date-key math in ../js/dates.js
 *   - a round trip through the generic store.put/get/remove accessors,
 *     using a single disposable record that's removed immediately after
 *   - exportAll()'s shape (read-only, safe to call any time)
 *   - importAll()'s format guard, which throws before touching storage
 */

import {
  START,
  END,
  DAYS,
  TOTAL_DAYS,
  toKey,
  fromKey,
  daysBetween,
  inWindow,
  formatRange,
  formatShort,
} from '../js/dates.js';
import { store, newId, exportAll, importAll } from '../js/store.js';

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'assertion failed');
}

async function test(name, fn) {
  try {
    await fn();
    record(name, true);
  } catch (error) {
    record(name, false, error.message);
  }
}

async function run() {
  await test('DAYS spans exactly START..END, 32 days', () => {
    assert(DAYS.length === TOTAL_DAYS, `DAYS.length (${DAYS.length}) !== TOTAL_DAYS (${TOTAL_DAYS})`);
    assert(TOTAL_DAYS === 32, `expected a 32-day window, got ${TOTAL_DAYS}`);
    assert(DAYS[0] === START, `first day should be START (${START}), got ${DAYS[0]}`);
    assert(DAYS.at(-1) === END, `last day should be END (${END}), got ${DAYS.at(-1)}`);
  });

  await test('toKey/fromKey round-trip', () => {
    for (const key of [START, '2026-09-20', END]) {
      assert(toKey(fromKey(key)) === key, `round trip failed for ${key}`);
    }
  });

  await test('daysBetween matches the window length', () => {
    assert(
      daysBetween(START, END) === TOTAL_DAYS - 1,
      `daysBetween(START, END) should be ${TOTAL_DAYS - 1}, got ${daysBetween(START, END)}`,
    );
    assert(daysBetween('2026-09-08', '2026-09-09') === 1);
    assert(daysBetween('2026-09-09', '2026-09-08') === -1);
  });

  await test('inWindow respects the boundary', () => {
    assert(inWindow(START) === true);
    assert(inWindow(END) === true);
    assert(inWindow('2026-09-07') === false, 'the day before START should be out of window');
    assert(inWindow('2026-10-10') === false, 'the day after END should be out of window');
  });

  await test('formatRange collapses a same-month range', () => {
    assert(formatRange(START, START) === formatShort(START), 'single-day range should equal formatShort');
    const range = formatRange('2026-09-12', '2026-09-13');
    assert(range === 'Sep 12 – 13', `expected "Sep 12 – 13", got "${range}"`);
  });

  await test('store.put/get/remove round trip (disposable record)', async () => {
    const id = `smoketest-${newId()}`;
    const record = { id, text: 'smoke test', kind: 'project', done: false, notes: '', created: Date.now() };
    try {
      await store.put('goals', record);
      const back = await store.get('goals', id);
      assert(back?.id === id, 'read-back record missing or id mismatch');
      assert(back?.text === 'smoke test', 'read-back record text mismatch');
    } finally {
      await store.remove('goals', id);
    }
    const gone = await store.get('goals', id);
    assert(gone === undefined, 'record still present after remove');
  });

  await test('customEvents store round trip (disposable record)', async () => {
    const id = `smoketest-${newId()}`;
    const record = { id, name: 'smoke test event', where: 'nowhere', start: '2026-09-10', created: Date.now() };
    try {
      await store.put('customEvents', record);
      const back = await store.get('customEvents', id);
      assert(back?.id === id, 'read-back record missing or id mismatch');
      assert(back?.name === 'smoke test event', 'read-back record name mismatch');
    } finally {
      await store.remove('customEvents', id);
    }
    const gone = await store.get('customEvents', id);
    assert(gone === undefined, 'record still present after remove');
  });

  await test('customIdeas store round trip (disposable record)', async () => {
    const id = `smoketest-${newId()}`;
    const record = { id, text: 'smoke test idea', tags: ['home'], created: Date.now() };
    try {
      await store.put('customIdeas', record);
      const back = await store.get('customIdeas', id);
      assert(back?.id === id, 'read-back record missing or id mismatch');
      assert(back?.text === 'smoke test idea', 'read-back record text mismatch');
    } finally {
      await store.remove('customIdeas', id);
    }
    const gone = await store.get('customIdeas', id);
    assert(gone === undefined, 'record still present after remove');
  });

  await test('exportAll returns the expected shape (read-only)', async () => {
    const data = await exportAll();
    assert(data.format === 'sabbatical-backup', 'unexpected format field');
    assert(Array.isArray(data.entries), 'entries should be an array');
    assert(Array.isArray(data.photos), 'photos should be an array');
    assert(Array.isArray(data.goals), 'goals should be an array');
    assert(Array.isArray(data.placeState), 'placeState should be an array');
    assert(Array.isArray(data.savedEvents), 'savedEvents should be an array');
    assert(Array.isArray(data.customEvents), 'customEvents should be an array');
    assert(Array.isArray(data.customIdeas), 'customIdeas should be an array');
  });

  await test('importAll rejects a non-backup file before touching storage', async () => {
    let threw = false;
    try {
      await importAll({ format: 'not-a-backup' });
    } catch {
      threw = true;
    }
    assert(threw, 'importAll should have thrown for an unrecognized format');
  });

  render();
}

function render() {
  const root = document.getElementById('results');
  const passed = results.filter((r) => r.pass).length;

  root.innerHTML = `
    <p><strong>${passed} / ${results.length} passed</strong></p>
    <ul>
      ${results
        .map(
          (r) => `
        <li style="color:${r.pass ? '#2c5a4e' : '#8d2338'}">
          ${r.pass ? '✓' : '✗'} ${r.name}
          ${r.detail ? `<br><code>${r.detail}</code>` : ''}
        </li>`,
        )
        .join('')}
    </ul>
  `;

  if (passed < results.length) document.title = `✗ ${document.title}`;
}

run();
