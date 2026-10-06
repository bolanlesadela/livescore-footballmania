const { BASE_URL, API_KEY, MAX_CALLS_PER_MINUTE } = require('./config');

const inFlight = new Map(); // requests being fetched right now
let callTimes = [];         // when we last called the provider

// Do we still have room to call the provider this minute?
function budgetLeft() {
  const now = Date.now();
  callTimes = callTimes.filter((t) => now - t < 60 * 1000);
  return callTimes.length < MAX_CALLS_PER_MINUTE;
}

// Seconds until a call slot frees up (used for the Retry-After hint)
function secondsUntilBudget() {
  if (callTimes.length === 0) return 1;
  return Math.max(1, Math.ceil((callTimes[0] + 60 * 1000 - Date.now()) / 1000));
}

// Actually calls the provider
async function callProvider(key) {
  const upstream = await fetch(BASE_URL + key, {
    headers: { 'X-Auth-Token': API_KEY },
    signal: AbortSignal.timeout(10000), // give up after 10 seconds
  });
  const body = await upstream.json();
  return { status: upstream.status, body };
}

// Returns a promise for the answer, or null if we're out of budget.
function getFromProvider(key) {
  const existing = inFlight.get(key);
  if (existing) return existing;      // someone is already fetching it: share

  if (!budgetLeft()) return null;     // no budget: caller must handle it

  callTimes.push(Date.now());
  const promise = callProvider(key).finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

module.exports = { getFromProvider, secondsUntilBudget };