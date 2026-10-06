const express = require('express');
const cache = require('./cache');
const { getFromProvider, secondsUntilBudget } = require('./providerClient');

const router = express.Router();

async function handle(req, res) {
  // Same request = same key, even if query params are in a different order
  const u = new URL(req.url, 'http://localhost');
  u.searchParams.sort();
  const key = u.pathname + u.search;

  const entry = cache.get(key);

  // 1. Fresh saved answer: return it
  if (cache.isFresh(entry)) {
    res.set('X-Cache', 'HIT');
    return res.status(entry.status).json(entry.body);
  }

  // Helper: send the old copy if we have one
  const sendStale = (reason) => {
    if (!entry) return false;
    res.set('X-Cache', 'STALE');
    res.set('X-Cache-Reason', reason);
    res.status(entry.status).json(entry.body);
    return true;
  };

  // 2. Get it from the provider (or share someone else's fetch)
  const promise = getFromProvider(key);

  // 3. No budget left
  if (!promise) {
    if (sendStale('rate-limit')) return;
    res.set('Retry-After', String(secondsUntilBudget()));
    return res
      .status(429)
      .json({ error: 'Gateway is at its request limit. Try again shortly.' });
  }

  try {
    const result = await promise;

    if (result.status === 200) {
      cache.set(key, result);
      res.set('X-Cache', 'MISS');
      return res.status(200).json(result.body);
    }

    // Provider rate-limiting us or failing: use the old copy if we have one
    if (result.status === 429 || result.status >= 500) {
      if (sendStale('provider-error')) return;
    }
    return res.status(result.status).json(result.body);
  } catch (err) {
    if (sendStale('provider-down')) return;
    return res.status(502).json({ error: 'Could not reach the football provider' });
  }
}

// One gateway endpoint for each provider endpoint
const endpoints = [
  '/areas',
  '/areas/:id',
  '/competitions',
  '/competitions/:id',
  '/competitions/:id/standings',
  '/competitions/:id/matches',
  '/competitions/:id/teams',
  '/competitions/:id/scorers',
  '/matches',
  '/matches/:id',
  '/matches/:id/head2head',
  '/teams',
  '/teams/:id',
  '/teams/:id/matches',
  '/persons/:id',
  '/persons/:id/matches',
];

endpoints.forEach((path) => router.get(path, handle));

// Anything else is not a valid endpoint
router.use((req, res) => res.status(404).json({ error: 'Unknown endpoint' }));

module.exports = router;