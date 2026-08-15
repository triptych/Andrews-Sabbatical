# Off the clock

A trip planner, goal keeper and notebook for a sabbatical based in Cottage
Grove, Oregon, Sep 8 – Oct 9 2026.

Vanilla HTML, CSS and JS. No build step, no dependencies, no framework.

## Running it

ES modules are blocked over `file://`, so it needs a server:

```sh
cd sabbatical
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Any static server works — `npx serve`,
`caddy file-server`, whatever you already have.

Modern browsers only. It uses constructed stylesheets
(`adoptedStyleSheets`), which rules out anything older than Chrome 73,
Safari 16.4 or Firefox 101.

## Testing

`tests/index.html` is a small dependency-free smoke test page — open it
through the same static server (`http://localhost:8000/tests/`). It checks
the date-window math in `js/dates.js` and does a round trip through the
`js/store.js` accessors using one disposable record, so it's safe to run
without touching your real journal data. It does not exercise the
destructive restore path in `importAll()` — see `PLAN.md`.

## The four tabs

**Places** — 31 spots within about three hours, sorted by drive time.
Filter by region, drive time, accessibility or kind (a curated shortlist of
tags — `cozy`, `quirky`, `coast`, `nature`, `tidepools`, `town`, `wildlife`,
`rainy-day`, `free`). Mark somewhere as *want to go* or *been*, attach a
note, or pin it to a date. Pinning a date lights that day up on the strip.

**What's on** — 25 curated events that fall inside the window, plus two good
ones ("near misses") just past the end in case you want to stretch, plus
anything you add yourself under "Add your own event" (name, where, dates,
optional drive time, note and tags — a "yours" chip marks them apart, and
they can be removed). Filter by coast, quirky, harvest, music, "only my
picks" (which includes everything you've added), or under 90 minutes'
drive. "Open in Notes" jumps to the composer with that day already
selected. An event with an `end` date spans multiple days and lights up
every one of them on the day strip.

**Goals** — split into projects (have a finish line, get checked off) and
goals (a way to spend the time, get progress notes instead). Either kind
can optionally carry a start/end date range (the "dates" button on each
item) — set one and that goal lights up on the day strip for every day in
range.

**Notes** — one entry per day, with photos. The composer always shows which
day you're on in plain language ("You're on Sunday, September 13") right
above a "planned for this day" list — anything pinned, saved, or scheduled
for that date from Places, What's On or Goals, so you can see the Coburg
Antique Fair (or whatever else) without having to remember you saved it.
Both update the moment you change the date, whether by typing, using the
picker, or jumping in from a day-strip block or an event's "Open in Notes"
button. Drag images onto the drop zone or click to pick. Click any photo in
the log to open it larger. Export/restore the whole journal as a JSON
backup.

## The day strip

The bar under the masthead is 32 blocks, one per day of the sabbatical.
Height and background color encode the day's headline state:

| Block | Meaning |
| --- | --- |
| short, grey | still ahead of you |
| short, sage | elapsed with nothing logged |
| medium, cranberry | something pinned to that date (a planned place visit) |
| tall, kelp | you've written that day up |
| full height, black | today |

A day can carry more than one kind of thing at once, though — written up
*and* home to an event, say. Small colored bars stacked inside each block
show that finer detail: kelp for a journal entry, cranberry for a planned
place visit, blue (tide) for an event happening that day (from your saved
picks in What's On or anything you added yourself), and gold (sand) for a
goal whose date range includes that day. A bar is only drawn when it isn't
already redundant with the block's own color — e.g. a written-up day
doesn't also draw a kelp bar. Multi-day events and goal ranges light up
every day they span, not just the start.

Hover or focus a block for a tooltip with the specifics — full date, plus
one line per journal entry, planned visit, event and goal on it.

The row of chips below the strip filters *which* days stand out: click
"anything" to dim every day with nothing on it, or one of the specific
kinds (written up / booked / event / goal) to dim every day without that
particular kind. Days aren't hidden or reordered — only dimmed — since a
block's position in the strip is itself information (which day of the trip
it is).

