/**
 * Persistence for everything you create during the sabbatical.
 *
 * IndexedDB rather than localStorage because photos are stored as real Blobs.
 * localStorage caps out around 5 MB and would fall over on the first photo.
 *
 * Object stores
 *   entries      { id, date, title, body, placeId, created, updated }
 *   photos       { id, date, blob, caption, created }
 *   goals        { id, text, kind, done, notes, start, end, created }
 *   placeState   { id, status, note, plannedDate }
 *   customEvents { id, name, where, start, end, note, tags, created }
 *
 * A few small bits of state live in localStorage instead (theme, last-open
 * tab, saved events — see SAVED_EVENTS_KEY below) because they're simple
 * scalars nobody needs to query or index. Saved events are folded into the
 * backup file below so `exportAll`/`importAll` stay a complete snapshot.
 */

import { bus } from './events/bus.js';

const DB_NAME = 'sabbatical';

/**
 * Bump this and add a branch in `onupgradeneeded` (keyed on
 * `event.oldVersion`) whenever the object store shape changes.
 *
 *   1 -> 2  added the `customEvents` store (hand-added events, distinct
 *           from the curated list in data/events.js).
 */
const DB_VERSION = 2;

/** localStorage key for the ids of events you've saved in What's On. */
const SAVED_EVENTS_KEY = 'sabbatical:events';

/** @type {Promise<IDBDatabase>|null} */
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('entries')) {
        const entries = db.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('photos')) {
        const photos = db.createObjectStore('photos', { keyPath: 'id' });
        photos.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('goals')) {
        db.createObjectStore('goals', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('placeState')) {
        db.createObjectStore('placeState', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('customEvents')) {
        const customEvents = db.createObjectStore('customEvents', { keyPath: 'id' });
        customEvents.createIndex('start', 'start');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

async function tx(storeName, mode, work) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try {
      result = work(store);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result?.result ?? result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** Short, sortable, collision-resistant id. */
export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ——— generic accessors ———
 *
 * Writes are wrapped so a failure (a full disk, a blocked/broken database,
 * private-browsing quirks) shows up as a toast instead of vanishing as a
 * silent rejected promise. The error is still rethrown, so callers that
 * care can catch it themselves; callers that don't still leave the user
 * with an explanation. */

export const store = {
  /**
   * Read every record in a store, newest first where a `created` field exists.
   * @param {'entries'|'photos'|'goals'|'placeState'|'customEvents'} name
   */
  async all(name) {
    const rows = await tx(name, 'readonly', (s) => s.getAll());
    return rows.sort((a, b) => (b.created ?? 0) - (a.created ?? 0));
  },

  /** Read one record by key. */
  get(name, id) {
    return tx(name, 'readonly', (s) => s.get(id));
  },

  /** Insert or replace a record. Returns the record. */
  async put(name, record) {
    try {
      await tx(name, 'readwrite', (s) => s.put(record));
      return record;
    } catch (error) {
      bus.emit('layout:toast', `Couldn't save — ${error?.message ?? 'storage error'}`);
      throw error;
    }
  },

  /** Delete a record by key. */
  async remove(name, id) {
    try {
      return await tx(name, 'readwrite', (s) => s.delete(id));
    } catch (error) {
      bus.emit('layout:toast', `Couldn't delete — ${error?.message ?? 'storage error'}`);
      throw error;
    }
  },

  /** Empty a store completely. */
  async clear(name) {
    try {
      return await tx(name, 'readwrite', (s) => s.clear());
    } catch (error) {
      bus.emit('layout:toast', `Couldn't clear ${name} — ${error?.message ?? 'storage error'}`);
      throw error;
    }
  },
};

/* ——— backup ——— */

const BLOB_STORES = new Set(['photos']);

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

/** Ids of events saved in What's On, read straight from localStorage. */
function readSavedEvents() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_EVENTS_KEY) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/**
 * Everything you've written, as one JSON-safe object. Photos are inlined as
 * data URLs, so a backup with a lot of photos in it will be large.
 */
export async function exportAll() {
  const [entries, photos, goals, placeState, customEvents] = await Promise.all([
    store.all('entries'),
    store.all('photos'),
    store.all('goals'),
    store.all('placeState'),
    store.all('customEvents'),
  ]);

  const encodedPhotos = await Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      blob: undefined,
      dataUrl: await blobToDataUrl(photo.blob),
    })),
  );

  return {
    format: 'sabbatical-backup',
    version: 3,
    exported: new Date().toISOString(),
    entries,
    photos: encodedPhotos,
    goals,
    placeState,
    customEvents,
    savedEvents: readSavedEvents(),
  };
}

/**
 * Replace the current contents with a backup produced by exportAll. Older
 * backups don't have every field — version 1 has no `savedEvents`, version
 * 2 has no `customEvents`. Restoring either clears the missing store to
 * empty, same as it clears every other store, so "restore" consistently
 * means "replace everything" regardless of backup age.
 * @param {object} backup
 * @returns {Promise<{entries:number, photos:number, goals:number, places:number, events:number, customEvents:number}>}
 */
export async function importAll(backup) {
  if (backup?.format !== 'sabbatical-backup') {
    throw new Error('That file is not a sabbatical backup.');
  }

  await Promise.all(
    ['entries', 'photos', 'goals', 'placeState', 'customEvents'].map((name) => store.clear(name)),
  );

  for (const entry of backup.entries ?? []) await store.put('entries', entry);
  for (const goal of backup.goals ?? []) await store.put('goals', goal);
  for (const place of backup.placeState ?? []) await store.put('placeState', place);
  for (const event of backup.customEvents ?? []) await store.put('customEvents', event);
  for (const photo of backup.photos ?? []) {
    const { dataUrl, ...rest } = photo;
    await store.put('photos', { ...rest, blob: await dataUrlToBlob(dataUrl) });
  }

  const savedEvents = Array.isArray(backup.savedEvents) ? backup.savedEvents : [];
  localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(savedEvents));

  return {
    entries: backup.entries?.length ?? 0,
    photos: backup.photos?.length ?? 0,
    goals: backup.goals?.length ?? 0,
    places: backup.placeState?.length ?? 0,
    events: savedEvents.length,
    customEvents: backup.customEvents?.length ?? 0,
  };
}

export { BLOB_STORES, SAVED_EVENTS_KEY };
