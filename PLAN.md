# Improvement plan

Ordered by priority. Nothing here needs a build step or a framework —
that constraint is a feature of the project, not a gap to fix.

Items 1–5 below are done as of this pass. The "nice-to-haves" section
(item 6) is intentionally still open — deferred at your call, not because
it's not worth doing.

## 1. ✅ Fix the broken file layout (blocking — the app did not run)

Every file has been moved into the nested structure the imports already
assumed:

```
index.html
styles/main.css
js/main.js
js/dates.js
js/store.js
js/shared-styles.js
js/events/bus.js
js/data/places.js
js/data/events.js
js/components/*.js
```

Verified with `node --check` on every module, a static import-graph walk
(every relative `import`/`src`/`href` resolves to a real file), and
serving the folder with `python3 -m http.server` and curling every path
`index.html` and the component modules reference — all 200s. No headless
browser was available in this environment to click through the UI, so
that's still worth doing once by hand before the trip.

## 2. ✅ Cover localStorage state in backup/restore

`js/store.js`'s `exportAll()`/`importAll()` now read and write
`sabbatical:events` (the saved-event ids from What's On) alongside the
IndexedDB stores, so a backup is a complete snapshot again. Restoring an
older (version 1) backup that predates this — one with no `savedEvents`
key — clears saved events to empty, consistent with how restore already
treats every other store. `event-list.js` listens for a new
`events:restored` bus message (emitted by `journal-log.js` after a
successful restore) and reloads from localStorage.

## 3. ✅ Add a lightweight persistence layer for IndexedDB failures

`store.put`, `store.remove` and `store.clear` in `js/store.js` now catch
failures, emit a `layout:toast` describing the problem, and rethrow. This
is centralized rather than added at every call site, per the original
plan note — most call sites don't need to change. One caller
(`journal-log.js`'s `#save()`) was updated to stop after a failed write
instead of continuing on to a misleading "Saved" toast.

## 4. ✅ Basic smoke tests

`tests/index.html` + `tests/smoke.js` — a plain `<script type="module">`
page, no dependencies. Covers the date-window math in `dates.js` (bounds,
round-trip, `inWindow`, `formatRange`) and a round trip through the
generic `store.put`/`get`/`remove` accessors using one disposable record.
Deliberately does *not* exercise `importAll()`'s destructive restore path
against the real database — see the comment at the top of `smoke.js` for
why, and treat "click through backup → restore once by hand with a
throwaway browser profile" as the remaining manual check there.

## 5. ✅ Data upkeep

- Lincoln City Fall Kite Festival: confirmed against Explore Lincoln
  City's own event page. Night fly the evening of Sep 25, full festival
  days Sep 26–27, temporarily at Chinook Winds Casino Resort while the
  D River Welcome Center is under construction. `verify: true` removed;
  the note now explains the venue change instead.
- `js/store.js` has a comment on `DB_VERSION` explaining that any future
  schema change needs a version bump and an `onupgradeneeded` branch keyed
  on `event.oldVersion` — there's nothing to migrate yet, so no code
  changed here beyond the comment.

## 6. Nice-to-haves (still open — not done in this pass)

- `place-list.js` and `goal-board.js` use `prompt()`/`confirm()` for notes
  and destructive actions. Fine for a personal tool, but they block the
  main thread and look dated; swapping in `<app-modal>` (already built for
  exactly this) would be a small, consistent upgrade.
- No `favicon`/`manifest.json` — low effort, makes the pinned tab and
  "add to home screen" case nicer for a month-long daily-use app.
- No offline support. Since everything already lives in IndexedDB, a
  minimal service worker caching the static shell would let the journal
  work with no signal on the coast.
- `formatRange()` in `dates.js` is still unused anywhere in the codebase —
  either wire it in (e.g. multi-day event display in `event-list.js`,
  which currently hand-rolls the same range formatting inline) or remove
  it.
