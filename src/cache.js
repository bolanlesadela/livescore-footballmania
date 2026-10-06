const { CACHE_TTL_MS, STALE_MAX_MS } = require('./config');

const store = new Map();

function get(key) {
  return store.get(key);
}

function set(key, result) {
  store.set(key, { ...result, expires: Date.now() + CACHE_TTL_MS });
}

// Is this saved answer still under a minute old?
function isFresh(entry) {
  return Boolean(entry) && entry.expires > Date.now();
}

// Every minute, delete copies that are too old to be useful
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expires + STALE_MAX_MS <= now) store.delete(key);
  }
}, 60 * 1000).unref();

module.exports = { get, set, isFresh };