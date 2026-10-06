# Livescore Gateway

A small Express server that sits between the FootballMania app and football-data.org.
The app calls this instead of calling the provider directly.

- Each endpoint below is forwarded to the provider, and the response is saved for 1 minute.
- Repeat requests inside that minute are served from the saved copy.
- If many identical requests arrive together, only one goes to the provider.
- The free plan allows 10 requests/minute, so the gateway stops at 9.
- If the provider fails, the last saved copy is returned when there is one.

## Run it
1. `npm install`
2. Copy `.env.example` to `.env` and add your API key
3. `npm start`

## Endpoints (all GET, under /api)
`/areas`, `/areas/:id`, `/competitions`, `/competitions/:id`, `/competitions/:id/standings`,
`/competitions/:id/matches`, `/competitions/:id/teams`, `/competitions/:id/scorers`,
`/matches`, `/matches/:id`, `/matches/:id/head2head`, `/teams`, `/teams/:id`,
`/teams/:id/matches`, `/persons/:id`, `/persons/:id/matches`

Query filters (like `?dateFrom=...&dateTo=...`) are passed through to the provider.
`/health` checks the server is running.

## Notes
- `X-Cache` response header: HIT = from cache, MISS = from provider, STALE = old copy used.
- CORS is on. Set `ALLOWED_ORIGIN` to the web app's address when deploying; if unset, any site can call it.
- Provider calls time out after 10 seconds.
- The cache is in memory, so it resets on restart. Several servers would need Redis.