Click any block to open that day in Notes.

## Your data

Most of what you create lives in **IndexedDB**, in a database named
`sabbatical` (currently version 2 — see the migration note in `js/store.js`
before ever bumping it again), with five object stores:

| Store | Shape | Notes |
| --- | --- | --- |
| `entries` | `{ id, date, title, body, placeId, created, updated }` | one journal entry; indexed by `date` |
| `photos` | `{ id, entryId, date, blob, caption, created }` | real `Blob`s; indexed by `date` |
| `goals` | `{ id, text, kind, done, notes, start, end, created }` | `kind` is `project` or `goal`; `start`/`end` are optional YYYY-MM-DD |
| `placeState` | `{ id, status, note, plannedDate }` | `status` is `none`, `want` or `been`; `id` matches a place in `data/places.js` |
| `customEvents` | `{ id, name, where, start, end, drive, note, tags, created }` | events you added yourself in What's On; `end`, `drive`, `note`, `tags` are optional; indexed by `start` |

IndexedDB rather than localStorage specifically because of photos — they're
stored as real `Blob`s, and localStorage's ~5 MB ceiling would have died on
the first upload.

Every write goes through `store.put`/`store.remove`/`store.clear` in
`js/store.js`, which catch failures centrally and raise a `layout:toast`
describing what went wrong (a full disk, a blocked database, private
browsing) rather than failing silently.

A few smaller bits of state live in **localStorage** instead:

| Key | Holds | In backup/restore? |
| --- | --- | --- |
| `sabbatical:theme` | `light` or `dark` | no — display preference, not trip data |
| `sabbatical:tab` | index of the last-open tab | no — display preference, not trip data |
| `sabbatical:events` | ids of events you've saved in What's On | **yes** |

**Back it up.** Clearing site data wipes IndexedDB and localStorage alike.
The *Back up* button in Notes downloads a JSON file with entries, photos,
goals, place state, and saved events, photos inlined as data URLs (so a
backup with a lot of photos will be a big file). *Restore* replaces all of
that with the backup's contents — theme and last-open tab are left alone
since they're not part of the trip data.

## Layout

```
index.html
styles/main.css            design tokens, reset, light + dark palettes
js/
  main.js                  entry point; imports register the elements, wires tab badges
  dates.js                 the fixed 32-day window and its helpers
  store.js                 IndexedDB wrapper, export/import
  shared-styles.js         one constructed stylesheet, adopted by every shadow root
  events/bus.js            singleton EventBus over EventTarget
  data/places.js           the 31 places
  data/events.js           the 25 events (+ 2 near-misses)
  components/
    app-layout.js          shell, theme toggle, footer status line
    app-tabs.js             <app-tabs> over slotted <tab-panel>, arrow-key navigation
    app-modal.js            focus-trapping dialog
    day-strip.js            the 32-day tally
    place-list.js           filterable place browser
    event-list.js           the calendar
    goal-board.js           projects and goals
    journal-log.js          composer, log, backup/restore
```

Every component uses Shadow DOM. Custom properties declared on `:root` in
`main.css` still inherit through the shadow boundary, so the tokens are
defined once; everything else shared (buttons, inputs, chips, cards, empty
states) lives in `shared-styles.js` as one constructed stylesheet, adopted
by every component alongside its own local one.

Components never hold references to each other — they talk over the bus:

```js
import { bus } from './js/events/bus.js';

bus.on('entries:changed', () => console.log('journal updated'));
bus.on('tabs:change', ({ detail }) => console.log(detail)); // { from, to, label }
bus.emit('journal:open-day', { date: '2026-09-20' });
```

Messages in use:

| Message | Detail | Emitted by | Heard by |
| --- | --- | --- | --- |
| `app:ready` | `status()` result | `main.js` | — |
| `layout:ready` | `{ theme }` | `app-layout` | — |
| `layout:toast` | string | any component | `app-layout` (shows a footer toast for 4s) |
| `modal:request-open` | `{ title?, node?, html? }` | any component | `app-modal` |
| `modal:request-close` | — | any component | `app-modal` |
| `journal:open-day` | `{ date }` | `day-strip`, `event-list` | `journal-log` (focuses composer), `main.js` (switches to Notes tab) |
| `entries:changed` | — | `journal-log` | `day-strip`, `journal-log` itself |
| `entries:count` | `{ total }` | `journal-log` | `main.js` (Notes tab badge) |
| `goals:changed` | — | `goal-board` | `day-strip`, `journal-log` (planned-for-this-day list), `goal-board` itself |
| `goals:count` | `{ total }` | `goal-board` | `main.js` (Goals tab badge) |
| `places:changed` | `{ id }` | `place-list` | `day-strip`, `journal-log` (planned-for-this-day list), `place-list` itself |
| `places:count` | `{ total, saved }` | `place-list` | `main.js` (Places tab badge) |
| `events:changed` | `{ saved }` | `event-list` (on save/unsave, adding/removing a custom event, and after a restore) | `day-strip`, `journal-log` (planned-for-this-day list), `main.js` (What's On tab badge) |
| `events:restored` | — | `journal-log`, after a successful restore | `event-list` (reloads saved ids and custom events), `day-strip`, `journal-log` itself (planned-for-this-day list) |

Each component also fires plain DOM `CustomEvent`s where a parent needs
them directly rather than over the bus: `app-tabs` dispatches `tabs:change`
on itself, and `app-modal` dispatches `modal:open` / `modal:close`.

## About the data

Drive times are approximate one-way estimates from Cottage Grove. Highway
101 and the Coast Range roads slow down in rain.

Accessibility notes came from Travel Oregon, the Oregon Coast Visitors
Association and Oregon State Parks. `accessLevel` is a rough sort key, not
a guarantee — call ahead when it matters. Two things worth knowing:

- **Sea Lion Caves is not accessible**, despite the elevator. Roughly 37
  steps inside the building before the trails, then 400 yards at 10–20%
  grade, then 63 more steps in the cave. It's marked `hard` for that reason.
- **Cape Perpetua's Captain Cook Trail is paved** all the way to the
  wheelchair-accessible viewing point over Thor's Well and the Spouting
  Horn. The upper Overlook viewpoints have stairs.

Mobi-Mats and loaner beach wheelchairs are seasonal and get pulled in bad
weather. David's Chair track chairs need reserving ahead.

The Lincoln City Fall Kite Festival date was disputed between two source
ranges; confirmed against Explore Lincoln City's own event page as a night
fly on Sep 25 followed by full festival days Sep 26–27, temporarily at
Chinook Winds Casino Resort while the D River Welcome Center is under
construction.

## Editing the data

`js/data/places.js` and `js/data/events.js` are plain exported arrays. Add
to them and the UI picks the entries up — `REGIONS` and `TAGS` are derived
from `PLACES` automatically. `FILTER_TAGS` is a curated shortlist and needs
editing by hand (showing all tags in use turned the filter bar into a
wall). `EVENTS` and `NEAR_MISSES` are both plain arrays in `data/events.js`;
an event only needs `id`, `name`, `where`, `start`, `drive`; `end`, `tags`,
`note` and `verify` are optional.

## Accessibility notes on the app itself

Tabs, filter pills, and the goal checkboxes use proper ARIA roles
(`tablist`/`tab`/`tabpanel`, `switch`, `checkbox`) and `app-tabs` supports
arrow-key / Home / End navigation. `app-modal` traps focus and restores it
to whatever was focused before opening. `:not(:defined)` hides
custom elements until their module has registered, to avoid a flash of
unstyled content. `prefers-reduced-motion` is respected globally.

## What's not here

No build step, no bundler, no linter config, no `package.json`. Nothing is
transpiled — the code relies on baseline modern browser features (ES
modules, custom elements, Shadow DOM, constructed stylesheets,
`IndexedDB`). There's a small dependency-free smoke test page (see
Testing, above) but no full test suite. See `PLAN.md` for suggestions on
closing some of these gaps.
